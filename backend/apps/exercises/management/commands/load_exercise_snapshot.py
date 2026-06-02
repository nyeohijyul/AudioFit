import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.exercises.models import Exercise


DEFAULT_SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / 'data' / 'exercises_snapshot.json'


class Command(BaseCommand):
    help = 'Load exercises from the local JSON snapshot into the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--snapshot',
            default=str(DEFAULT_SNAPSHOT_PATH),
            help='Local snapshot JSON file path.',
        )

    def handle(self, *args, **options):
        snapshot_path = Path(options['snapshot'])
        if not snapshot_path.exists():
            raise CommandError(f'Exercise snapshot file not found: {snapshot_path}')

        try:
            with snapshot_path.open('r', encoding='utf-8') as snapshot_file:
                exercises_data = json.load(snapshot_file)
        except Exception as exc:
            raise CommandError(f'Failed to read snapshot file: {exc}')

        imported = 0
        skipped = 0

        for index, item in enumerate(exercises_data, start=1):
            if not isinstance(item, dict):
                self.stdout.write(self.style.WARNING(f'Skipping invalid item #{index}'))
                skipped += 1
                continue

            exercise_id = item.get('id') or item.get('_id')
            if not exercise_id:
                self.stdout.write(self.style.WARNING(f'Skipping item without id #{index}'))
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
                self.stdout.write(self.style.SUCCESS(f'Processed {index} items...'))

        self.stdout.write(self.style.SUCCESS(
            f'Loaded {imported} exercises from snapshot, skipped {skipped} invalid items.'
        ))
