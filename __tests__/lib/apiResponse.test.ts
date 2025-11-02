import {
  ApiError,
  success,
  error,
  ApiErrors,
  handleApiError,
} from '@/lib/apiResponse'
import { NextResponse } from 'next/server'

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, ...init })),
  },
}))

describe('ApiResponse - ApiError Class', () => {
  it('should create ApiError with all parameters', () => {
    const apiError = new ApiError(400, 'Test error', 'TEST_CODE')

    expect(apiError).toBeInstanceOf(Error)
    expect(apiError.statusCode).toBe(400)
    expect(apiError.message).toBe('Test error')
    expect(apiError.code).toBe('TEST_CODE')
    expect(apiError.name).toBe('ApiError')
  })

  it('should create ApiError without code', () => {
    const apiError = new ApiError(500, 'Server error')

    expect(apiError.statusCode).toBe(500)
    expect(apiError.message).toBe('Server error')
    expect(apiError.code).toBeUndefined()
  })
})

describe('ApiResponse - Success Response', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create success response with default status 200', () => {
    const data = { id: 1, name: 'Test' }
    const response = success(data)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        data,
      },
      { status: 200 }
    )
  })

  it('should create success response with custom status code', () => {
    const data = { id: 1 }
    const response = success(data, 201)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        data,
      },
      { status: 201 }
    )
  })

  it('should handle null data', () => {
    const response = success(null)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        data: null,
      },
      { status: 200 }
    )
  })

  it('should handle array data', () => {
    const data = [1, 2, 3]
    const response = success(data)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        data,
      },
      { status: 200 }
    )
  })
})

describe('ApiResponse - Error Response', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create error response with default status 400', () => {
    const response = error('Test error')

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: {
          message: 'Test error',
          code: undefined,
          details: undefined,
        },
      },
      { status: 400 }
    )
  })

  it('should create error response with custom status code', () => {
    const response = error('Not found', 404)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: {
          message: 'Not found',
          code: undefined,
          details: undefined,
        },
      },
      { status: 404 }
    )
  })

  it('should create error response with error code', () => {
    const response = error('Validation failed', 400, 'VALIDATION_ERROR')

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
        }),
      }),
      { status: 400 }
    )
  })

  it('should create error response with details', () => {
    const details = { field: 'email', reason: 'Invalid format' }
    const response = error('Validation failed', 400, 'VALIDATION_ERROR', details)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
        }),
      }),
      { status: 400 }
    )
  })
})

describe('ApiResponse - Predefined ApiErrors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Errors', () => {
    it('should create UNAUTHORIZED error', () => {
      ApiErrors.UNAUTHORIZED()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          }),
        }),
        { status: 401 }
      )
    })

    it('should create INVALID_TOKEN error', () => {
      ApiErrors.INVALID_TOKEN()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_TOKEN',
          }),
        }),
        { status: 401 }
      )
    })

    it('should create INVALID_CREDENTIALS error', () => {
      ApiErrors.INVALID_CREDENTIALS()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          }),
        }),
        { status: 401 }
      )
    })
  })

  describe('User Errors', () => {
    it('should create USER_NOT_FOUND error', () => {
      ApiErrors.USER_NOT_FOUND()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'USER_NOT_FOUND',
          }),
        }),
        { status: 404 }
      )
    })

    it('should create EMAIL_ALREADY_EXISTS error', () => {
      ApiErrors.EMAIL_ALREADY_EXISTS()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Email already registered',
            code: 'EMAIL_ALREADY_EXISTS',
          }),
        }),
        { status: 400 }
      )
    })

    it('should create WEAK_PASSWORD error with details', () => {
      const errors = ['Too short', 'No special characters']
      ApiErrors.WEAK_PASSWORD(errors)
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'WEAK_PASSWORD',
            details: { errors },
          }),
        }),
        { status: 400 }
      )
    })
  })

  describe('Resource Errors', () => {
    it('should create NOT_FOUND error with resource name', () => {
      ApiErrors.NOT_FOUND('Task')
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Task not found',
            code: 'NOT_FOUND',
          }),
        }),
        { status: 404 }
      )
    })

    it('should create RESOURCE_LIMIT_EXCEEDED error', () => {
      ApiErrors.RESOURCE_LIMIT_EXCEEDED('project')
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('maximum number of projects'),
            code: 'LIMIT_EXCEEDED',
          }),
        }),
        { status: 429 }
      )
    })
  })

  describe('Server Errors', () => {
    it('should create INTERNAL_SERVER_ERROR', () => {
      ApiErrors.INTERNAL_SERVER_ERROR()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
          }),
        }),
        { status: 500 }
      )
    })
  })
})

describe('ApiResponse - handleApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should handle successful function execution', async () => {
    const successFn = jest.fn().mockResolvedValue('success')
    const result = await handleApiError(successFn)

    expect(successFn).toHaveBeenCalled()
    expect(result).toBe('success')
  })

  it('should handle ApiError', async () => {
    const apiError = new ApiError(403, 'Forbidden', 'FORBIDDEN')
    const errorFn = jest.fn().mockRejectedValue(apiError)

    await handleApiError(errorFn)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Forbidden',
          code: 'FORBIDDEN',
        }),
      }),
      { status: 403 }
    )
  })

  it('should handle Prisma duplicate record error (P2002)', async () => {
    const prismaError = { code: 'P2002', message: 'Unique constraint failed' }
    const errorFn = jest.fn().mockRejectedValue(prismaError)

    await handleApiError(errorFn)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'This record already exists',
          code: 'DUPLICATE_RECORD',
        }),
      }),
      { status: 400 }
    )
  })

  it('should handle Prisma record not found error (P2025)', async () => {
    const prismaError = { code: 'P2025', message: 'Record not found' }
    const errorFn = jest.fn().mockRejectedValue(prismaError)

    await handleApiError(errorFn)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Record not found',
          code: 'NOT_FOUND',
        }),
      }),
      { status: 404 }
    )
  })

  it('should handle unknown errors as internal server error', async () => {
    const unknownError = new Error('Something went wrong')
    const errorFn = jest.fn().mockRejectedValue(unknownError)

    await handleApiError(errorFn)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
        }),
      }),
      { status: 500 }
    )
  })

  it('should log errors to console', async () => {
    const testError = new Error('Test error')
    const errorFn = jest.fn().mockRejectedValue(testError)

    await handleApiError(errorFn)

    expect(console.error).toHaveBeenCalledWith('API Error:', testError)
  })
})
