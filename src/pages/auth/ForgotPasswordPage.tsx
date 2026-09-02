import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { FormField } from '../../components/ui/FormField'
import { useAuth } from '../../features/auth/AuthContext'
import { AuthFrame } from './AuthFrame'
import { type ForgotPasswordValues, forgotPasswordSchema } from './authSchemas'

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mode, requestPasswordReset } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  const submit = async (values: ForgotPasswordValues) => {
    try {
      setErrorMessage('')
      setIsSubmitting(true)
      await requestPasswordReset(values.email)
      setSubmitted(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel solicitar a recuperacao agora.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) return <AuthFrame eyebrow={mode === 'supabase' ? 'recuperacao de conta' : 'recuperacao de demonstracao'} title="Pedido recebido" footer={<Link to="/login">Voltar para entrar</Link>}><p className="form-success" role="status">{mode === 'supabase' ? 'Se este e-mail existir, o Supabase enviara o link de recuperacao.' : 'Se este e-mail existir, as proximas instrucoes chegarao por la quando o servico estiver conectado.'}</p></AuthFrame>

  return <AuthFrame eyebrow="vamos desfazer esse no" title="Recupere seu acesso" footer={<Link to="/login">Voltar para entrar</Link>}>
    <p className="auth-card__lead">{mode === 'supabase' ? 'Informe seu e-mail e o Supabase enviara o link de recuperacao configurado para este ambiente.' : 'Informe seu e-mail. Em breve, enviaremos por la as instrucoes para criar uma nova senha.'}</p>
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <FormField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      {errorMessage && <p className="form-field__error" role="alert">{errorMessage}</p>}
      <button className="button button--primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar instrucoes'}</button>
    </form>
  </AuthFrame>
}