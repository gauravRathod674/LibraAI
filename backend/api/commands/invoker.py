class Invoker:
    def __init__(self):
        # Track command history per user or item
        self._user_command_histories = {}

    def execute_command(self, user, command):
        """Executes the given command for the user and records it in their command history."""
        try:
            # Ensure user has a history initialized
            if user not in self._user_command_histories:
                self._user_command_histories[user] = []

            command.execute()
            self._user_command_histories[user].append(command)
            print(f"[Invoker] Command executed successfully for {user.name}.")
        except Exception as e:
            print(f"[Invoker] Command execution failed for {user.name}: {e}")

    def undo_last(self, user):
        """Undoes the last command executed by the user."""
        if user not in self._user_command_histories or not self._user_command_histories[user]:
            print(f"[Invoker] No command to undo for {user.name}.")
            return

        last_command = self._user_command_histories[user].pop()
    
        try:
            last_command.undo()
            print(f"[Invoker] Undo successful for {user.name}.")
        except NotImplementedError as e:
            print(f"[Invoker] Undo not supported for {user.name}: {e}")
        except Exception as e:
            print(f"[Invoker] Undo failed for {user.name}: {e}")

