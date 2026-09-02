import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthFrameProps = { eyebrow: string; title: string; children: ReactNode; footer: ReactNode }

export function AuthFrame({ eyebrow, title, children, footer }: AuthFrameProps) {
  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-page__art" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="auth-card">
        <Link className="auth-card__brand" to="/" aria-label="Voltar ao inicio">massarocario</Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        {children}
        <div className="auth-card__footer">{footer}</div>
      </div>
    </section>
  )
}
