from django.db import models
from django.contrib.auth.models import User


class Clip(models.Model):
    """유튜브 영상 클립 데이터 모델"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    youtube_url = models.URLField()
    video_id = models.CharField(max_length=11, db_index=True)
    title = models.CharField(max_length=255, blank=True)
    channel = models.CharField(max_length=255, blank=True)  # 채널명
    duration = models.CharField(max_length=10, blank=True)  # e.g., "5:30"
    
    # 자막 데이터 (JSON으로 저장)
    subtitles = models.JSONField(default=list, blank=True)  # [{"text": "...", "start": 0.54, "duration": 3.21}, ...]
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['user', 'video_id']]
        indexes = [
            models.Index(fields=['video_id']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title or 'Untitled'} ({self.video_id})"

