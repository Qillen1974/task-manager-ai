import {
  getPriorityLabel,
  getPriorityColor,
  getPriorityBadgeColor,
  getPriorityQuadrant,
  isDeadlineSoon,
  isOverdue,
  formatDate,
  formatDateTime,
  generateId,
  filterTasksByPriority,
  getTasksByProject,
  getCompletedTaskCount,
  getPendingTaskCount,
} from '@/lib/utils'
import { Priority, Task } from '@/lib/types'

describe('Utils - Priority Functions', () => {
  describe('getPriorityLabel', () => {
    it('should return correct label for urgent-important', () => {
      expect(getPriorityLabel('urgent-important')).toBe('Urgent & Important')
    })

    it('should return correct label for not-urgent-important', () => {
      expect(getPriorityLabel('not-urgent-important')).toBe('Not Urgent & Important')
    })

    it('should return correct label for urgent-not-important', () => {
      expect(getPriorityLabel('urgent-not-important')).toBe('Urgent & Not Important')
    })

    it('should return correct label for not-urgent-not-important', () => {
      expect(getPriorityLabel('not-urgent-not-important')).toBe('Not Urgent & Not Important')
    })

    it('should return "No Quadrant" for empty priority', () => {
      expect(getPriorityLabel('')).toBe('No Quadrant')
    })
  })

  describe('getPriorityColor', () => {
    it('should return red colors for urgent-important', () => {
      expect(getPriorityColor('urgent-important')).toBe('bg-red-50 border-red-200')
    })

    it('should return blue colors for not-urgent-important', () => {
      expect(getPriorityColor('not-urgent-important')).toBe('bg-blue-50 border-blue-200')
    })

    it('should return yellow colors for urgent-not-important', () => {
      expect(getPriorityColor('urgent-not-important')).toBe('bg-yellow-50 border-yellow-200')
    })

    it('should return gray colors for not-urgent-not-important', () => {
      expect(getPriorityColor('not-urgent-not-important')).toBe('bg-gray-50 border-gray-200')
    })

    it('should return gray colors for empty priority', () => {
      expect(getPriorityColor('')).toBe('bg-gray-50 border-gray-200')
    })
  })

  describe('getPriorityBadgeColor', () => {
    it('should return correct badge colors for each priority', () => {
      expect(getPriorityBadgeColor('urgent-important')).toBe('bg-red-100 text-red-800')
      expect(getPriorityBadgeColor('not-urgent-important')).toBe('bg-blue-100 text-blue-800')
      expect(getPriorityBadgeColor('urgent-not-important')).toBe('bg-yellow-100 text-yellow-800')
      expect(getPriorityBadgeColor('not-urgent-not-important')).toBe('bg-gray-100 text-gray-800')
      expect(getPriorityBadgeColor('')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getPriorityQuadrant', () => {
    it('should return correct quadrant for each priority', () => {
      expect(getPriorityQuadrant('urgent-important')).toBe('Quadrant I')
      expect(getPriorityQuadrant('not-urgent-important')).toBe('Quadrant II')
      expect(getPriorityQuadrant('urgent-not-important')).toBe('Quadrant III')
      expect(getPriorityQuadrant('not-urgent-not-important')).toBe('Quadrant IV')
      expect(getPriorityQuadrant('')).toBe('None')
    })
  })
})

describe('Utils - Deadline Functions', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent tests
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('isDeadlineSoon', () => {
    it('should return true for deadline today', () => {
      expect(isDeadlineSoon('2024-06-15')).toBe(true)
    })

    it('should return true for deadline in 1 day', () => {
      expect(isDeadlineSoon('2024-06-16')).toBe(true)
    })

    it('should return true for deadline in 3 days', () => {
      expect(isDeadlineSoon('2024-06-18')).toBe(true)
    })

    it('should return false for deadline in 4 days', () => {
      expect(isDeadlineSoon('2024-06-19')).toBe(false)
    })

    it('should return false for past deadline', () => {
      expect(isDeadlineSoon('2024-06-10')).toBe(false)
    })

    it('should return false for undefined deadline', () => {
      expect(isDeadlineSoon(undefined)).toBe(false)
    })
  })

  describe('isOverdue', () => {
    it('should return true for past deadline', () => {
      expect(isOverdue('2024-06-10')).toBe(true)
    })

    it('should return false for today deadline', () => {
      expect(isOverdue('2024-06-15')).toBe(false)
    })

    it('should return false for future deadline', () => {
      expect(isOverdue('2024-06-20')).toBe(false)
    })

    it('should return false for undefined deadline', () => {
      expect(isOverdue(undefined)).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate('2024-06-15')
      expect(result).toBe('Jun 15, 2024')
    })

    it('should return "No deadline" for undefined', () => {
      expect(formatDate(undefined)).toBe('No deadline')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const result = formatDateTime('2024-06-15', '14:30')
      expect(result).toBe('Jun 15, 2024 at 14:30')
    })

    it('should format date without time', () => {
      const result = formatDateTime('2024-06-15')
      expect(result).toBe('Jun 15, 2024')
    })

    it('should return "No deadline" for undefined date', () => {
      expect(formatDateTime(undefined)).toBe('No deadline')
    })
  })
})

describe('Utils - ID Generation', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it('should generate ID with timestamp and random string', () => {
      const id = generateId()
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })
})

describe('Utils - Task Filtering Functions', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: '',
      priority: 'urgent-important' as Priority,
      projectId: 'project-1',
      completed: false,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      title: 'Task 2',
      description: '',
      priority: 'not-urgent-important' as Priority,
      projectId: 'project-1',
      completed: true,
      createdAt: '2024-01-02',
    },
    {
      id: '3',
      title: 'Task 3',
      description: '',
      priority: 'urgent-important' as Priority,
      projectId: 'project-2',
      completed: false,
      createdAt: '2024-01-03',
    },
    {
      id: '4',
      title: 'Task 4',
      description: '',
      priority: 'urgent-not-important' as Priority,
      projectId: 'project-1',
      completed: true,
      createdAt: '2024-01-04',
    },
  ]

  describe('filterTasksByPriority', () => {
    it('should filter tasks by priority', () => {
      const result = filterTasksByPriority(mockTasks, 'urgent-important')
      expect(result).toHaveLength(2)
      expect(result.every(t => t.priority === 'urgent-important')).toBe(true)
    })

    it('should return empty array if no tasks match', () => {
      const result = filterTasksByPriority(mockTasks, 'not-urgent-not-important')
      expect(result).toHaveLength(0)
    })
  })

  describe('getTasksByProject', () => {
    it('should filter tasks by project', () => {
      const result = getTasksByProject(mockTasks, 'project-1')
      expect(result).toHaveLength(3)
      expect(result.every(t => t.projectId === 'project-1')).toBe(true)
    })

    it('should return empty array if no tasks match', () => {
      const result = getTasksByProject(mockTasks, 'project-999')
      expect(result).toHaveLength(0)
    })
  })

  describe('getCompletedTaskCount', () => {
    it('should count completed tasks', () => {
      expect(getCompletedTaskCount(mockTasks)).toBe(2)
    })

    it('should return 0 for empty array', () => {
      expect(getCompletedTaskCount([])).toBe(0)
    })
  })

  describe('getPendingTaskCount', () => {
    it('should count pending tasks', () => {
      expect(getPendingTaskCount(mockTasks)).toBe(2)
    })

    it('should return 0 for empty array', () => {
      expect(getPendingTaskCount([])).toBe(0)
    })
  })
})
