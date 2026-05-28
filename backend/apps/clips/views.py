from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from apps.utils.youtube import extract_video_id, fetch_youtube_transcript, fetch_youtube_metadata
from apps.utils.gemini_ai import simplify_subtitles as simplify_subtitles_with_ai
from bson import ObjectId
from datetime import datetime
from audiofit.db import routines_collection
from .models import Clip
from .serializers import ClipSerializer


class ClipViewSet(viewsets.ModelViewSet):
    """유튜브 클립 관리 및 자막 추출 API"""
    queryset = Clip.objects.all()
    serializer_class = ClipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # 현재 사용자의 클립만 조회
        return Clip.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def transcript(self, request):
        """
        유튜브 URL에서 자막을 추출합니다.
        (인증 불필요 - 누구나 접근 가능)
        """
        youtube_url = request.data.get('youtube_url', '').strip()
        
        if not youtube_url:
            return Response(
                {'error': '유튜브 URL을 입력해주세요.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # [수정 반영] URL에서 video_id 추출하는 누락된 로직 추가
        video_id = extract_video_id(youtube_url)
        if not video_id:
            return Response(
                {'error': '유효한 유튜브 URL이 아닙니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 기존 클립이 있는지 확인 (캐시 히트)
        clip, created = Clip.objects.get_or_create(
            video_id=video_id,
            defaults={'youtube_url': youtube_url, 'user': None}  # 로그인하지 않은 사용자도 조회 가능
        )
        
        # 메타데이터가 없으면 가져오기
        if not clip.title or not clip.duration:
            metadata_result = fetch_youtube_metadata(video_id)
            if metadata_result['success']:
                clip.title = metadata_result['title']
                clip.channel = metadata_result['channel']
                clip.duration = metadata_result['duration']
                clip.save()
        
        # 자막 데이터가 없으면 가져오기
        if not clip.subtitles:
            transcript_result = fetch_youtube_transcript(video_id)
            
            if not transcript_result['success']:
                return Response(
                    {'error': transcript_result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 자막 저장
            clip.subtitles = transcript_result['data']
            clip.save()
        
        serializer = self.get_serializer(clip)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='simplify-subtitles')
    def simplify_subtitles(self, request):
        subtitles = request.data.get('subtitles', [])
        if not isinstance(subtitles, list) or not subtitles:
            return Response(
                {'error': '변환할 자막을 선택해 주세요.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = simplify_subtitles_with_ai(subtitles)
        if not result['success']:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'subtitles': result['data']}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='save-user-clip')
    def save_user_clip(self, request):
        """사용자별 맞춤 자막 편집본을 DB에 저장합니다."""
        video_id = request.data.get('video_id')
        subtitles = request.data.get('subtitles', [])
        youtube_url = request.data.get('youtube_url', '')
        title = request.data.get('title', '')
        channel = request.data.get('channel', '')
        duration = request.data.get('duration', '')

        if not video_id:
            return Response(
                {'error': 'video_id는 필수 항목입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 현재 사용자에게 매핑된 해당 비디오 클립 찾거나 생성
        clip, created = Clip.objects.get_or_create(
            user=request.user,
            video_id=video_id,
            defaults={
                'youtube_url': youtube_url,
                'title': title,
                'channel': channel,
                'duration': duration,
                'subtitles': subtitles
            }
        )

        if not created:
            # 이미 있으면 자막과 정보 업데이트
            clip.subtitles = subtitles
            if title: clip.title = title
            if channel: clip.channel = channel
            if duration: clip.duration = duration
            clip.save()

        serializer = self.get_serializer(clip)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoutineViewSet(viewsets.ViewSet):
    """MongoDB를 사용하는 사용자 운동 루틴 관리 API"""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if routines_collection is None:
            return Response({'error': 'MongoDB가 연결되어 있지 않습니다.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        firebase_uid = request.user.uid
        cursor = routines_collection.find({'user_id': firebase_uid}).sort('created_at', -1)
        
        routines = []
        for doc in cursor:
            routines.append({
                'id': str(doc['_id']),
                'name': doc.get('name', ''),
                'clips': doc.get('clips', []),
                'created_at': doc.get('created_at', '').isoformat() if isinstance(doc.get('created_at'), datetime) else doc.get('created_at')
            })
            
        return Response(routines, status=status.HTTP_200_OK)

    def create(self, request):
        if routines_collection is None:
            return Response({'error': 'MongoDB가 연결되어 있지 않습니다.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        firebase_uid = request.user.uid
        name = request.data.get('name')
        clips = request.data.get('clips', [])

        if not name:
            return Response({'error': '루틴 이름은 필수 항목입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        doc = {
            'user_id': firebase_uid,
            'name': name,
            'clips': clips,
            'created_at': datetime.utcnow()
        }
        
        result = routines_collection.insert_one(doc)
        
        created_routine = {
            'id': str(result.inserted_id),
            'name': name,
            'clips': clips,
            'created_at': doc['created_at'].isoformat()
        }
        
        return Response(created_routine, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        if routines_collection is None:
            return Response({'error': 'MongoDB가 연결되어 있지 않습니다.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        firebase_uid = request.user.uid
        try:
            obj_id = ObjectId(pk)
        except Exception:
            return Response({'error': '유효하지 않은 루틴 ID입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        result = routines_collection.delete_one({'_id': obj_id, 'user_id': firebase_uid})
        if result.deleted_count == 0:
            return Response({'error': '루틴을 찾을 수 없거나 권한이 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
            
        return Response({'message': '루틴이 성공적으로 삭제되었습니다.'}, status=status.HTTP_204_NO_CONTENT)

# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from django.shortcuts import get_object_or_404

# from apps.utils.youtube import extract_video_id, fetch_youtube_transcript, fetch_youtube_metadata
# from .models import Clip
# from .serializers import ClipSerializer


# class ClipViewSet(viewsets.ModelViewSet):
#     """유튜브 클립 관리 및 자막 추출 API"""
#     queryset = Clip.objects.all()
#     serializer_class = ClipSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         # 현재 사용자의 클립만 조회
#         return Clip.objects.filter(user=self.request.user)
    
#     @action(detail=False, methods=['post'])
#     def transcript(self, request):
#         """
#         유튜브 URL에서 자막을 추출합니다.
#         (인증 불필요 - 누구나 접근 가능)
        
#         Request Body:
#         {
#             "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
#         }
        
#         Response:
#         {
#             "id": 1,
#             "youtube_url": "...",
#             "video_id": "...",
#             "title": "...",
#             "channel": "...",
#             "duration": "...",
#             "subtitles": [{"text": "...", "start": 0.54, "duration": 3.21}, ...]
#         }
#         """
#         youtube_url = request.data.get('youtube_url', '').strip()
        
#         if not youtube_url:
#             return Response(
#                 {'error': '유튜브 URL을 입력해주세요.'},
#     status=status.HTTP_400_BAD_REQUEST
#     )

#     # 기존 클립이 있는지 확인 (캐시 히트)
#     clip, created = Clip.objects.get_or_create(
#         video_id=video_id,
#         defaults={'youtube_url': youtube_url, 'user': None}  # 로그인하지 않은 사용자도 조회 가능
#     )

        
#     # 메타데이터가 없으면 가져오기
#     if not clip.title or not clip.duration:
#         metadata_result = fetch_youtube_metadata(video_id)
#         if metadata_result['success']:
#             clip.title = metadata_result['title']
#             clip.channel = metadata_result['channel']
#             clip.duration = metadata_result['duration']
#             clip.save()
    
#     # 자막 데이터가 없으면 가져오기
#     if not clip.subtitles:
#         transcript_result = fetch_youtube_transcript(video_id)
        
#         if not transcript_result['success']:
#             return Response(
#                 {'error': transcript_result['error']},
#                 status=status.HTTP_400_BAD_REQUEST
# )

        
#         # 자막 저장
#         clip.subtitles = transcript_result['data']
#         clip.save()
    
#     serializer = self.get_serializer(clip)
#     return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
