from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Exercise
from .serializers import ExerciseSerializer
from apps.utils.recommendation import normalize_exercise, search_youtube_videos


class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [AllowAny]
    lookup_field = 'exercise_id'

    def get_queryset(self):
        queryset = Exercise.objects.all()
        query_map = {
            'body_part': 'body_part',
            'target': 'target',
            'equipment': 'equipment',
        }

        for query_param, model_field in query_map.items():
            value = self.request.query_params.get(query_param)
            if value:
                queryset = queryset.filter(**{f'{model_field}__iexact': value})

        return queryset

    @action(detail=True, methods=['get'], permission_classes=[AllowAny], url_path='videos')
    def videos(self, request, exercise_id=None):
        exercise = self.get_object()
        level = request.query_params.get('level', 'beginner')
        normalized_exercise = normalize_exercise(exercise)
        referer = request.headers.get('referer') or request.headers.get('origin')
        videos = search_youtube_videos(normalized_exercise, {'level': level}, referer=referer)
        return Response(videos)
