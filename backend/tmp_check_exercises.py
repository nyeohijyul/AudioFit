import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'audiofit.settings')
import django

django.setup()

from django.test import Client
from django.test.utils import override_settings
from apps.exercises.models import Exercise

with override_settings(ALLOWED_HOSTS=['localhost', '127.0.0.1', 'testserver']):
    c = Client()
    r = c.get('/api/v1/exercises/')
    print('status', r.status_code)
    try:
        print('json', r.json())
    except Exception as exc:
        print('json error', exc)
        print('content', r.content[:500])
    print('count', Exercise.objects.count())
