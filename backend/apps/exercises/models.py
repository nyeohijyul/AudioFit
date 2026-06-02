from django.db import models


class Exercise(models.Model):
    exercise_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    body_part = models.CharField(max_length=100, db_index=True)
    target = models.CharField(max_length=100, db_index=True)
    equipment = models.CharField(max_length=100, db_index=True)
    gif_url = models.URLField(max_length=1024, blank=True)
    secondary_muscles = models.JSONField(default=list, blank=True)
    instructions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['body_part']),
            models.Index(fields=['target']),
            models.Index(fields=['equipment']),
        ]

    def __str__(self):
        return self.name
