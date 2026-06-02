from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from audiofit.db import users_collection, MongoDBModel


class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        uid = getattr(user, 'uid', None)
        email = getattr(user, 'email', None)
        name = getattr(user, 'name', None) or email.split('@')[0] if email else 'User'

        # Check and auto-create user in MongoDB if users_collection is initialized
        if users_collection is not None and uid:
            mongo_user = users_collection.find_one({"firebase_uid": uid})
            if not mongo_user:
                new_user_doc = MongoDBModel.create_user(
                    firebase_uid=uid,
                    display_name=name,
                    fitness_level='beginner'
                )
                users_collection.insert_one(new_user_doc)

        # Django PostgreSQL Profile 연동
        from apps.clips.models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=user)

        if created:
            from apps.clips.models import Routine
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
                user=user,
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
        user = request.user
        from apps.clips.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)

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
