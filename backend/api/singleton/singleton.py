import threading

class Singleton:
    _instances = {}
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls not in cls._instances:
                cls._instances[cls] = super(Singleton, cls).__new__(cls)
        return cls._instances[cls]
