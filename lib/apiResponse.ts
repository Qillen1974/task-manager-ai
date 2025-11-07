import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponseBody<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Send success response
 */
export function success<T>(data: T, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponseBody<T>,
    { status: statusCode }
  );
}

/**
 * Send error response
 */
export function error(
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    } as ApiResponseBody,
    { status: statusCode }
  );
}

/**
 * Handle common API errors
 */
export const ApiErrors = {
  // Authentication errors
  UNAUTHORIZED: () => error("Unauthorized", 401, "UNAUTHORIZED"),
  INVALID_TOKEN: () => error("Invalid or expired token", 401, "INVALID_TOKEN"),
  MISSING_TOKEN: () => error("Missing authentication token", 401, "MISSING_TOKEN"),
  INVALID_CREDENTIALS: () => error("Invalid email or password", 401, "INVALID_CREDENTIALS"),
  SESSION_EXPIRED: () => error("Session expired. Please login again", 401, "SESSION_EXPIRED"),

  // User errors
  USER_NOT_FOUND: () => error("User not found", 404, "USER_NOT_FOUND"),
  EMAIL_ALREADY_EXISTS: () => error("Email already registered", 400, "EMAIL_ALREADY_EXISTS"),
  INVALID_EMAIL: () => error("Invalid email format", 400, "INVALID_EMAIL"),
  WEAK_PASSWORD: (errors: string[]) =>
    error("Password does not meet requirements", 400, "WEAK_PASSWORD", { errors }),
  INVALID_PASSWORD_LENGTH: () =>
    error("Password must be at least 8 characters", 400, "INVALID_PASSWORD_LENGTH"),

  // Resource errors
  NOT_FOUND: (resource: string) => error(`${resource} not found`, 404, "NOT_FOUND"),
  FORBIDDEN: () => error("You don't have permission to access this resource", 403, "FORBIDDEN"),
  RESOURCE_LIMIT_EXCEEDED: (resource: string) =>
    error(`You have reached the maximum number of ${resource}s for your plan`, 429, "LIMIT_EXCEEDED"),

  // Validation errors
  INVALID_INPUT: (details?: any) => error("Invalid input", 400, "INVALID_INPUT", details),
  MISSING_REQUIRED_FIELD: (field: string) =>
    error(`${field} is required`, 400, "MISSING_FIELD"),
  INVALID_FIELD_VALUE: (field: string) =>
    error(`Invalid value for ${field}`, 400, "INVALID_VALUE"),

  // Subscription errors
  SUBSCRIPTION_REQUIRED: () =>
    error("This feature requires an active subscription", 402, "SUBSCRIPTION_REQUIRED"),
  PAYMENT_FAILED: () => error("Payment failed. Please try again", 402, "PAYMENT_FAILED"),

  // Server errors
  INTERNAL_SERVER_ERROR: () =>
    error("An unexpected error occurred", 500, "INTERNAL_ERROR"),
  SERVICE_UNAVAILABLE: () =>
    error("Service temporarily unavailable", 503, "SERVICE_UNAVAILABLE"),

  // Rate limiting
  TOO_MANY_REQUESTS: () => error("Too many requests. Please try again later", 429, "RATE_LIMIT"),
};

/**
 * Safely handle API route errors
 */
export async function handleApiError(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (err: any) {
    console.error("API Error:", err);
    console.error("Error details:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    });

    if (err instanceof ApiError) {
      return error(err.message, err.statusCode, err.code);
    }

    // Database errors
    if (err.code === "P2002") {
      return error("This record already exists", 400, "DUPLICATE_RECORD");
    }
    if (err.code === "P2025") {
      return error("Record not found", 404, "NOT_FOUND");
    }

    // Log the full error for debugging
    return error(
      err?.message || "An unexpected error occurred",
      500,
      "INTERNAL_ERROR",
      { originalError: err?.code || err?.message }
    );
  }
}
