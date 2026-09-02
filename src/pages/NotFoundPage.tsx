import { ButtonLink } from '../components/ui/ButtonLink'

export function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="eyebrow">fio solto</p>
      <h1>Esta pagina se perdeu na massaroca.</h1>
      <p>Vamos voltar para um cantinho conhecido.</p>
      <ButtonLink to="/">Ir para o inicio</ButtonLink>
    </section>
  )
}
