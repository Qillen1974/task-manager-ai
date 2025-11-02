import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

/**
 * Custom render function that wraps components with providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { ...options })

export * from '@testing-library/react'
export { customRender as render }

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
  }
}

/**
 * Create mock task for testing
 */
export function createMockTask(overrides?: any) {
  return {
    id: 'test-task-1',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'urgent-important',
    projectId: 'test-project-1',
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    deadline: '2024-12-31',
    ...overrides,
  }
}

/**
 * Create mock project for testing
 */
export function createMockProject(overrides?: any) {
  return {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'Test Description',
    color: '#3b82f6',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/**
 * Create mock user for testing
 */
export function createMockUser(overrides?: any) {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    subscriptionPlan: 'FREE',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}
