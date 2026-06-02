import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError

from apps.exercises.models import Exercise


DEFAULT_API_URL = 'https://exercisedb.p.rapidapi.com/exercises'
DEFAULT_API_HOST = 'exercisedb.p.rapidapi.com'
DEFAULT_SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / 'data' / 'exercises_snapshot.json'


def http_get_json(url, headers=None, timeout=60):
    headers = dict(headers or {})
    headers.setdefault('Accept', 'application/json')
    headers.setdefault('User-Agent', 'AudioFit/1.0')
    request = Request(url, headers=headers)
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))


def fetch_exercises_from_api(api_url, api_key, api_host):
    base_url = api_url.rstrip('/')
    if base_url.endswith('/exercises'):
        base_url = base_url[: -len('/exercises')]

    headers = {
        'X-RapidAPI-Host': api_host,
        'X-RapidAPI-Key': api_key,
    }

    unique = {}
    endpoints = [
        f'{base_url}/exercises',
        f'{base_url}/exercises/bodyPartList',
        f'{base_url}/exercises/equipmentList',
        f'{base_url}/exercises/targetList',
    ]

    full_paths = [
        f'{base_url}/exercises',
    ]

    body_parts = http_get_json(f'{base_url}/exercises/bodyPartList', headers=headers)
    for part in body_parts:
        full_paths.append(f'{base_url}/exercises/bodyPart/{quote(part)}')

    equipment_list = http_get_json(f'{base_url}/exercises/equipmentList', headers=headers)
    for equipment in equipment_list:
        full_paths.append(f'{base_url}/exercises/equipment/{quote(equipment)}')

    target_list = http_get_json(f'{base_url}/exercises/targetList', headers=headers)
    for target in target_list:
        full_paths.append(f'{base_url}/exercises/target/{quote(target)}')

    for path in full_paths:
        try:
            payload = http_get_json(path, headers=headers)
        except Exception as exc:
            raise CommandError(f'ExerciseDB API 호출 실패: {path} -> {exc}')

        if not isinstance(payload, list):
            continue

        for item in payload:
            if not isinstance(item, dict):
                continue
            exercise_id = item.get('id') or item.get('_id')
            if exercise_id:
                unique[exercise_id] = item

    return list(unique.values())


def load_snapshot(snapshot_path):
    path = Path(snapshot_path)
    if not path.exists():
        raise CommandError(f'Exercise snapshot file not found: {path}')
    with path.open('r', encoding='utf-8') as snapshot_file:
        payload = json.load(snapshot_file)
    if not isinstance(payload, list):
        raise CommandError('Snapshot JSON must be a list of exercises.')
    return payload


class Command(BaseCommand):
    help = 'Import exercise data from ExerciseDB API or static snapshot and update or create Exercise records.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            choices=['api', 'json'],
            default=os.environ.get('EXERCISE_IMPORT_SOURCE', 'api'),
            help='데이터 소스: api 또는 json',
        )
        parser.add_argument(
            '--api-url',
            default=os.environ.get('EXERCISEDB_API_URL', DEFAULT_API_URL),
            help='ExerciseDB API URL',
        )
        parser.add_argument(
            '--host',
            default=os.environ.get('EXERCISEDB_RAPIDAPI_HOST', DEFAULT_API_HOST),
            help='RapidAPI host for ExerciseDB',
        )
        parser.add_argument(
            '--key',
            default=(
                os.environ.get('EXERCISEDB_RAPIDAPI_KEY')
                or os.environ.get('EXERCISE_API_KEY')
                or os.environ.get('RAPIDAPI_KEY')
            ),
            help='RapidAPI key for ExerciseDB',
        )
        parser.add_argument(
            '--snapshot',
            default=os.environ.get('EXERCISE_SNAPSHOT_PATH', str(DEFAULT_SNAPSHOT_PATH)),
            help='로컬 ExerciseDB JSON 스냅샷 파일 경로',
        )
        parser.add_argument(
            '--save-snapshot',
            action='store_true',
            help='API에서 가져온 데이터를 로컬 JSON 스냅샷으로 저장합니다.',
        )

    def handle(self, *args, **options):
        source = options['source']
        api_url = options['api_url']
        api_host = options['host']
        api_key = options['key']
        snapshot_path = options['snapshot']
        save_snapshot = options['save_snapshot']

        if source == 'api' and not api_key:
            raise CommandError(
                'ExerciseDB API key is required for source=api. set EXERCISEDB_RAPIDAPI_KEY or pass --key.'
            )

        self.stdout.write(self.style.NOTICE(f'Exercise import source: {source}'))
        exercises_data = []

        if source == 'json':
            exercises_data = load_snapshot(snapshot_path)
        else:
            exercises_data = fetch_exercises_from_api(api_url, api_key, api_host)
            if save_snapshot:
                with Path(snapshot_path).open('w', encoding='utf-8') as snapshot_file:
                    json.dump(exercises_data, snapshot_file, ensure_ascii=False, indent=2)
                self.stdout.write(self.style.SUCCESS(f'Snapshot saved: {snapshot_path}'))

        imported = 0
        skipped = 0

        for index, item in enumerate(exercises_data, start=1):
            if not isinstance(item, dict):
                self.stdout.write(self.style.WARNING(f'건너뜀: 잘못된 항목 형식 #{index}'))
                skipped += 1
                continue

            exercise_id = item.get('id') or item.get('_id')
            if not exercise_id:
                self.stdout.write(self.style.WARNING(f'건너뜀: id 누락 항목 #{index}'))
                skipped += 1
                continue

            defaults = {
                'name': str(item.get('name', '')).strip(),
                'body_part': str(item.get('bodyPart', '')).strip(),
                'target': str(item.get('target', '')).strip(),
                'equipment': str(item.get('equipment', '')).strip(),
                'gif_url': str(item.get('gifUrl', '')).strip(),
                'secondary_muscles': item.get('secondaryMuscles') or [],
                'instructions': item.get('instructions') or [],
            }

            Exercise.objects.update_or_create(exercise_id=exercise_id, defaults=defaults)
            imported += 1

            if index % 50 == 0:
                self.stdout.write(self.style.SUCCESS(f'{index}개 처리 중...'))

        self.stdout.write(self.style.SUCCESS(
            f'완료: {imported}개 저장/업데이트, {skipped}개 건너뜀.'
        ))
