import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { StatusBadge, PaymentBadge } from '../../components/StatusBadge.jsx'
import StatusStepper from '../../components/StatusStepper.jsx'
import QrToken from '../../components/QrToken.jsx'
import LiveQueueWidget from '../../components/LiveQueueWidget.jsx'

export default function FarmerBookings() {
  const { profile } = useAuth()
  const { useFarmerBookings, acceptReschedule, declineReschedule, cancelBooking, markArrived } = useData()
  const bookings = useFarmerBookings(profile?.id)

  if (bookings.length === 0) {
    return (
      <div className="container bk-page">
        <span className="eyebrow">My bookings</span>
        <h1>No bookings yet</h1>
        <p className="page-sub">Once you request a slot, it will show up here.</p>
        <Link to="/farmer" className="btn btn-primary">Find a centre</Link>
      </div>
    )
  }

  return (
    <div className="container bk-page">
      <span className="eyebrow">My bookings</span>
      <h1>Your requests</h1>
      <p className="page-sub">Live status from the centre — you'll see it the moment it changes.</p>

      <div className="bk-list">
        {bookings.map((b) => (
          <div className="card bk-card" key={b.id}>
            <div className="bk-top">
              <div>
                <strong>{b.centreName}</strong>
                <span className="bk-sub">{b.cropType} · {b.quantity} qtl</span>
              </div>
              <div className="badge-stack">
                <StatusBadge status={b.status} />
                <PaymentBadge payment={b.payment} />
              </div>
            </div>

            <StatusStepper status={b.status} />

            <div className="bk-meta">
              <div><span>Date</span><strong>{b.date}</strong></div>
              <div><span>Window</span><strong>{b.window}</strong></div>
            </div>

            {b.tokenNumber && ['accepted', 'arrived', 'processing'].includes(b.status) && (
              <>
                <LiveQueueWidget centreId={b.centreId} date={b.date} myToken={b.tokenNumber} />
                <div className="qr-row">
                  <QrToken bookingId={b.id} tokenNumber={b.tokenNumber} />
                </div>
              </>
            )}

            {b.status === 'reschedule-proposed' && b.reschedule && (
              <div className="reschedule-box">
                <p>The centre proposed a new time: <strong>{b.reschedule.date}, {b.reschedule.window}</strong>{b.reschedule.note ? ` — ${b.reschedule.note}` : ''}</p>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => declineReschedule(b)}>Decline</button>
                  <button className="btn btn-primary" onClick={() => acceptReschedule(b)}>Accept new time</button>
                </div>
              </div>
            )}

            {b.status === 'declined' && b.declineReason && <p className="notice-bad">Reason: {b.declineReason}</p>}
            {b.status === 'rejected' && b.rejectionReason && <p className="notice-bad">Not accepted: {b.rejectionReason}</p>}

            {(b.status === 'pending' || b.status === 'accepted') && (
              <div className="row-actions">
                {b.status === 'accepted' && (
                  <button className="btn btn-secondary" onClick={() => markArrived(b.id)}>I've arrived at the centre</button>
                )}
                <button className="btn btn-secondary" onClick={() => cancelBooking(b)}>Cancel request</button>
              </div>
            )}

            {b.status === 'completed' && b.processing && (
              <div className="receipt">
                <span className="eyebrow">Receipt</span>
                <div className="receipt-grid">
                  <div><span>Accepted quantity</span><strong>{b.processing.weight} qtl</strong></div>
                  <div><span>Grade</span><strong className="cap">{b.processing.grade}</strong></div>
                  <div><span>Payment</span><strong className="cap">{b.payment}</strong></div>
                </div>
                {b.paymentRef && <p className="pay-ref">Reference: {b.paymentRef}</p>}
                {b.receiptImage && <img src={b.receiptImage} alt="Weighbridge slip" className="receipt-img" />}
              </div>
            )}

            <details className="timeline-toggle">
              <summary>Activity</summary>
              <ul className="timeline">
                {(b.timeline || []).slice().reverse().map((t, i) => (
                  <li key={i}>
                    <span>{t.text}</span>
                    <time>{new Date(t.ts).toLocaleString()}</time>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>

      <style>{`
        .bk-page { padding: 36px 20px 72px; max-width: 640px; margin: 0 auto; }
        .bk-page h1 { font-size: clamp(26px, 3.5vw, 32px); margin: 8px 0 6px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); margin: 0 0 28px; font-size: 15px; }
        .bk-list { display: flex; flex-direction: column; gap: 14px; }
        .bk-card { padding: 22px; }
        .bk-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px; }
        .bk-top strong { font-size: 16px; }
        .bk-sub { display: block; font-size: 12px; color: var(--ink-soft); margin-top: 3px; }
        .badge-stack { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
        .bk-meta { display: flex; gap: 28px; margin: 16px 0; padding: 12px 14px; background: var(--paper); border-radius: 12px; }
        .bk-meta span { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); margin-bottom: 2px; }
        .bk-meta strong { font-size: 14px; }
        .qr-row { display: flex; justify-content: center; margin: 16px 0 4px; }
        .reschedule-box { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; margin: 12px 0 4px; }
        .reschedule-box p { margin: 0 0 12px; font-size: 13px; line-height: 1.5; }
        .row-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap; }
        .notice-bad { color: var(--bad); font-size: 13px; margin: 12px 0 0; padding: 10px 12px; background: rgba(181,72,47,0.08); border-radius: 10px; }
        .receipt { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); }
        .receipt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 12px 0; }
        .receipt-grid span { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-faint); margin-bottom: 2px; }
        .cap { text-transform: capitalize; }
        .pay-ref { font-size: 12px; color: var(--ink-soft); margin: 0 0 10px; }
        .receipt-img { max-width: 220px; border-radius: 10px; border: 1px solid var(--line); display: block; }
        .timeline-toggle { margin-top: 16px; }
        .timeline-toggle summary { cursor: pointer; font-size: 12px; font-weight: 600; color: var(--ink-soft); }
        .timeline { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .timeline li { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; padding: 8px 0; border-bottom: 1px solid var(--line); }
        .timeline li:last-child { border-bottom: none; }
        .timeline time { color: var(--ink-faint); white-space: nowrap; font-size: 11px; }
        @media (max-width: 480px) { .receipt-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  )
}
