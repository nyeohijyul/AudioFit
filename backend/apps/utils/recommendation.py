import json
import logging
import urllib.parse
import urllib.request
from pathlib import Path

from decouple import config
from django.db.models import Q

from apps.exercises.models import Exercise
from apps.utils.gemini_ai import recommend_exercise_notes

logger = logging.getLogger(__name__)


EXERCISEDB_DEFAULT_URL = 'https://exercisedb.p.rapidapi.com/exercises/equipment/body%20weight'
YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

BODYWEIGHT_EQUIPMENT = {'body weight', 'bodyweight'}

FALLBACK_EXERCISES = [
    {
        'id': 'fallback-plank',
        'name': 'plank',
        'ko_name': '플랭크',
        'body_part': 'waist',
        'target': 'abs',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['beginner', 'intermediate', 'advanced'],
        'goals': ['strength', 'fatburn'],
        'avoid': [],
        'description': '팔꿈치로 바닥을 지지하고 몸을 일자로 유지해 코어를 단단하게 만드는 맨몸 운동입니다.',
    },
    {
        'id': 'fallback-bridge',
        'name': 'glute bridge',
        'ko_name': '힙 브리지',
        'body_part': 'upper legs',
        'target': 'glutes',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['beginner', 'intermediate'],
        'goals': ['strength', 'mobility'],
        'avoid': [],
        'description': '누워서 엉덩이를 들어 올리며 둔근과 코어를 깨우는 부담 적은 동작입니다.',
    },
    {
        'id': 'fallback-pushup',
        'name': 'push-up',
        'ko_name': '푸시업',
        'body_part': 'chest',
        'target': 'pectorals',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['intermediate', 'advanced'],
        'goals': ['strength'],
        'avoid': ['wrist'],
        'description': '가슴과 팔을 사용하면서 몸통을 단단히 유지하는 대표적인 상체 맨몸 운동입니다.',
    },
    {
        'id': 'fallback-mountain-climber',
        'name': 'mountain climber',
        'ko_name': '마운틴 클라이머',
        'body_part': 'cardio',
        'target': 'cardiovascular system',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['intermediate', 'advanced'],
        'goals': ['fatburn'],
        'avoid': ['wrist'],
        'description': '플랭크 자세에서 무릎을 번갈아 당겨 전신과 심폐를 함께 자극하는 동작입니다.',
    },
    {
        'id': 'fallback-squat',
        'name': 'bodyweight squat',
        'ko_name': '맨몸 스쿼트',
        'body_part': 'upper legs',
        'target': 'quads',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['beginner', 'intermediate', 'advanced'],
        'goals': ['strength', 'fatburn'],
        'avoid': ['knee'],
        'description': '앉았다 일어나며 허벅지와 둔근을 강화하는 기본 하체 운동입니다.',
    },
    {
        'id': 'fallback-dead-bug',
        'name': 'dead bug',
        'ko_name': '데드 버그',
        'body_part': 'waist',
        'target': 'abs',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['beginner', 'intermediate'],
        'goals': ['strength', 'mobility'],
        'avoid': [],
        'description': '누운 자세에서 팔다리를 교차로 뻗어 허리가 뜨지 않게 코어 조절력을 높입니다.',
    },
    {
        'id': 'fallback-jumping-jack',
        'name': 'jumping jack',
        'ko_name': '점핑 잭',
        'body_part': 'cardio',
        'target': 'cardiovascular system',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['beginner', 'intermediate', 'advanced'],
        'goals': ['fatburn'],
        'avoid': ['knee'],
        'description': '팔과 다리를 함께 벌리고 모으며 몸을 빠르게 데우는 전신 유산소 동작입니다.',
    },
    {
        'id': 'fallback-cat-cow',
        'name': 'cat cow stretch',
        'ko_name': '고양이-소 자세',
        'body_part': 'back',
        'target': 'spine',
        'equipment': 'body weight',
        'gif_url': '',
        'level': ['beginner', 'intermediate'],
        'goals': ['mobility'],
        'avoid': ['wrist'],
        'description': '네발 기기 자세에서 등을 둥글게 말고 펴며 척추와 호흡을 부드럽게 정리합니다.',
    },
]


