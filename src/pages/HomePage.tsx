import { ButtonLink } from '../components/ui/ButtonLink'

export function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__threads" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="hero__content">
          <p className="eyebrow">croche, afeto e criacao</p>
          <h1 id="hero-title">massarocario</h1>
          <p className="hero__tagline">Onde o caos vira arte.</p>
          <p className="hero__copy">Um diario de fios emaranhados, pontos pacientes e pecas feitas para acompanhar historias de verdade.</p>
          <div className="hero__actions">
            <ButtonLink to="/register">Fazer parte</ButtonLink>
            <ButtonLink to="/about" tone="secondary">Conhecer a historia</ButtonLink>
          </div>
        </div>
        <div className="hero__cabinet" role="img" aria-label="Novelos coloridos organizados em um armario de madeira">
          <span className="hero__shelf hero__shelf--one" />
          <span className="hero__shelf hero__shelf--two" />
          <span className="yarn yarn--coral" /><span className="yarn yarn--yellow" /><span className="yarn yarn--blue" />
          <span className="yarn yarn--red" /><span className="yarn yarn--green" /><span className="yarn yarn--pink" />
        </div>
      </section>
      <section className="manifesto" aria-labelledby="manifesto-title">
        <div className="manifesto__heading">
          <p className="eyebrow">do armario para suas maos</p>
          <h2 id="manifesto-title">O bonito mora no processo.</h2>
        </div>
        <p>Por aqui, a massaroca nao e bagunca: e comeco. Cada fio fora do lugar guarda a chance de uma nova textura, uma ideia e um encontro.</p>
        <ButtonLink to="/about" tone="plain">Mais sobre a Aline <span aria-hidden="true">-&gt;</span></ButtonLink>
      </section>
    </>
  )
}
