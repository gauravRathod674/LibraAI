from django.core.mail import send_mail
from api.models.models_notifications import Notification
from django.conf import settings

class NotificationService:
    @staticmethod
    def send_notification(user, subject, message):
        # In-app notification
        Notification.objects.create(user=user, message=message)

        # Email notification
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,  # Sender's email
            [user.email],              # Recipient list
            fail_silently=False,
        )
