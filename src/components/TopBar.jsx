import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { collectNotifications, countUnread } from '../lib/notifications.js'

export default function TopBar() {
  const { user, role, profile, signOut } = useAuth()
  const { useFarmerBookings, useCentreBookings } = useData()
  const navigate = useNavigate()
  const location = useLocation()

  const farmerBookings = useFarmerBookings(role === 'farmer' ? profile?.id : null)
  const centreBookings = useCentreBookings(role === 'centre' ? profile?.id : null)
  const bookings = role === 'farmer' ? farmerBookings : centreBookings
  const unread = profile ? countUnread(collectNotifications(bookings, role), profile.notifSeenAt) : 0

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const homePath = role === 'centre' ? '/centre' : role === 'farmer' ? '/farmer' : '/'
  const isLanding = location.pathname === '/'

  // Minimal chrome on landing when signed out
  if (!user && isLanding) {
    return (
      <header className="topbar topbar-minimal">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">क</span>
            <span className="brand-name">KisanSlot</span>
          </Link>
        </div>
        <style>{barStyles}</style>
      </header>
    )
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to={homePath} className="brand">
          <span className="brand-mark">क</span>
          <span className="brand-name">KisanSlot</span>
        </Link>

        {user && role === 'farmer' && (
          <nav className="topbar-nav">
            <NavLink to="/farmer" current={location.pathname}>Centres</NavLink>
            <NavLink to="/farmer/bookings" current={location.pathname}>Bookings</NavLink>
          </nav>
        )}
        {user && role === 'centre' && (
          <nav className="topbar-nav">
            <NavLink to="/centre" current={location.pathname} exact>Requests</NavLink>
            <NavLink to="/centre/queue" current={location.pathname}>Queue</NavLink>
            <NavLink to="/centre/schedules" current={location.pathname}>Schedules</NavLink>
          </nav>
        )}

        {user && (
          <div className="topbar-user">
            <Link to="/notifications" className="bell" aria-label="Notifications">
              <BellIcon />
              {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <span className="avatar" title={profile?.name || profile?.centreName || user.displayName || ''}>
              {(profile?.name || profile?.centreName || user.displayName || '?').charAt(0).toUpperCase()}
            </span>
            <button type="button" className="btn btn-secondary btn-signout" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
      <style>{barStyles}</style>
    </header>
  )
}

function NavLink({ to, current, children, exact }) {
  const active = exact ? current === to : current === to || current.startsWith(to + '/')
  return (
    <Link to={to} className={active ? 'nav-active' : ''}>
      {children}
    </Link>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

const barStyles = `
  .topbar {
    border-bottom: 1px solid var(--line);
    background: rgba(251, 247, 239, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 40;
  }
  .topbar-minimal { border-bottom-color: transparent; background: transparent; backdrop-filter: none; }
  .topbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--leaf);
    color: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(61, 107, 76, 0.25);
  }
  .brand-name {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 600;
    color: var(--soil);
    letter-spacing: -0.02em;
  }
  .topbar-nav {
    display: flex;
    gap: 4px;
    font-weight: 600;
    font-size: 13px;
    flex: 1;
    justify-content: center;
  }
  .topbar-nav a {
    text-decoration: none;
    color: var(--ink-soft);
    padding: 8px 14px;
    border-radius: 999px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .topbar-nav a:hover { color: var(--soil); background: rgba(42, 33, 24, 0.04); }
  .topbar-nav a.nav-active {
    color: var(--soil);
    background: var(--white);
    box-shadow: var(--shadow-sm);
  }
  .topbar-user {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .bell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--ink-soft);
    text-decoration: none;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .bell:hover { background: var(--paper); color: var(--soil); }
  .bell-count {
    position: absolute;
    top: 2px;
    right: 2px;
    background: var(--bad);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 5px;
    min-width: 16px;
    text-align: center;
    line-height: 1.3;
  }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--wheat), #D4A84B);
    color: var(--soil);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    box-shadow: 0 2px 6px rgba(201, 154, 46, 0.3);
  }
  .btn-signout {
    padding: 8px 14px;
    font-size: 13px;
  }
  @media (max-width: 720px) {
    .topbar-nav { display: none; }
    .btn-signout { display: none; }
  }
`
