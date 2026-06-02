from django.db import migrations


INITIAL_EXERCISES = [
    {
        'exercise_id': '0001',
        'name': '3/4 sit-up',
        'body_part': 'waist',
        'target': 'abs',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/3_4_sit_up.gif',
        'secondary_muscles': ['hip flexors', 'lower back'],
        'instructions': [
            'Lie flat on your back with your knees bent and feet flat on the floor.',
            'Lift your torso until your shoulders are off the ground, then slowly lower back down.',
        ],
    },
    {
        'exercise_id': '0002',
        'name': 'push-up',
        'body_part': 'chest',
        'target': 'pectorals',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/push_up.gif',
        'secondary_muscles': ['triceps', 'shoulders'],
        'instructions': [
            'Start in a high plank position with your hands shoulder-width apart.',
            'Lower your body until your chest nearly touches the floor, then push back up.',
        ],
    },
    {
        'exercise_id': '0003',
        'name': 'bodyweight squat',
        'body_part': 'upper legs',
        'target': 'quads',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/bodyweight_squat.gif',
        'secondary_muscles': ['glutes', 'hamstrings'],
        'instructions': [
            'Stand with your feet shoulder-width apart and keep your chest up.',
            'Bend your knees and lower your hips until your thighs are parallel to the floor, then stand back up.',
        ],
    },
    {
        'exercise_id': '0004',
        'name': 'plank',
        'body_part': 'waist',
        'target': 'abs',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/plank.gif',
        'secondary_muscles': ['lower back', 'shoulders'],
        'instructions': [
            'Support your body on your forearms and toes, keeping a straight line from head to heels.',
            'Hold the position while keeping your core engaged and breathing steadily.',
        ],
    },
    {
        'exercise_id': '0005',
        'name': 'mountain climber',
        'body_part': 'cardio',
        'target': 'cardiovascular system',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/mountain_climber.gif',
        'secondary_muscles': ['abs', 'shoulders'],
        'instructions': [
            'Begin in a high plank position and drive one knee toward your chest.',
            'Quickly switch legs in a running motion while keeping your hips low.',
        ],
    },
    {
        'exercise_id': '0006',
        'name': 'glute bridge',
        'body_part': 'upper legs',
        'target': 'glutes',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/glute_bridge.gif',
        'secondary_muscles': ['hamstrings', 'core'],
        'instructions': [
            'Lie on your back with knees bent and feet flat on the floor.',
            'Lift your hips up until your body forms a straight line from shoulders to knees, then lower back down.',
        ],
    },
    {
        'exercise_id': '0007',
        'name': 'walking lunge',
        'body_part': 'upper legs',
        'target': 'quads',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/walking_lunge.gif',
        'secondary_muscles': ['glutes', 'hamstrings'],
        'instructions': [
            'Step forward with one leg and bend both knees until the back knee is close to the floor.',
            'Push through the front heel and step forward with the other leg to continue walking.',
        ],
    },
    {
        'exercise_id': '0008',
        'name': 'bicycle crunch',
        'body_part': 'waist',
        'target': 'abs',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/bicycle_crunch.gif',
        'secondary_muscles': ['obliques', 'hip flexors'],
        'instructions': [
            'Lie on your back with hands behind your head and legs lifted.',
            'Bring your opposite elbow to the opposite knee while extending the other leg.',
        ],
    },
    {
        'exercise_id': '0009',
        'name': 'superman',
        'body_part': 'back',
        'target': 'lower back',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/superman.gif',
        'secondary_muscles': ['glutes', 'shoulders'],
        'instructions': [
            'Lie face down with arms extended overhead.',
            'Lift your arms and legs off the ground simultaneously, then lower back down.',
        ],
    },
    {
        'exercise_id': '0010',
        'name': 'jumping jack',
        'body_part': 'cardio',
        'target': 'cardiovascular system',
        'equipment': 'body weight',
        'gif_url': 'https://example.com/gifs/jumping_jack.gif',
        'secondary_muscles': ['calves', 'shoulders'],
        'instructions': [
            'Stand with your feet together and arms at your sides.',
            'Jump your feet out while raising your arms overhead, then return to the start position.',
        ],
    },
]


def load_initial_exercises(apps, schema_editor):
    Exercise = apps.get_model('exercises', 'Exercise')
    for exercise_data in INITIAL_EXERCISES:
        Exercise.objects.update_or_create(
            exercise_id=exercise_data['exercise_id'],
            defaults={
                'name': exercise_data['name'],
                'body_part': exercise_data['body_part'],
                'target': exercise_data['target'],
                'equipment': exercise_data['equipment'],
                'gif_url': exercise_data['gif_url'],
                'secondary_muscles': exercise_data['secondary_muscles'],
                'instructions': exercise_data['instructions'],
            },
        )


def unload_initial_exercises(apps, schema_editor):
    Exercise = apps.get_model('exercises', 'Exercise')
    exercise_ids = [item['exercise_id'] for item in INITIAL_EXERCISES]
    Exercise.objects.filter(exercise_id__in=exercise_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('exercises', '0002_rename_exercises_body_part_idx_exercises_e_body_pa_5ee11b_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(load_initial_exercises, reverse_code=unload_initial_exercises),
    ]
