class DatabasetError(Exception):
  def __init__(self, message: str, *, status: int | None = None, code: str | None = None, body=None):
    super().__init__(message)
    self.status = status
    self.code = code
    self.body = body


class ValidationError(DatabasetError):
  def __init__(self, message: str):
    super().__init__(message, code="validation_error")


class ApiError(DatabasetError):
  pass
