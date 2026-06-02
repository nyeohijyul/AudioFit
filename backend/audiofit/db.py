"""Deprecated MongoDB compatibility module.

AudioFit now stores application data through the Django ORM. This module is kept
only so old imports fail softly without opening a MongoDB connection.
"""

db = None
users_collection = None
routines_collection = None
routine_clips_collection = None
exercises_collection = None
video_clips_collection = None


def get_db():
    return None


class MongoDBModel:
    """Compatibility placeholder for removed MongoDB document helpers."""

    @staticmethod
    def create_user(*args, **kwargs):
        raise RuntimeError('MongoDBModel is deprecated. Use Django ORM models instead.')

    @staticmethod
    def create_routine(*args, **kwargs):
        raise RuntimeError('MongoDBModel is deprecated. Use Django ORM models instead.')

    @staticmethod
    def create_routine_clip(*args, **kwargs):
        raise RuntimeError('MongoDBModel is deprecated. Use Django ORM models instead.')

    @staticmethod
    def create_exercise(*args, **kwargs):
        raise RuntimeError('MongoDBModel is deprecated. Use Django ORM models instead.')

    @staticmethod
    def create_video_clip(*args, **kwargs):
        raise RuntimeError('MongoDBModel is deprecated. Use Django ORM models instead.')
