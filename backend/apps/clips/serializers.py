from rest_framework import serializers
from .models import Clip


class ClipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clip
        fields = ['id', 'youtube_url', 'video_id', 'title', 'channel', 'duration', 'subtitles', 'created_at']
        read_only_fields = ['id', 'video_id', 'subtitles', 'created_at']
