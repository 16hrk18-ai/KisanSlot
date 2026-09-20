import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { collectNotifications } from '../lib/notifications.js'

export default function Notifications() {
  const { profile, role, markNotificationsSeen } = useAuth()
  const { useFarmerBookings, useCentreBookings } = useData()
  const farmerBookings = useFarmerBookings(role === 'farmer' ? profile?.id : null)
  const centreBookings = useCentreBookings(role === 'centre' ? profile?.id : null)
  const bookings = role === 'farmer' ? farmerBookings : centreBookings
  const items = collectNotifications(bookings, role)

  useEffect(() => {
    markNotificationsSeen()
  }, [])

  return (
    <div className="container notif-page">
      <span className="eyebrow">Notifications</span>
      <h1>Everything sent to you</h1>
      <p className="page-sub">In-app alerts, updated in real time as each booking progresses.</p>

      {items.length === 0 && <p className="empty">Nothing yet.</p>}

      <div className="notif-list">
        {items.map((n, i) => (
          <div className="card notif-row" key={i}>
            <span className={`notif-dot dot-${n.tone}`} />
            <div>
              <p>{n.text}</p>
              <span className="notif-meta">{n.who} · {new Date(n.ts).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .notif-page { padding: 36px 20px 72px; }
        .notif-page h1 { font-size: clamp(26px, 3.5vw, 32px); margin: 8px 0 6px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); margin: 0 0 28px; font-size: 15px; }
        .empty { color: var(--ink-soft); }
        .notif-list { display: flex; flex-direction: column; gap: 10px; max-width: 640px; }
        .notif-row { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; }
        .notif-row p { margin: 0 0 4px; font-size: 14px; line-height: 1.5; }
        .notif-meta { font-size: 11px; color: var(--ink-faint); }
        .notif-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(0,0,0,0.03); }
        .dot-ok { background: var(--ok); }
        .dot-pending { background: var(--pending); }
        .dot-bad { background: var(--bad); }
      `}</style>
    </div>
  )
}
