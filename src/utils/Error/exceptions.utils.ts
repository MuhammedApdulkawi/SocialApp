import { HttpException } from "./http.exception.utils";

export class BadRequestError extends HttpException {
  constructor(
    public message: string,
    public error?: object,
  ) {
    super(message, 400, error);
  }
}

export class NotFoundError extends HttpException {
  constructor(
    public message: string,
    public error?: object,
  ) {
    super(message, 404, error);
  }
}

export class UnauthorizedError extends HttpException {
  constructor(
    public message: string,
    public error?: object,
  ) {
    super(message, 401, error);
  }
}

export class ForbiddenError extends HttpException {
  constructor(
    public message: string,
    public error?: object,
  ) {
    super(message, 403, error);
  }
}

export class ConflictError extends HttpException {
  constructor(
    public message: string,
    public error?: object,
  ) {
    super(message, 409, error);
  }
}
