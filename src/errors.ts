export class ApiError extends Error {
  status?: number;
  endpoint?: string;
  constructor(message: string, status?: number, endpoint?: string) {
    super(message);
    this.name = "ApiError";
    if (typeof status !== "undefined") this.status = status;
    if (typeof endpoint !== "undefined") this.endpoint = endpoint;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(endpoint?: string) {
    super("Unauthorized (401)", 401, endpoint);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(endpoint?: string) {
    super("Forbidden (403)", 403, endpoint);
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends ApiError {
  constructor(endpoint?: string) {
    super("Rate limited (429)", 429, endpoint);
    this.name = "RateLimitError";
  }
}

export class AuthChallengeError extends ApiError {
  constructor(endpoint?: string) {
    super("Authentication challenge detected", undefined, endpoint);
    this.name = "AuthChallengeError";
  }
}
