from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User


def get_or_create_django_user(firebase_user):
    uid = getattr(firebase_user, 'uid', None) or getattr(firebase_user, 'username', None)
    email = getattr(firebase_user, 'email', '') or ''
    name = getattr(firebase_user, 'name', '') or (email.split('@')[0] if email else 'User')

    if not uid:
        return None, uid, email, name

    user, created = User.objects.get_or_create(
        username=uid,
        defaults={
            'email': email,
            'first_name': name[:150],
        },
    )

    fields_to_update = []
    if email and user.email != email:
        user.email = email
        fields_to_update.append('email')
    if name and user.first_name != name[:150]:
        user.first_name = name[:150]
        fields_to_update.append('first_name')
    if fields_to_update and not created:
        user.save(update_fields=fields_to_update)

    return user, uid, email, name


class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        django_user, uid, email, name = get_or_create_django_user(request.user)
        if django_user is None:
            return Response({'error': '유효한 사용자 정보가 없습니다.'}, status=400)

        from apps.clips.models import Routine, UserProfile

        profile, created = UserProfile.objects.get_or_create(user=django_user)

        if created:
            # 신규 유저를 위한 웰컴 예시 루틴 자동 생성
            welcome_clips = [
                {
                    "id": "clip-example",
                    "label": "스트레칭 예시 클립",
                    "meta": "01:15",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "subtitles": [
                        { "original": "기지개 스트레칭", "translated": "팔을 바닥에 대고 천천히 몸을 늘려 주세요.", "exercise": "기지개 스트레칭", "start": 0, "duration": 15, "selected": True },
                        { "original": "고양이 자세", "translated": "무릎과 손을 바닥에 대고 등을 부드럽게 말아 주세요.", "exercise": "고양이 자세", "start": 15, "duration": 15, "selected": True },
                        { "original": "무릎 대고 팔굽혀 펴기", "translated": "어깨 너비로 짚고 가슴이 바닥 가까이 내려가도록 천천히 움직여 주세요.", "exercise": "무릎 대고 팔굽혀 펴기", "start": 30, "duration": 15, "selected": True },
                        { "original": "엉덩이 들기 브릿지", "translated": "무릎을 세우고 엉덩이를 천장 쪽으로 들어 올려 주세요.", "exercise": "엉덩이 들기 브릿지", "start": 45, "duration": 15, "selected": True },
                        { "original": "제자리 제자리 걷기", "translated": "제자리에서 천천히 무릎을 들어 올리며 호흡을 정리해 주세요.", "exercise": "제자리 제자리 걷기", "start": 60, "duration": 15, "selected": True }
                    ]
                }
            ]
            Routine.objects.create(
                user=django_user,
                name="아침 5분 스트레칭 (웰컴 예시)",
                clips=welcome_clips
            )

        return Response({
            'uid': uid,
            'email': email,
            'name': name,
            'workout_count': profile.workout_count,
            'fitness_level': profile.fitness_level,
        })

    def post(self, request, *args, **kwargs):
        django_user, _, _, _ = get_or_create_django_user(request.user)
        if django_user is None:
            return Response({'error': '유효한 사용자 정보가 없습니다.'}, status=400)

        from apps.clips.models import UserProfile

        profile, _ = UserProfile.objects.get_or_create(user=django_user)

        workout_count = request.data.get('workout_count')
        fitness_level = request.data.get('fitness_level')

        if workout_count is not None:
            profile.workout_count = int(workout_count)
        if fitness_level is not None:
            profile.fitness_level = fitness_level

        profile.save()

        return Response({
            'success': True,
            'workout_count': profile.workout_count,
            'fitness_level': profile.fitness_level,
        })