def build_recommendation(payload):
    answers = normalize_answers(payload)
    source_notes = []
    exercises = fetch_exercises_from_db()

    if not exercises:
        exercises = load_exercise_snapshot()
        if exercises:
            source_notes.append('서버에 저장된 ExerciseDB 운동 데이터를 불러왔습니다.')
        else:
            exercises = fetch_bodyweight_exercises()
            if exercises:
                source_notes.append('ExerciseDB API에서 운동 데이터를 가져왔습니다.')
            else:
                exercises = FALLBACK_EXERCISES
                source_notes.append('ExerciseDB 호출에 실패해 서버 기본 운동 데이터를 사용했습니다.')

    normalized = [normalize_exercise(item) for item in exercises]
    candidates = filter_exercises(normalized, answers)
    selected = rank_exercises(candidates or normalized, answers)[:answers['limit']]

    ai_result = recommend_exercise_notes(selected, answers)
    if ai_result.get('success'):
        selected = merge_ai_notes(selected, ai_result.get('data', []))
    elif ai_result.get('error'):
        source_notes.append(ai_result['error'])

    youtube_results = {}
    for exercise in selected[:answers['video_exercise_limit']]:
        youtube_results[exercise['id']] = search_youtube_videos(exercise, answers)

    return {
        'answers': answers,
        'source_notes': source_notes,
        'exercises': selected,
        'videos': youtube_results,
        'routine_clips': build_routine_clips(selected, youtube_results, answers),
    }


def normalize_answers(payload):
    focus = payload.get('focus') or payload.get('body_parts') or ['waist', 'cardio']
    if isinstance(focus, str):
        focus = [focus]

    return {
        'goal': payload.get('goal') or 'strength',
        'duration': payload.get('duration') or 'medium',
        'level': payload.get('level') or 'beginner',
        'focus': focus,
        'avoid': payload.get('avoid') or 'none',
        'limit': int(payload.get('limit') or 6),
        'video_exercise_limit': int(payload.get('video_exercise_limit') or 3),
    }


def fetch_exercises_from_db():
    try:
        exercises = Exercise.objects.filter(
            Q(equipment__iexact='body weight') | Q(equipment__iexact='bodyweight')
        )
        count = exercises.count()
        logger.info('Loaded %d local Exercise records from DB.', count)
        return list(exercises)
    except Exception as exc:
        logger.exception('Failed to load local Exercise records from DB.')
        return []


def load_exercise_snapshot():
    snapshot_path = Path(__file__).resolve().parent.parent / 'exercises' / 'data' / 'exercises_snapshot.json'
    if not snapshot_path.exists():
        logger.warning('Exercise snapshot file not found: %s', snapshot_path)
        return []
    try:
        with snapshot_path.open('r', encoding='utf-8') as snapshot_file:
            return json.load(snapshot_file)
    except Exception as exc:
        logger.exception('Failed to load exercise snapshot: %s', exc)
        return []


def fetch_bodyweight_exercises():
    url = os.getenv('EXERCISEDB_API_URL', EXERCISEDB_DEFAULT_URL)
    query = {'limit': os.getenv('EXERCISEDB_LIMIT', '100')}
    separator = '&' if '?' in url else '?'
    request_url = f'{url}{separator}{urllib.parse.urlencode(query)}'

    headers = {
        'Accept': 'application/json',
    }
    api_key = (
        os.getenv('EXERCISEDB_RAPIDAPI_KEY')
        or os.getenv('EXERCISE_API_KEY')
        or os.getenv('RAPIDAPI_KEY')
    )
    api_host = os.getenv('EXERCISEDB_RAPIDAPI_HOST', 'exercisedb.p.rapidapi.com')
    if api_key:
        headers['X-RapidAPI-Key'] = api_key
        headers['X-RapidAPI-Host'] = api_host
    else:
        logger.warning('ExerciseDB API key is not set; external ExerciseDB requests may fail.')

    logger.info('Fetching ExerciseDB external data from %s', request_url)
    try:
        data = http_get_json(request_url, headers=headers, timeout=15)
        logger.info('Fetched ExerciseDB external data, %d items', len(data) if isinstance(data, list) else 0)
        return data
    except Exception as exc:
        logger.exception('ExerciseDB external fetch failed.')
        return []


def normalize_exercise(item):
    if isinstance(item, Exercise):
        name = item.name or ''
        body_part = item.body_part or ''
        target = item.target or ''
        equipment = item.equipment or ''

        return {
            'id': str(item.exercise_id),
            'name': name,
            'ko_name': translate_known_name(name),
            'body_part': body_part,
            'target': target,
            'equipment': equipment,
            'gif_url': item.gif_url or '',
            'secondary_muscles': item.secondary_muscles or [],
            'instructions': item.instructions or [],
            'level': infer_level(name, body_part, target),
            'goals': infer_goals(name, body_part, target),
            'avoid': infer_avoid_flags(name, body_part, target),
            'description': build_default_description(name, body_part, target),
        }

    name = item.get('name', '')
    equipment = item.get('equipment', '')
    body_part = item.get('bodyPart') or item.get('body_part') or ''
    target = item.get('target', '')

    return {
        'id': str(item.get('id') or item.get('exerciseId') or name),
        'name': name,
        'ko_name': item.get('ko_name') or item.get('koName') or translate_known_name(name),
        'body_part': body_part,
        'target': target,
        'equipment': equipment,
        'gif_url': item.get('gifUrl') or item.get('gif_url') or '',
        'secondary_muscles': item.get('secondaryMuscles') or [],
        'instructions': item.get('instructions') or [],
        'level': infer_level(name, body_part, target),
        'goals': infer_goals(name, body_part, target),
        'avoid': infer_avoid_flags(name, body_part, target),
        'description': item.get('description') or build_default_description(name, body_part, target),
    }


