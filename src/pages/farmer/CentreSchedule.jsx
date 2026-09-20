import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../../context/DataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function CentreSchedule() {
  const { centreId } = useParams()
  const navigate = useNavigate()
  const { centres, useCentreSchedules, createBooking } = useData()
  const { profile } = useAuth()

  const centre = centres.find((c) => c.id === centreId)
  const schedules = useCentreSchedules(centreId)
  const open = schedules.filter((s) => s.status === 'open' && s.bookedCount < s.capacity)

  const [bookingId, setBookingId] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!centre) {
    return (
      <div className="container">
        <p>Centre not found. <Link to="/farmer">Back to centres</Link></p>
      </div>
    )
  }

  async function handleBook(schedule) {
    setError('')
    setSubmitting(true)
    try {
      await createBooking({ schedule, farmer: profile, quantity })
      navigate('/farmer/bookings')
    } catch (e) {
      setError(e.message || 'Could not book this slot — it may have just filled up.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container sched-page">
      <Link to="/farmer" className="back-link">← All centres</Link>
      <span className="eyebrow">{centre.centreName}</span>
      <h1>Open schedule</h1>
      <p className="page-sub">{centre.address}</p>

      {open.length === 0 && <p className="empty-note">No open slots right now. Please check back later.</p>}

      <div className="slot-list">
        {open.map((s) => {
          const seatsLeft = s.capacity - s.bookedCount
          return (
            <div className="card slot-card" key={s.id}>
              <div className="slot-info">
                <strong>{s.date}</strong>
                <span className="slot-window">{s.window} · {s.cropType}</span>
                <span className="slot-seats">{seatsLeft} of {s.capacity} spots left</span>
              </div>
              {bookingId !== s.id ? (
                <button className="btn btn-primary" onClick={() => { setBookingId(s.id); setQuantity(''); setError('') }}>
                  Request this slot
                </button>
              ) : (
                <form className="qty-form" onSubmit={(e) => { e.preventDefault(); handleBook(s) }}>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Quantity (qtl)"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Confirm'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setBookingId(null)}>Cancel</button>
                </form>
              )}
            </div>
          )
        })}
      </div>
      {error && <p className="err">{error}</p>}

      <style>{`
        .sched-page { padding: 36px 20px 72px; max-width: 640px; margin: 0 auto; }
        .sched-page h1 { font-size: clamp(26px, 3.5vw, 32px); margin: 8px 0 6px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); margin: 0 0 24px; font-size: 14px; }
        .empty-note { color: var(--ink-soft); }
        .slot-list { display: flex; flex-direction: column; gap: 12px; }
        .slot-card { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .slot-info strong { font-size: 16px; display: block; margin-bottom: 2px; }
        .slot-window { display: block; font-size: 13px; color: var(--ink-soft); margin-bottom: 4px; }
        .slot-seats { display: inline-block; font-size: 12px; font-weight: 700; color: var(--leaf); background: var(--leaf-soft); padding: 3px 10px; border-radius: 999px; }
        .qty-form { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .qty-form input {
          padding: 11px 14px; border: 1.5px solid var(--line); border-radius: 10px;
          font-size: 14px; width: 140px; font-family: var(--font-body);
        }
        .qty-form input:focus { border-color: var(--leaf); outline: none; box-shadow: 0 0 0 3px var(--leaf-soft); }
        .book-error { color: var(--bad); font-size: 13px; margin: 12px 0 0; padding: 10px 12px; background: rgba(181,72,47,0.08); border-radius: 10px; }
      `}</style>
    </div>
  )
}
