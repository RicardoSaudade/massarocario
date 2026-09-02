import { ButtonLink } from '../components/ui/ButtonLink'

export function AboutPage() {
  return (
    <section className="about" aria-labelledby="about-title">
      <div className="about__intro">
        <p className="eyebrow">sobre o massarocario</p>
        <h1 id="about-title">Uma casa para os fios que ainda nao sabem o que vao ser.</h1>
      </div>
      <div className="about__story">
        <div className="about__yarn" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <p>Massarocario nasceu da uniao de macaroca e diario: um jeito de olhar para os fios emaranhados como registro vivo de um fazer.</p>
          <p>Aline cria entre tentativas, cores e pontos. Seu trabalho celebra a imperfeicao bonita de quem aprende com as maos e encontra forma no que parecia caos.</p>
          <p>Este e um canto para compartilhar croche, inspiracao e pecas autorais que carregam tempo, presenca e historia.</p>
          <ButtonLink to="/register">Entrar no diario</ButtonLink>
        </div>
      </div>
    </section>
  )
}
