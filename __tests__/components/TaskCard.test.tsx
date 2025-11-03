import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskCard } from '@/components/TaskCard'
import { Task, Project, Priority } from '@/lib/types'

describe('TaskCard Component', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test Description',
    color: 'blue',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test task description',
    projectId: 'project-1',
    priority: 'urgent-important' as Priority,
    completed: false,
    progress: 50,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }

  const mockHandlers = {
    onComplete: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render task title', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should render task description', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      expect(screen.getByText('Test task description')).toBeInTheDocument()
    })

    it('should render checkbox', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('should render checked checkbox for completed tasks', () => {
      const completedTask = { ...mockTask, completed: true }
      render(<TaskCard task={completedTask} {...mockHandlers} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should show project name when showProject is true', () => {
      render(<TaskCard task={mockTask} project={mockProject} showProject={true} {...mockHandlers} />)
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should not show project name when showProject is false', () => {
      render(<TaskCard task={mockTask} project={mockProject} showProject={false} {...mockHandlers} />)
      expect(screen.queryByText('Test Project')).not.toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('should display progress percentage', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should display 0% for task with no progress', () => {
      const taskNoProgress = { ...mockTask, progress: 0 }
      render(<TaskCard task={taskNoProgress} {...mockHandlers} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should display 100% for completed progress', () => {
      const taskCompleted = { ...mockTask, progress: 100 }
      render(<TaskCard task={taskCompleted} {...mockHandlers} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onComplete when checkbox is clicked', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(mockHandlers.onComplete).toHaveBeenCalledWith('task-1')
      expect(mockHandlers.onComplete).toHaveBeenCalledTimes(1)
    })

    it('should call onEdit when edit button is clicked', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      const editButton = screen.getByTitle('Edit task')
      fireEvent.click(editButton)
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTask)
      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button is clicked', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      const deleteButton = screen.getByTitle('Delete task')
      fireEvent.click(deleteButton)
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('task-1')
      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visual States', () => {
    it('should apply completed styles for completed tasks', () => {
      const completedTask = { ...mockTask, completed: true }
      render(<TaskCard task={completedTask} {...mockHandlers} />)
      const title = screen.getByText('Test Task')
      expect(title).toHaveClass('line-through')
      expect(title).toHaveClass('text-gray-500')
    })

    it('should apply active styles for pending tasks', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />)
      const title = screen.getByText('Test Task')
      expect(title).toHaveClass('text-gray-900')
      expect(title).not.toHaveClass('line-through')
    })
  })

  describe('Resource Information', () => {
    it('should display resource count when provided', () => {
      const taskWithResources = { ...mockTask, resourceCount: 3 }
      render(<TaskCard task={taskWithResources} {...mockHandlers} />)
      expect(screen.getByText('3 resources')).toBeInTheDocument()
    })

    it('should display singular resource when count is 1', () => {
      const taskWithOneResource = { ...mockTask, resourceCount: 1 }
      render(<TaskCard task={taskWithOneResource} {...mockHandlers} />)
      expect(screen.getByText('1 resource')).toBeInTheDocument()
    })

    it('should display manhours when provided', () => {
      const taskWithManhours = { ...mockTask, manhours: 40 }
      render(<TaskCard task={taskWithManhours} {...mockHandlers} />)
      expect(screen.getByText('40 hours')).toBeInTheDocument()
    })

    it('should display singular hour when manhours is 1', () => {
      const taskWithOneHour = { ...mockTask, manhours: 1 }
      render(<TaskCard task={taskWithOneHour} {...mockHandlers} />)
      expect(screen.getByText('1 hour')).toBeInTheDocument()
    })
  })

  describe('Task Dependencies', () => {
    it('should display dependency information when task has dependency', () => {
      const dependentTask: Task = {
        ...mockTask,
        dependsOnTask: {
          id: 'dep-task-1',
          title: 'Dependent Task',
          description: '',
          projectId: 'project-1',
          priority: 'urgent-important' as Priority,
          completed: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      }
      render(<TaskCard task={dependentTask} {...mockHandlers} />)
      expect(screen.getByText('Dependent Task')).toBeInTheDocument()
    })

    it('should show checkmark for completed dependency', () => {
      const dependentTask: Task = {
        ...mockTask,
        dependsOnTask: {
          id: 'dep-task-1',
          title: 'Completed Dependency',
          description: '',
          projectId: 'project-1',
          priority: 'urgent-important' as Priority,
          completed: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      }
      render(<TaskCard task={dependentTask} {...mockHandlers} />)
      expect(screen.getByText('✓')).toBeInTheDocument()
    })
  })
})
