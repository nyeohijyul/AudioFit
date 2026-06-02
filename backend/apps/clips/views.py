from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import exceptions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.utils.gemini_ai import simplify_subtitles as simplify_subtitles_with_ai
from apps.utils.recommendation import build_recommendation
from apps.utils.tts import generate_speech
from apps.utils.youtube import extract_video_id, fetch_youtube_metadata, fetch_youtube_transcript

from .models import Clip, Routine
from .serializers import ClipSerializer


def get_firebase_uid(request):
    uid = getattr(request.user, 'uid', None) or getattr(request.user, 'username', None)
    if not uid or uid == 'AnonymousUser':
        return None
    return uid


def get_django_user(request):
    from django.contrib.auth.models import User

    firebase_uid = get_firebase_uid(request)
    if not firebase_uid:
        raise exceptions.AuthenticationFailed('유효하지 않은 사용자입니다.')

    email = getattr(request.user, 'email', '') or ''
    name = getattr(request.user, 'name', '') or (email.split('@')[0] if email else '')
    django_user, created = User.objects.get_or_create(
        username=firebase_uid,
        defaults={
            'email': email,
            'first_name': name[:150],
        },
    )

    fields_to_update = []
    if email and django_user.email != email:
        django_user.email = email
        fields_to_update.append('email')
    if name and django_user.first_name != name[:150]:
        django_user.first_name = name[:150]
        fields_to_update.append('first_name')
    if fields_to_update and not created:
        django_user.save(update_fields=fields_to_update)

    return django_user


class ClipViewSet(viewsets.ModelViewSet):
    """유튜브 클립 관리 및 추천 API"""
    serializer_class = ClipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        django_user = get_django_user(self.request)
        return Clip.objects.filter(user=django_user)

    @action(detail=False, methods=['post'])
    def transcript(self, request):
        youtube_url = request.data.get('youtube_url', '').strip()
        if not youtube_url:
            return Response({'error': '유튜브 URL을 입력해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

        video_id = extract_video_id(youtube_url)
        if not video_id:
            return Response({'error': '유효한 유튜브 URL이 아닙니다.'}, status=status.HTTP_400_BAD_REQUEST)

        clip, created = Clip.objects.get_or_create(
            video_id=video_id,
            user=None,
            defaults={'youtube_url': youtube_url},
        )

        if not clip.title or not clip.duration:
            metadata_result = fetch_youtube_metadata(video_id)
            if metadata_result['success']:
                clip.title = metadata_result['title']
                clip.channel = metadata_result['channel']
                clip.duration = metadata_result['duration']
                clip.save()

        if not clip.subtitles:
            transcript_result = fetch_youtube_transcript(video_id)
            if not transcript_result['success']:
                return Response({'error': transcript_result['error']}, status=status.HTTP_400_BAD_REQUEST)

            clip.subtitles = transcript_result['data']
            clip.save()

        serializer = self.get_serializer(clip)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='simplify-subtitles')
    def simplify_subtitles(self, request):
        subtitles = request.data.get('subtitles', [])
        if not isinstance(subtitles, list) or not subtitles:
            return Response({'error': '변환할 자막을 선택해 주세요.'}, status=status.HTTP_400_BAD_REQUEST)

        result = simplify_subtitles_with_ai(subtitles)
        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'subtitles': result['data']}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='save-user-clip')
    def save_user_clip(self, request):
        video_id = request.data.get('video_id')
        subtitles = request.data.get('subtitles', [])
        youtube_url = request.data.get('youtube_url', '')
        title = request.data.get('title', '')
        channel = request.data.get('channel', '')
        duration = request.data.get('duration', '')

        if not video_id:
            return Response({'error': 'video_id는 필수 항목입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        django_user = get_django_user(request)
        clip, created = Clip.objects.get_or_create(
            user=django_user,
            video_id=video_id,
            defaults={
                'youtube_url': youtube_url,
                'title': title,
                'channel': channel,
                'duration': duration,
                'subtitles': subtitles,
            },
        )

        if not created:
            clip.subtitles = subtitles
            if youtube_url:
                clip.youtube_url = youtube_url
            if title:
                clip.title = title
            if channel:
                clip.channel = channel
            if duration:
                clip.duration = duration
            clip.save()

        serializer = self.get_serializer(clip)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='generate-speech')
    def generate_speech_action(self, request):
        text = request.data.get('text', '')
        language = request.data.get('language', 'ko-KR')
        if not text:
            return Response({'error': '텍스트가 비어있습니다.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            audio_bytes = generate_speech(text, language_code=language)
        except Exception as exc:
            return Response({'error': f'TTS 생성 실패: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return HttpResponse(audio_bytes, content_type='audio/mpeg')

    @action(detail=False, methods=['post'], url_path='recommend-routine')
    def recommend_routine(self, request):
        try:
            result = build_recommendation(request.data)
        except Exception as exc:
            return Response(
                {'error': f'추천 루틴 생성에 실패했습니다: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)


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
        return Response(
            {
                'id': str(routine.id),
                'name': routine.name,
                'clips': routine.clips,
                'created_at': routine.created_at.isoformat() if routine.created_at else None,
            },
            status=status.HTTP_201_CREATED,
        )

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

        return Response(
            {
                'id': str(routine.id),
                'name': routine.name,
                'clips': routine.clips,
                'created_at': routine.created_at.isoformat() if routine.created_at else None,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, pk=None):
        django_user = get_django_user(request)
        routine = get_object_or_404(Routine, pk=pk, user=django_user)
        routine.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
