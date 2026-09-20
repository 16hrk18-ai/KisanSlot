import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'

export default function CentreRequests() {
  const { profile } = useAuth()
  const { useCentreBookings, useCentreSchedules, approveBooking, declineBooking, proposeReschedule } = useData()
  const bookings = useCentreBookings(profile?.id)
  const schedules = useCentreSchedules(profile?.id)
  const pending = bookings.filter((b) => b.status === 'pending')

  const [decliningBooking, setDecliningBooking] = useState(null)
  const [declineReason, setDeclineReason] = useState('No open capacity for this crop right now')
  const [reschedulingBooking, setReschedulingBooking] = useState(null)
  const [reschedule, setReschedule] = useState({ scheduleId: '', note: '' })

  function openDecline(booking) {
    setDecliningBooking(booking)
    setDeclineReason('No open capacity for this crop right now')
  }
  function submitDecline() {
    declineBooking(decliningBooking, declineReason)
    setDecliningBooking(null)
  }

  function openReschedule(booking) {
    setReschedulingBooking(booking)
    setReschedule({ scheduleId: '', note: '' })
  }
  function submitReschedule(e) {
    e.preventDefault()
    const target = schedules.find((s) => s.id === reschedule.scheduleId)
    if (!target) return
    proposeReschedule(reschedulingBooking, { date: target.date, window: target.window, note: reschedule.note })
    setReschedulingBooking(null)
  }

  const openSchedules = schedules.filter((s) => s.status === 'open')

  return (
    <div className="container req-page">
      <span className="eyebrow">Requests</span>
      <h1>Pending slot requests</h1>
      <p className="page-sub">Approve, decline, or offer a different time — the farmer sees your decision immediately.</p>

      {pending.length === 0 && <p className="empty-note">No pending requests right now.</p>}

      <div className="list">
        {pending.map((b) => (
          <div className="card req-card" key={b.id}>
            <div className="req-main">
              <div>
                <strong>{b.farmerName}</strong>
                <span className="req-sub">{b.farmerPhone} · {b.farmerVillage}</span>
              </div>
              <div className="req-figures">
                <span>{b.cropType} · {b.quantity} qtl</span>
                <span className="req-date">{b.date} · {b.window}</span>
              </div>
            </div>

            {reschedulingBooking?.id === b.id ? (
              <form className="inline-form" onSubmit={submitReschedule}>
                <div className="field">
                  <label>Offer a different open slot</label>
                  <select required value={reschedule.scheduleId} onChange={(e) => setReschedule((s) => ({ ...s, scheduleId: e.target.value }))}>
                    <option value="">Choose a slot…</option>
                    {openSchedules.map((s) => (
                      <option key={s.id} value={s.id}>{s.date} · {s.window} · {s.cropType} ({s.capacity - s.bookedCount} left)</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Note to farmer (optional)</label>
                  <input value={reschedule.note} onChange={(e) => setReschedule((s) => ({ ...s, note: e.target.value }))} placeholder="e.g. today's quota for wheat is full" />
                </div>
                <div className="row-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setReschedulingBooking(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Send new time</button>
                </div>
              </form>
            ) : (
              <div className="row-actions">
                <button className="btn btn-secondary" onClick={() => openDecline(b)}>Decline</button>
                <button className="btn btn-secondary" onClick={() => openReschedule(b)}>Propose new time</button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await approveBooking(b)
                    } catch (err) {
                      alert('Could not approve: ' + (err.message || err))
                    }
                  }}
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {decliningBooking && (
        <div className="modal-overlay">
          <div className="card modal">
            <h3>Decline this request</h3>
            <div className="field">
              <label>Reason</label>
              <select value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}>
                <option>No open capacity for this crop right now</option>
                <option>Crop not accepted at this centre</option>
                <option>Quantity too large for remaining slots</option>
                <option>Centre closed on selected date</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDecliningBooking(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitDecline}>Confirm decline</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .req-page { padding: 36px 20px 72px; }
        .req-page h1 { font-size: clamp(26px, 3.5vw, 32px); margin: 8px 0 6px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); margin: 0 0 28px; font-size: 15px; max-width: 52ch; }
        .empty-note { color: var(--ink-soft); }
        .list { display: flex; flex-direction: column; gap: 12px; }
        .req-card { transition: box-shadow 0.2s ease; }
        .req-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
        .req-main strong { font-size: 16px; }
        .req-sub { display: block; font-size: 12px; color: var(--ink-soft); margin-top: 3px; }
        .req-figures { text-align: right; font-size: 13px; font-weight: 500; }
        .req-figures span { display: block; }
        .req-date { color: var(--ink-soft); font-size: 12px; margin-top: 3px; font-weight: 400; }
        .row-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
        .inline-form { margin-top: 12px; padding-top: 14px; border-top: 1px solid var(--line); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(42,33,24,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50; }
        .modal { width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
        .modal h3 { font-size: 18px; margin-bottom: 16px; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
        @media (max-width: 600px) { .req-main { flex-direction: column; } .req-figures { text-align: left; } }
      `}</style>
    </div>
  )
}
