import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isStrongPassword,
  getPasswordStrength,
} from '../validation'

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
      expect(isValidEmail('name+tag@email.com')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })
  })

  describe('isStrongPassword', () => {
    it('returns true for strong passwords', () => {
      expect(isStrongPassword('Password1!')).toBe(true)
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true)
      expect(isStrongPassword('Str0ng!Pass')).toBe(true)
      expect(isStrongPassword('NOLOWERCASE1!')).toBe(true)
    })

    it('returns false for weak passwords', () => {
      expect(isStrongPassword('')).toBe(false)
      expect(isStrongPassword('short')).toBe(false)
      expect(isStrongPassword('nouppercase1!')).toBe(false)
      expect(isStrongPassword('NoNumbers!')).toBe(false)
      expect(isStrongPassword('NoSpecial1')).toBe(false)
    })
  })

  describe('getPasswordStrength', () => {
    it('returns weak for passwords meeting 0-2 criteria', () => {
      const result = getPasswordStrength('weak')
      expect(result.strength).toBe('weak')
      expect(result.criteria.minLength).toBe(false)
    })

    it('returns medium for passwords meeting 3 criteria', () => {
      const result = getPasswordStrength('Password1')
      expect(result.strength).toBe('medium')
      expect(result.criteria.minLength).toBe(true)
      expect(result.criteria.hasUppercase).toBe(true)
      expect(result.criteria.hasNumber).toBe(true)
      expect(result.criteria.hasSpecial).toBe(false)
    })

    it('returns strong for passwords meeting all 4 criteria', () => {
      const result = getPasswordStrength('Password1!')
      expect(result.strength).toBe('strong')
      expect(result.criteria.minLength).toBe(true)
      expect(result.criteria.hasUppercase).toBe(true)
      expect(result.criteria.hasNumber).toBe(true)
      expect(result.criteria.hasSpecial).toBe(true)
    })

    it('provides detailed criteria breakdown', () => {
      const result = getPasswordStrength('Test')
      expect(result.criteria).toEqual({
        minLength: false,
        hasUppercase: true,
        hasNumber: false,
        hasSpecial: false,
      })
    })
  })
})
