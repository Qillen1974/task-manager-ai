import {
  PROJECT_LIMITS,
  TASK_LIMITS,
  getPlanLimits,
  getTaskLimitForPlan,
  canCreateRootProject,
  canCreateSubproject,
  getProjectPath,
  calculateChildNestingLevel,
  getUpgradeMessage,
} from '@/lib/projectLimits'

// Use string literals for subscription plans to avoid Prisma dependency issues in tests
type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE'
const SubscriptionPlan = {
  FREE: 'FREE' as SubscriptionPlan,
  PRO: 'PRO' as SubscriptionPlan,
  ENTERPRISE: 'ENTERPRISE' as SubscriptionPlan,
}

describe('ProjectLimits - Plan Limits', () => {
  describe('getPlanLimits', () => {
    it('should return FREE plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.FREE)

      expect(limits.maxProjects).toBe(3)
      expect(limits.maxProjectNestingLevel).toBe(0)
      expect(limits.maxSubprojectsPerProject).toBe(0)
    })

    it('should return PRO plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.PRO)

      expect(limits.maxProjects).toBe(5)
      expect(limits.maxProjectNestingLevel).toBe(1)
      expect(limits.maxSubprojectsPerProject).toBe(-1)
    })

    it('should return ENTERPRISE plan limits', () => {
      const limits = getPlanLimits(SubscriptionPlan.ENTERPRISE)

      expect(limits.maxProjects).toBe(-1)
      expect(limits.maxProjectNestingLevel).toBe(-1)
      expect(limits.maxSubprojectsPerProject).toBe(-1)
    })
  })

  describe('getTaskLimitForPlan', () => {
    it('should return FREE plan task limits', () => {
      const limits = getTaskLimitForPlan(SubscriptionPlan.FREE)

      expect(limits.maxTasks).toBe(50)
    })

    it('should return PRO plan task limits (unlimited)', () => {
      const limits = getTaskLimitForPlan(SubscriptionPlan.PRO)

      expect(limits.maxTasks).toBe(-1)
    })

    it('should return ENTERPRISE plan task limits (unlimited)', () => {
      const limits = getTaskLimitForPlan(SubscriptionPlan.ENTERPRISE)

      expect(limits.maxTasks).toBe(-1)
    })
  })
})

describe('ProjectLimits - Project Creation Rules', () => {
  describe('canCreateRootProject', () => {
    it('should allow creating root project on FREE plan within limits', () => {
      const result = canCreateRootProject(SubscriptionPlan.FREE, 2)

      expect(result.allowed).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should reject creating root project on FREE plan at limit', () => {
      const result = canCreateRootProject(SubscriptionPlan.FREE, 3)

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('reached your project limit')
      expect(result.message).toContain('3')
    })

    it('should allow creating root project on PRO plan within limits', () => {
      const result = canCreateRootProject(SubscriptionPlan.PRO, 4)

      expect(result.allowed).toBe(true)
    })

    it('should reject creating root project on PRO plan at limit', () => {
      const result = canCreateRootProject(SubscriptionPlan.PRO, 5)

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('5')
    })

    it('should always allow creating root project on ENTERPRISE plan', () => {
      const result = canCreateRootProject(SubscriptionPlan.ENTERPRISE, 1000)

      expect(result.allowed).toBe(true)
    })
  })

  describe('canCreateSubproject', () => {
    it('should reject creating subproject on FREE plan', () => {
      const result = canCreateSubproject(SubscriptionPlan.FREE, 0)

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('does not support subprojects')
      expect(result.message).toContain('PRO')
    })

    it('should allow creating subproject on PRO plan at level 0', () => {
      const result = canCreateSubproject(SubscriptionPlan.PRO, 0)

      expect(result.allowed).toBe(true)
    })

    it('should reject creating nested subproject on PRO plan at level 1', () => {
      const result = canCreateSubproject(SubscriptionPlan.PRO, 1)

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('supports up to')
    })

    it('should allow creating subproject at any level on ENTERPRISE plan', () => {
      const result1 = canCreateSubproject(SubscriptionPlan.ENTERPRISE, 0)
      const result2 = canCreateSubproject(SubscriptionPlan.ENTERPRISE, 5)
      const result3 = canCreateSubproject(SubscriptionPlan.ENTERPRISE, 100)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result3.allowed).toBe(true)
    })
  })
})

describe('ProjectLimits - Project Path Functions', () => {
  describe('getProjectPath', () => {
    it('should return project name for root project', () => {
      const result = getProjectPath('My Project')

      expect(result).toBe('My Project')
    })

    it('should return project name for root project with empty parent path', () => {
      const result = getProjectPath('My Project', '')

      expect(result).toBe('My Project')
    })

    it('should return full path for nested project', () => {
      const result = getProjectPath('Subproject', 'Parent Project')

      expect(result).toBe('Parent Project > Subproject')
    })

    it('should return full path for deeply nested project', () => {
      const result = getProjectPath('Child', 'Grandparent > Parent')

      expect(result).toBe('Grandparent > Parent > Child')
    })
  })

  describe('calculateChildNestingLevel', () => {
    it('should calculate child level from parent level 0', () => {
      expect(calculateChildNestingLevel(0)).toBe(1)
    })

    it('should calculate child level from parent level 1', () => {
      expect(calculateChildNestingLevel(1)).toBe(2)
    })

    it('should calculate child level from any parent level', () => {
      expect(calculateChildNestingLevel(5)).toBe(6)
      expect(calculateChildNestingLevel(10)).toBe(11)
    })
  })
})

describe('ProjectLimits - Upgrade Messages', () => {
  describe('getUpgradeMessage', () => {
    it('should return message for subprojects upgrade', () => {
      const message = getUpgradeMessage(SubscriptionPlan.FREE, 'subprojects')

      expect(message).toContain('Upgrade to PRO')
      expect(message).toContain('subprojects')
    })

    it('should return message for more projects upgrade', () => {
      const message = getUpgradeMessage(SubscriptionPlan.FREE, 'more_projects')

      expect(message).toContain('Upgrade to PRO')
      expect(message).toContain('5 projects')
      expect(message).toContain('ENTERPRISE')
    })

    it('should return message from PRO plan for more projects', () => {
      const message = getUpgradeMessage(SubscriptionPlan.PRO, 'more_projects')

      expect(message).toContain('ENTERPRISE')
    })
  })
})
