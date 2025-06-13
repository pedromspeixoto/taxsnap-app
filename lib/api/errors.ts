// Base error class for service errors
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UserAlreadyExistsError extends ServiceError {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class UserNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

export class UserNotVerifiedError extends ServiceError {
  constructor() {
    super('User email is not verified');
  }
}

export class UserAlreadyVerifiedError extends ServiceError {
  constructor() {
    super('User is already verified');
  }
}

export class InvalidVerificationTokenError extends ServiceError {
  constructor() {
    super('Invalid or expired verification token');
  }
}

export class InvalidCredentialsError extends ServiceError {
  constructor() {
    super('Invalid email or password');
  }
}

export class InvalidPasswordError extends ServiceError {
  constructor() {
    super(`Invalid password`);
  }
}

export class PasswordNotSetError extends ServiceError {
  constructor() {
    super('Password has not been set');
  }
} 