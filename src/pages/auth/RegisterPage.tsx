import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../../components/ui/FormField'
import { useAuth } from '../../features/auth/AuthContext'
import { AuthFrame } from './AuthFrame'
import { type RegisterValues, registerSchema } from './authSchemas'

export function RegisterPage() {
  const { mode, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const submit = async (values: RegisterValues) => {
    try {
      setFormError('')
      setStatusMessage('')
      setIsSubmitting(true)
      const result = await signUp(values)

      if (result.requiresEmailConfirmation) {
        setStatusMessage('Conta criada. Verifique seu e-mail para confirmar o acesso antes de entrar.')
        navigate('/login')
        return
      }

      navigate('/editor')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar a conta agora.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AuthFrame eyebrow="chegue mais perto" title="Crie sua conta" footer={<>Ja faz parte? <Link to="/login">Entrar</Link></>}>
    <p className="auth-card__lead">{mode === 'supabase' ? 'Ao cadastrar, seus graficos passam a ser associados a esta conta.' : 'Sem Supabase configurado, a conta e os graficos ficam apenas neste navegador.'}</p>
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <FormField label="Como voce quer ser chamada?" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <FormField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <FormField label="Senha" type="password" autoComplete="new-password" hint="Use ao menos 8 caracteres." error={errors.password?.message} {...register('password')} />
      <FormField label="Confirmar senha" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      {formError && <p className="form-field__error" role="alert">{formError}</p>}
      {statusMessage && <p className="form-success" role="status">{statusMessage}</p>}
      <button className="button button--primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando...' : 'Criar conta'}</button>
      {mode === 'local' && <button className="social-button" type="button" onClick={() => void signIn({ email: 'visitante@massarocario.local', password: 'conta-de-teste' }).then(() => navigate('/editor'))}>Continuar com conta de teste</button>}
    </form>
  </AuthFrame>
}
