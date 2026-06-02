import json
from pathlib import Path

from django.db import migrations


def load_snapshot(apps, schema_editor):
    Exercise = apps.get_model('exercises', 'Exercise')
    snapshot_path = Path(__file__).resolve().parent.parent / 'data' / 'exercises_snapshot.json'
    if not snapshot_path.exists():
        return

    with snapshot_path.open('r', encoding='utf-8') as snapshot_file:
        exercises_data = json.load(snapshot_file)

    for item in exercises_data:
        exercise_id = item.get('id') or item.get('_id')
        if not exercise_id:
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


def reverse_load_snapshot(apps, schema_editor):
    # No reverse operation for snapshot data load.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('exercises', '0003_load_initial_exercises'),
    ]

    operations = [
        migrations.RunPython(load_snapshot, reverse_load_snapshot),
    ]
