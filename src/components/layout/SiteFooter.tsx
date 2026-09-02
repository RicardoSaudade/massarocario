import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link className="brand brand--footer" to="/" aria-label="Massarocario, pagina inicial">
          <span className="brand__mark" aria-hidden="true">m</span>
          <span>massarocario</span>
        </Link>
        <p>Do emaranhado nascem pontos, historias e arte.</p>
        <small>Massarocario {new Date().getFullYear()}</small>
      </div>
    </footer>
  )
}
