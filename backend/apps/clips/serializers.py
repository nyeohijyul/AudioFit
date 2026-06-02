from rest_framework import serializers
from .models import Clip, Routine


class ClipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clip
        fields = ['id', 'youtube_url', 'video_id', 'title', 'channel', 'duration', 'subtitles', 'created_at']
        read_only_fields = ['id', 'video_id', 'created_at']


class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routine
        fields = ['id', 'name', 'clips', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']