def filter_exercises(exercises, answers):
    focus = set(answers['focus'])
    goal = answers['goal']
    level = answers['level']
    avoid = answers['avoid']

    filtered = []
    for exercise in exercises:
        if exercise['equipment'] not in BODYWEIGHT_EQUIPMENT:
            continue
        if focus and not (exercise['body_part'] in focus or exercise['target'] in focus):
            if 'cardio' not in focus or exercise['body_part'] != 'cardio':
                continue
        if goal and goal not in exercise['goals']:
            continue
        if level and level not in exercise['level']:
            continue
        if avoid != 'none' and avoid in exercise['avoid']:
            continue
        filtered.append(exercise)
    return filtered


def rank_exercises(exercises, answers):
    focus = set(answers['focus'])
    goal = answers['goal']
    level = answers['level']

    def score(exercise):
        value = 0
        if exercise['body_part'] in focus:
            value += 4
        if exercise['target'] in focus:
            value += 3
        if goal in exercise['goals']:
            value += 3
        if level in exercise['level']:
            value += 2
        if exercise['body_part'] == 'cardio':
            value += 1 if goal == 'fatburn' else 0
        return value

    return sorted(exercises, key=score, reverse=True)


def search_youtube_videos(exercise, answers, referer=None):
    api_key = config('YOUTUBE_API_KEY', default=None) or config('GOOGLE_YOUTUBE_API_KEY', default=None)
    if not api_key:
        return build_mock_videos(exercise)

    if not referer:
        referer = config('YOUTUBE_API_REFERER', default=None)

    query = f"{exercise['ko_name']} {answers['level']} 맨몸 운동 자세 홈트"
    headers = {}
    if referer:
        headers['Referer'] = referer

    try:
        search_params = urllib.parse.urlencode({
            'key': api_key,
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': '3',
            'videoEmbeddable': 'true',
            'safeSearch': 'moderate',
            'relevanceLanguage': 'ko',
        })
        search_data = http_get_json(f'{YOUTUBE_SEARCH_URL}?{search_params}', headers=headers, timeout=10)
        ids = [
            item.get('id', {}).get('videoId')
            for item in search_data.get('items', [])
            if item.get('id', {}).get('videoId')
        ]
        if not ids:
            return build_mock_videos(exercise)

        video_params = urllib.parse.urlencode({
            'key': api_key,
            'part': 'snippet,contentDetails,statistics',
            'id': ','.join(ids),
        })
        videos_data = http_get_json(f'{YOUTUBE_VIDEOS_URL}?{video_params}', headers=headers, timeout=10)
        return [normalize_youtube_video(item, index) for index, item in enumerate(videos_data.get('items', [])[:3])]
    except Exception:
        return build_mock_videos(exercise)


def search_youtube_videos_for_exercise(exercise, level='beginner'):
    normalized = normalize_exercise(exercise) if not isinstance(exercise, dict) else exercise
    referer = config('YOUTUBE_API_REFERER', default='http://localhost:5173')
    return search_youtube_videos(normalized, {'level': level}, referer=referer)


def normalize_youtube_video(item, index):
    video_id = item.get('id', '')
    snippet = item.get('snippet') or {}
    statistics = item.get('statistics') or {}
    thumbnails = snippet.get('thumbnails') or {}
    thumbnail = thumbnails.get('medium') or thumbnails.get('default') or {}

    return {
        'id': video_id,
        'title': snippet.get('title', '운동 영상'),
        'channel': snippet.get('channelTitle', 'YouTube'),
        'duration': parse_iso_duration((item.get('contentDetails') or {}).get('duration', '')),
        'views': format_views(statistics.get('viewCount')),
        'url': f'https://www.youtube.com/watch?v={video_id}',
        'thumbnail': thumbnail.get('url', ''),
        'top_pick': index == 0,
    }


def build_mock_videos(exercise):
    title = exercise.get('ko_name') or exercise.get('name') or '운동'
    exercise_id = exercise.get('id') or exercise.get('exercise_id') or title.replace(' ', '_')
    return [
        {
            'id': f"mock-{exercise_id}-{index}",
            'title': f'{title} 홈트 자세 가이드 {index + 1}',
            'channel': ['AudioFit Guide', 'Home Training Lab', 'Daily Bodyweight'][index],
            'duration': ['10:30', '18:45', '07:55'][index],
            'views': ['32만회', '21만회', '14만회'][index],
            'url': f"https://www.youtube.com/results?search_query={urllib.parse.quote(f'{title} 맨몸 운동')}",
            'thumbnail': '',
            'top_pick': index == 0,
        }
        for index in range(3)
    ]


