from rest_framework import viewsets, status, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from apps.utils.youtube import extract_video_id, fetch_youtube_transcript, fetch_youtube_metadata
from apps.utils.gemini_ai import simplify_subtitles as simplify_subtitles_with_ai
from apps.utils.tts import generate_speech
from django.http import HttpResponse
from .models import Clip, Routine
from .serializers import ClipSerializer


def get_firebase_uid(request):
    uid = getattr(request.user, 'uid', None) or getattr(request.user, 'username', None)
    if not uid or uid == 'AnonymousUser':
        return None
    return uid


def get_django_user(request):
    from django.contrib.auth.models import User as DjangoUser

    firebase_uid = get_firebase_uid(request)
    if not firebase_uid:
        raise exceptions.AuthenticationFailed('유효하지 않은 사용자입니다.')

    django_user, _ = DjangoUser.objects.get_or_create(username=firebase_uid)
    return django_user


class ClipViewSet(viewsets.ModelViewSet):
    """유튜브 클립 관리 및 자막 추출 API"""
    queryset = Clip.objects.all()
    serializer_class = ClipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # 현재 사용자의 클립만 조회
        django_user = get_django_user(self.request)
        return Clip.objects.filter(user=django_user)
    
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
            user=None,
            defaults={'youtube_url': youtube_url}  # 로그인하지 않은 사용자도 조회 가능
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

        django_user = get_django_user(request)

        # 현재 사용자에게 매핑된 해당 비디오 클립 찾거나 생성
        clip, created = Clip.objects.get_or_create(
            user=django_user,
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

    @action(detail=False, methods=['post'], url_path='generate-speech')
    def generate_speech_action(self, request):
        """Generate TTS audio for provided text using Google Cloud TTS and return MP3."""
        text = request.data.get('text', '')
        language = request.data.get('language', 'ko-KR')

        if not text:
            return Response({'error': '텍스트가 비어있습니다.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            audio_bytes = generate_speech(text, language_code=language)
        except Exception as exc:
            return Response({'error': f'TTS 생성 실패: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return HttpResponse(audio_bytes, content_type='audio/mpeg')


class RoutineViewSet(viewsets.ViewSet):
    """사용자 운동 루틴 관리 API"""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        django_user = get_django_user(request)
        routines = Routine.objects.filter(user=django_user)
        data = [
            {
                'id': str(routine.id),
                'name': routine.name,
                'clips': routine.clips,
                'created_at': routine.created_at.isoformat() if routine.created_at else None,
            }
            for routine in routines
        ]
        return Response(data, status=status.HTTP_200_OK)

    def create(self, request):
        django_user = get_django_user(request)
        name = request.data.get('name')
        clips = request.data.get('clips', [])

        if not name:
            return Response({'error': '루틴 이름은 필수 항목입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        routine = Routine.objects.create(user=django_user, name=name, clips=clips)

        created_routine = {
            'id': str(routine.id),
            'name': routine.name,
            'clips': routine.clips,
            'created_at': routine.created_at.isoformat() if routine.created_at else None,
        }
        return Response(created_routine, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        django_user = get_django_user(request)
        routine = get_object_or_404(Routine, pk=pk, user=django_user)
        name = request.data.get('name')
        clips = request.data.get('clips', [])

        if not name:
            return Response({'error': '루틴 이름은 필수 항목입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        routine.name = name
        routine.clips = clips
        routine.save()

        updated_routine = {
            'id': str(routine.id),
            'name': routine.name,
            'clips': routine.clips,
            'created_at': routine.created_at.isoformat() if routine.created_at else None,
        }
        return Response(updated_routine, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        django_user = get_django_user(request)
        routine = get_object_or_404(Routine, pk=pk, user=django_user)
        routine.delete()
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
