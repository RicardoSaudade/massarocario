import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../../components/ui/FormField'
import { useAuth } from '../../features/auth/AuthContext'
import { AuthFrame } from './AuthFrame'
import { type ResetPasswordValues, resetPasswordSchema } from './authSchemas'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { mode, updatePassword } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  const submit = async (values: ResetPasswordValues) => {
    try {
      setErrorMessage('')
      setStatusMessage('')
      setIsSubmitting(true)
      await updatePassword(values)
      setStatusMessage(mode === 'supabase' ? 'Senha atualizada. Voce ja pode entrar com a nova senha.' : 'Modo demonstracao ativo: a nova senha so funcionara quando o Supabase estiver conectado.')
      navigate('/login')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel atualizar sua senha agora.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AuthFrame eyebrow="nova senha" title="Defina uma nova senha" footer={<Link to="/login">Voltar para entrar</Link>}>
    <p className="auth-card__lead">{mode === 'supabase' ? 'Abra esta tela pelo link recebido por e-mail para concluir a recuperacao.' : 'Esta tela ja esta pronta para o Supabase. Sem a integracao ativa, ela funciona apenas como demonstracao.'}</p>
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <FormField label="Nova senha" type="password" autoComplete="new-password" hint="Use pelo menos 8 caracteres." error={errors.password?.message} {...register('password')} />
      <FormField label="Confirmar nova senha" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      {errorMessage && <p className="form-field__error" role="alert">{errorMessage}</p>}
      {statusMessage && <p className="form-success" role="status">{statusMessage}</p>}
      <button className="button button--primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Atualizando...' : 'Atualizar senha'}</button>
    </form>
  </AuthFrame>
}