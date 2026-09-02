import { z } from 'zod'

const email = z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail valido.')
const password = z.string().min(8, 'Use pelo menos 8 caracteres.')

export const loginSchema = z.object({ email, password: z.string().min(1, 'Informe sua senha.') })
export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome.'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type RegisterValues = z.infer<typeof registerSchema>