def build_routine_clips(exercises, youtube_results, answers):
    clips = []
    duration_sec = duration_to_seconds(answers['duration'])
    for exercise in exercises[:answers['video_exercise_limit']]:
        videos = youtube_results.get(exercise['id']) or []
        if not videos:
            continue
        video = videos[0]
        clips.append({
            'id': f"recommend-{exercise['id']}-{video['id']}",
            'label': video['title'],
            'meta': video['duration'] or f'{duration_sec}초',
            'url': video['url'],
            'youtube_url': video['url'],
            'aiSimplified': True,
            'source': 'recommendation',
            'exerciseId': exercise['id'],
            'subtitles': [
                {
                    'index': 0,
                    'time': '00:00',
                    'start': 0,
                    'duration': duration_sec,
                    'customDuration': duration_sec,
                    'original': f"{exercise['ko_name']} 동작 가이드",
                    'translated': exercise['description'],
                    'exercise': exercise['ko_name'],
                    'selected': True,
                }
            ],
        })
    return clips


def merge_ai_notes(exercises, notes):
    notes_by_id = {str(item.get('id')): item for item in notes if isinstance(item, dict)}
    merged = []
    for exercise in exercises:
        next_exercise = dict(exercise)
        note = notes_by_id.get(str(exercise['id']))
        if note:
            next_exercise['ko_name'] = note.get('ko_name') or next_exercise['ko_name']
            next_exercise['description'] = note.get('description') or next_exercise['description']
        merged.append(next_exercise)
    return merged


def http_get_json(url, headers=None, timeout=10):
    headers = dict(headers or {})
    headers.setdefault('Accept', 'application/json')
    headers.setdefault('User-Agent', 'AudioFit/1.0')
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))


def parse_iso_duration(value):
    if not value:
        return ''
    hours = minutes = seconds = 0
    number = ''
    for char in value.replace('PT', ''):
        if char.isdigit():
            number += char
            continue
        if char == 'H':
            hours = int(number or 0)
        elif char == 'M':
            minutes = int(number or 0)
        elif char == 'S':
            seconds = int(number or 0)
        number = ''
    total_minutes = hours * 60 + minutes
    return f'{total_minutes}:{seconds:02d}'


def format_views(value):
    if not value:
        return '조회수 정보 없음'
    count = int(value)
    if count >= 10000:
        return f'{count // 10000}만회'
    return f'{count:,}회'


def duration_to_seconds(value):
    return {
        'short': 30,
        'medium': 45,
        'long': 60,
    }.get(value, 45)


def infer_goals(name, body_part, target):
    text = f'{name} {body_part} {target}'.lower()
    goals = {'strength'}
    if any(word in text for word in ['cardio', 'jump', 'burpee', 'mountain', 'jack']):
        goals.add('fatburn')
    if any(word in text for word in ['stretch', 'mobility', 'yoga', 'spine', 'cat']):
        goals.add('mobility')
    if body_part == 'cardio':
        goals.add('fatburn')
    return sorted(goals)


def infer_level(name, body_part, target):
    text = f'{name} {body_part} {target}'.lower()
    if any(word in text for word in ['jump', 'burpee', 'pike', 'handstand']):
        return ['intermediate', 'advanced']
    if any(word in text for word in ['push-up', 'mountain climber']):
        return ['intermediate', 'advanced']
    return ['beginner', 'intermediate', 'advanced']


def infer_avoid_flags(name, body_part, target):
    text = f'{name} {body_part} {target}'.lower()
    flags = []
    if any(word in text for word in ['jump', 'squat', 'lunge', 'burpee']):
        flags.append('knee')
    if any(word in text for word in ['push-up', 'plank', 'mountain', 'bear', 'handstand']):
        flags.append('wrist')
    return flags


def build_default_description(name, body_part, target):
    return f'{name} 동작으로 {body_part or target} 부위를 자극하는 맨몸 운동입니다.'


def translate_known_name(name):
    known = {
        'plank': '플랭크',
        'push-up': '푸시업',
        'push up': '푸시업',
        'glute bridge': '힙 브리지',
        'bodyweight squat': '맨몸 스쿼트',
        'mountain climber': '마운틴 클라이머',
        'jumping jack': '점핑 잭',
        'dead bug': '데드 버그',
        'cat cow stretch': '고양이-소 자세',
    }
    return known.get((name or '').lower(), name)
