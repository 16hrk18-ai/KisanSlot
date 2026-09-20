import { useData } from '../context/DataContext.jsx'

export default function LiveQueueWidget({ centreId, date, myToken }) {
  const { useQueue } = useData()
  const queue = useQueue(centreId, date)

  if (!queue) return null

  const nowServing = queue.nowServing || 0
  const ahead = Math.max(0, myToken - nowServing - 1)
  const isNow = myToken <= nowServing || myToken === nowServing + 1

  return (
    <div className={`queue-widget ${isNow ? 'urgent' : ''}`}>
      <div className="qw-col">
        <span className="qw-label">Now serving</span>
        <strong className="qw-value">{nowServing || '—'}</strong>
      </div>
      <div className="qw-divider" />
      <div className="qw-col">
        <span className="qw-label">Your token</span>
        <strong className="qw-value mine">{myToken}</strong>
      </div>
      <div className="qw-note">
        {myToken <= nowServing
          ? "You've been called — please proceed."
          : ahead === 0
            ? "You're next up."
            : `About ${ahead} ${ahead === 1 ? 'farmer' : 'farmers'} ahead.`}
      </div>
      <style>{`
        .queue-widget {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px 18px;
          margin: 12px 0;
        }
        .queue-widget.urgent {
          background: var(--leaf-soft);
          border-color: rgba(61, 107, 76, 0.25);
        }
        .qw-col { display: flex; flex-direction: column; gap: 2px; }
        .qw-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--ink-faint);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .qw-value {
          font-family: var(--font-mono);
          font-size: 24px;
          color: var(--soil);
          letter-spacing: -0.03em;
        }
        .qw-value.mine { color: var(--leaf); }
        .qw-divider {
          width: 1px;
          height: 36px;
          background: var(--line);
        }
        .qw-note {
          font-size: 13px;
          color: var(--soil-light);
          font-weight: 600;
          flex: 1;
          min-width: 140px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
