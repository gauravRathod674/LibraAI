from api.observer.observer import Subject
from api.observer.user_observer import UserObserver

def get_subject():
    subject = Subject()
    subject.attach(UserObserver())
    return subject