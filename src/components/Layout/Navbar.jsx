import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/rezepte', label: 'Rezepte', icon: '📖' },
  { to: '/einkaufsliste', label: 'Einkaufen', icon: '🛒' },
  { to: '/verlauf', label: 'Verlauf', icon: '📅' },
]

export default function Navbar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">🍴 Rezepte</span>
        <div className="navbar-links">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm nav-logout" onClick={handleSignOut}>
          Abmelden
        </button>
      </div>

      {/* Mobile bottom bar */}
      <div className="mobile-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-nav-item${isActive ? ' mobile-nav-active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
