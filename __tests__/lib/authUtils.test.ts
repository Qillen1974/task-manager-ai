import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getTokenFromHeader,
  validatePasswordStrength,
  validateEmail,
} from '@/lib/authUtils'

describe('AuthUtils - Password Hashing', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      // Due to salt, hashes should be different
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword123!', hash)

      expect(isValid).toBe(false)
    })
  })
})

describe('AuthUtils - JWT Tokens', () => {
  const userId = 'test-user-123'

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const token = generateAccessToken(userId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshToken(userId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(userId)
      const decoded = verifyToken(token, 'access')

      expect(decoded).not.toBeNull()
      expect(decoded?.userId).toBe(userId)
    })

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(userId)
      const decoded = verifyToken(token, 'refresh')

      expect(decoded).not.toBeNull()
      expect(decoded?.userId).toBe(userId)
    })

    it('should reject access token when verifying as refresh', () => {
      const token = generateAccessToken(userId)
      const decoded = verifyToken(token, 'refresh')

      expect(decoded).toBeNull()
    })

    it('should reject refresh token when verifying as access', () => {
      const token = generateRefreshToken(userId)
      const decoded = verifyToken(token, 'access')

      expect(decoded).toBeNull()
    })

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token', 'access')

      expect(decoded).toBeNull()
    })

    it('should reject malformed token', () => {
      const decoded = verifyToken('not.a.jwt', 'access')

      expect(decoded).toBeNull()
    })
  })

  describe('getTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const header = `Bearer ${token}`
      const result = getTokenFromHeader(header)

      expect(result).toBe(token)
    })

    it('should return null for missing header', () => {
      const result = getTokenFromHeader(undefined)

      expect(result).toBeNull()
    })

    it('should return null for invalid format', () => {
      const result = getTokenFromHeader('InvalidFormat token')

      expect(result).toBeNull()
    })

    it('should return null for missing Bearer prefix', () => {
      const result = getTokenFromHeader('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')

      expect(result).toBeNull()
    })

    it('should return null for empty header', () => {
      const result = getTokenFromHeader('')

      expect(result).toBeNull()
    })
  })
})

describe('AuthUtils - Validation', () => {
  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbers!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecial123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)')
    })

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('should accept all allowed special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*']

      specialChars.forEach(char => {
        const result = validatePasswordStrength(`Password1${char}`)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@example.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@example')).toBe(false)
      expect(validateEmail('user @example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })
})
