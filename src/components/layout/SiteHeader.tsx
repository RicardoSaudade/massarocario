import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigation = useMemo(() => (user ? [{ label: 'Editor', to: '/editor' }] : []), [user])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Pular para o conteudo
      </a>
      <div className="site-header__inner">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Massarocario, pagina inicial">
          <span className="brand__mark" aria-hidden="true">m</span>
          <span>massarocario</span>
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <span className="menu-button__lines" aria-hidden="true"><i /><i /><i /></span>
          <span className="sr-only">{isMenuOpen ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>
        <nav id="primary-navigation" className={isMenuOpen ? 'primary-nav primary-nav--open' : 'primary-nav'} aria-label="Principal">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeMenu}>
              {item.label}
            </NavLink>
          ))}
          {user ? <>
            <NavLink className="primary-nav__account" to="/editor" onClick={closeMenu}>Editor</NavLink>
            <button className="header-logout" type="button" onClick={() => { signOut(); closeMenu() }}>Sair</button>
          </> : <NavLink className="primary-nav__account" to="/login" onClick={closeMenu}>Entrar</NavLink>}
        </nav>
      </div>
    </header>
  )
}
