// Define a list of error codes for common issues
export const ErrorCodes = {
    INVALID_MESSAGE: "INVALID_MESSAGE",
    TRANSCRIPTION_FAILED: "TRANSCRIPTION_FAILED",
    LLM_FAILED: "LLM_FAILED",
    DATABASE_ERROR: "DATABASE_ERROR",
    CONFLICT_DETECTED: "CONFLICT_DETECTED",
    EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
    CALENDAR_API_ERROR: "CALENDAR_API_ERROR",
  } as const;

  // Base class for application errors
  export class AppError extends Error {
    constructor(
      message: string,
      public statusCode: number,
    ) {
      super(message);
      this.name = this.constructor.name;
    }
  }
  
  // Specific error classes for various scenarios
  
  export class UnauthorizedError extends AppError {
    constructor(message: string) {
      super(message, 401);
    }
  }
  
  export class BadRequestError extends AppError {
    constructor(message: string) {
      super(message, 400);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message: string) {
      super(message, 404);
    }
  }
  
  // Conflict error for scheduling issues
  export class ConflictError extends AppError {
    constructor(
      message: string,
      public conflictingEventId: string, // Optional ID of the conflicting event
    ) {
      super(message, 409);
    }
  }
  
  // Calendar-specific error for API integration issues
  export class CalendarApiError extends AppError {
    constructor(message: string) {
      super(message, 500);
    }
  }
  
  // Custom error for event-related logic
  export class EventError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode: number = 500,
    ) {
      super(message);
      this.name = "EventError";
    }
  }
 

  export class InteractionError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode: number = 500,
    ) {
      super(message);
      this.name = "InteractionError";
    }
  }

  export class AgentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AgentError";
    }
  }
  
  export class IntentDeterminationError extends AgentError {
    constructor(message: string) {
      super(message);
      this.name = "IntentDeterminationError";
    }
  }
  
  export class ExecutionError extends AgentError {
    constructor(message: string) {
      super(message);
      this.name = "ExecutionError";
    }
  }
  
  export class ValidationError extends AgentError {
    constructor(message: string) {
      super(message);
      this.name = "ValidationError";
    }
  }