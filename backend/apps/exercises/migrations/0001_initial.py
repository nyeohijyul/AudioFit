from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Exercise',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('exercise_id', models.CharField(db_index=True, max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('body_part', models.CharField(db_index=True, max_length=100)),
                ('target', models.CharField(db_index=True, max_length=100)),
                ('equipment', models.CharField(db_index=True, max_length=100)),
                ('gif_url', models.URLField(blank=True, max_length=1024)),
                ('secondary_muscles', models.JSONField(blank=True, default=list)),
                ('instructions', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
                'indexes': [
                    models.Index(fields=['body_part'], name='exercises_body_part_idx'),
                    models.Index(fields=['target'], name='exercises_target_idx'),
                    models.Index(fields=['equipment'], name='exercises_equipment_idx'),
                ],
            },
        ),
    ]
