import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './authSchemas'

describe('authentication form schemas', () => {
  it('accepts a valid registration', () => {
    const result = registerSchema.safeParse({
      name: 'Aline Silva',
      email: 'aline@example.com',
      password: 'pontinhos',
      confirmPassword: 'pontinhos',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a registration with a mismatched confirmation', () => {
    const result = registerSchema.safeParse({
      name: 'Aline Silva',
      email: 'aline@example.com',
      password: 'pontinhos',
      confirmPassword: 'outros-pontos',
    })

    expect(result.success).toBe(false)
  })

  it('requires valid credentials for login and recovery', () => {
    expect(loginSchema.safeParse({ email: 'nao-e-email', password: '' }).success).toBe(false)
    expect(forgotPasswordSchema.safeParse({ email: 'nao-e-email' }).success).toBe(false)
  })

  it('rejects a reset password confirmation mismatch', () => {
    expect(resetPasswordSchema.safeParse({ password: 'pontinhos', confirmPassword: 'novospontos' }).success).toBe(false)
  })
})