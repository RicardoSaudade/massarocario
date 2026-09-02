import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FormField } from '../../components/ui/FormField'
import { useAuth } from '../../features/auth/AuthContext'
import { AuthFrame } from './AuthFrame'
import { type LoginValues, loginSchema } from './authSchemas'

export function LoginPage() {
  const { mode, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const submit = async (values: LoginValues) => {
    try {
      setFormError('')
      setIsSubmitting(true)
      await signIn(values)
      navigate(location.state?.from ?? '/editor')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel entrar agora.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AuthFrame eyebrow="bom te ver por aqui" title="Entre no seu canto de fios" footer={<>Ainda nao tem conta? <Link to="/register">Criar conta</Link></>}>
    <p className="auth-card__lead">{mode === 'supabase' ? 'Entre com sua conta real para salvar seus graficos na nuvem.' : 'Modo demonstracao ativo: sem .env do Supabase, os dados continuam locais neste navegador.'}</p>
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <FormField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <FormField label="Senha" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      <Link className="text-link" to="/forgot-password">Esqueci minha senha</Link>
      {formError && <p className="form-field__error" role="alert">{formError}</p>}
      <button className="button button--primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'}</button>
      {mode === 'local' && <button className="social-button" type="button" onClick={() => void submit({ email: 'visitante@massarocario.local', password: 'conta-de-teste' })}>Continuar com conta de teste</button>}
    </form>
  </AuthFrame>
}
