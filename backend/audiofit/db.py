import os
from pymongo import MongoClient
from decouple import config

# 1. MongoDB Connection Initialization
MONGO_URI = config('MONGO_URI', default='')

if MONGO_URI:
    # Initialize PyMongo Client
    client = MongoClient(MONGO_URI)
    # Use 'audiofit' as default database name
    db = client.get_database('audiofit')
else:
    db = None
    print("[Warning] MONGO_URI is not set in environment variables.")

# 2. Collections Setup (Referencing docs/PLAN.md)
users_collection = db['users'] if db is not None else None
routines_collection = db['routines'] if db is not None else None
routine_clips_collection = db['routine_clips'] if db is not None else None
exercises_collection = db['exercises'] if db is not None else None
video_clips_collection = db['video_clips'] if db is not None else None

# Helper functions to fetch or manage DB collections safely
def get_db():
    return db

# 3. Model/Document Helpers (Schemas based on docs/PLAN.md)
class MongoDBModel:
    """Base helper class for MongoDB document creation and validation."""
    
    @staticmethod
    def create_user(firebase_uid, display_name, fitness_level='beginner', settings=None):
        """
        users schema:
        - firebase_uid: str (Unique ID from Firebase Auth)
        - display_name: str
        - fitness_level: str ('beginner', 'intermediate', 'advanced', etc.)
        - settings: dict (User settings/preferences)
        - created_at: datetime
        """
        from datetime import datetime
        return {
            "firebase_uid": firebase_uid,
            "display_name": display_name,
            "fitness_level": fitness_level,
            "settings": settings or {},
            "created_at": datetime.utcnow()
        }

    @staticmethod
    def create_routine(user_id, name, translate_mode=False, status='pending', total_duration_sec=0, is_public=False):
        """
        routines schema:
        - user_id: str (firebase_uid)
        - name: str (Routine name)
        - translate_mode: bool
        - status: str ('pending', 'ready', 'failed')
        - total_duration_sec: int
        - is_public: bool (Whether the routine is visible to others)
        - created_at: datetime
        """
        from datetime import datetime
        return {
            "user_id": user_id,
            "name": name,
            "translate_mode": translate_mode,
            "status": status,
            "total_duration_sec": total_duration_sec,
            "is_public": is_public,
            "created_at": datetime.utcnow()
        }

    @staticmethod
    def create_routine_clip(routine_id, clip_id, start_sec, end_sec, order):
        """
        routine_clips schema:
        - routine_id: ObjectId or str (References routines._id)
        - clip_id: ObjectId or str (References video_clips._id)
        - start_sec: int
        - end_sec: int
        - order: int
        """
        return {
            "routine_id": routine_id,
            "clip_id": clip_id,
            "start_sec": start_sec,
            "end_sec": end_sec,
            "order": order
        }

    @staticmethod
    def create_exercise(routine_id, order, name, instruction, duration_sec, coaching_text, instruction_easy=None):
        """
        exercises schema:
        - routine_id: ObjectId or str (References routines._id)
        - order: int
        - name: str (Exercise/Action name)
        - instruction: str (Detailed action description)
        - instruction_easy: str (Optional simplified translation for beginners)
        - duration_sec: int
        - coaching_text: str (TTS coaching text synthesized from transcript)
        """
        return {
            "routine_id": routine_id,
            "order": order,
            "name": name,
            "instruction": instruction,
            "instruction_easy": instruction_easy,
            "duration_sec": duration_sec,
            "coaching_text": coaching_text
        }

    @staticmethod
    def create_video_clip(user_id, youtube_url, video_id, title="", duration_sec=0, transcript_raw=None):
        """
        video_clips schema:
        - user_id: str (firebase_uid)
        - youtube_url: str
        - video_id: str (YouTube Video ID)
        - title: str
        - duration_sec: int
        - transcript_raw: list (Raw timestamps and texts from youtube-transcript-api)
        - created_at: datetime
        """
        from datetime import datetime
        return {
            "user_id": user_id,
            "youtube_url": youtube_url,
            "video_id": video_id,
            "title": title,
            "duration_sec": duration_sec,
            "transcript_raw": transcript_raw or [],
            "created_at": datetime.utcnow()
        }
