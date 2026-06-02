from rest_framework import serializers

from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            'id',
            'exercise_id',
            'name',
            'body_part',
            'target',
            'equipment',
            'gif_url',
            'secondary_muscles',
            'instructions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
