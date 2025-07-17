import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('nexus_library')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


app.conf.beat_schedule = {
    'check-due-date-reminders-daily': {
        'task': 'api.tasks.check_due_date_reminders',
        'schedule': crontab(hour=8, minute=0),  # every day at 8 AM
    },
    'expire-old-reservations-daily': {
        'task': 'api.tasks.expire_old_reservations',
        'schedule': crontab(hour=1, minute=0),  # every day at 1 AM
    },
}
