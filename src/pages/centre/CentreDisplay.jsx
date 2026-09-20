import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'

export default function CentreDisplay() {
  const { profile } = useAuth()
  const { todayKey, useQueue } = useData()
  const today = todayKey()
  const queue = useQueue(profile?.id, today)

  return (
    <div className="display-page">
      <span className="d-centre">{profile?.centreName}</span>
      <span className="d-label">Now serving</span>
      <div className="d-number">{queue?.nowServing || '—'}</div>
      <span className="d-hint">Please watch for your token number</span>
      <style>{`
        .display-page {
          min-height: 100vh;
          background: radial-gradient(ellipse at 30% 20%, #3D3226 0%, var(--soil) 55%);
          color: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
          padding: 24px;
        }
        .d-centre {
          font-size: 18px;
          color: var(--wheat);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .d-label {
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #B8AD93;
          font-weight: 600;
          margin-top: 8px;
        }
        .d-number {
          font-family: var(--font-mono);
          font-size: clamp(120px, 28vw, 260px);
          line-height: 0.95;
          font-weight: 700;
          letter-spacing: -0.04em;
          text-shadow: 0 8px 40px rgba(0,0,0,0.25);
        }
        .d-hint { font-size: 16px; color: #9A8B6E; margin-top: 8px; }
      `}</style>
    </div>
  )
}
