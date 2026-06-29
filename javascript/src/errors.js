export class DatabasetError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = "DatabasetError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export class ValidationError extends DatabasetError {
  constructor(message) {
    super(message, { code: "validation_error" });
    this.name = "ValidationError";
  }
}
