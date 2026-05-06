export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const unauthorized = (message = "Unauthorized") => 
  new ApiError(message, 401, "UNAUTHORIZED");

export const forbidden = (message = "Forbidden") => 
  new ApiError(message, 403, "FORBIDDEN");

export const notFound = (entity = "Entity") => 
  new ApiError(`${entity} not found`, 404, "NOT_FOUND");

export const validationError = (message = "Validation failed") => 
  new ApiError(message, 400, "VALIDATION_ERROR");

export const conflict = (message: string) => 
  new ApiError(message, 409, "CONFLICT");

export const serverError = (message = "Internal server error") => 
  new ApiError(message, 500, "SERVER_ERROR");
