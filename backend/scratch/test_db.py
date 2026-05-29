import os
from pathlib import Path
from pymongo import MongoClient
from decouple import Config, RepositoryEnv

BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    config = Config(RepositoryEnv(env_path))
else:
    from decouple import config

MONGO_URI = config('MONGO_URI', default='')
print("MONGO_URI:", MONGO_URI)

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client.get_database('audiofit')
    # Trigger a connection
    print("Databases:", client.list_database_names())
    routines_collection = db['routines']
    print("Routines count:", routines_collection.count_documents({}))
    print("Connection successful!")
except Exception as e:
    print("Connection failed:", e)
