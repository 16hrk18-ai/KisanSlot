import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { StatusBadge, PaymentBadge } from '../../components/StatusBadge.jsx'
import { compressImageFile } from '../../lib/image.js'

const FILTERS = ['today', 'all', 'completed', 'declined', 'cancelled', 'no-show']

export default function CentreQueue() {
  const { profile } = useAuth()
  const {
    todayKey, useQueue, callNextToken, useCentreBookings,
    markArrived, startProcessing, recordProcessing, markNoShow, advancePayment,
  } = useData()

  const today = todayKey()
  const queue = useQueue(profile?.id, today)
  const bookings = useCentreBookings(profile?.id)
  const [filter, setFilter] = useState('today')

  const [processingId, setProcessingId] = useState(null)
  const [pf, setPf] = useState({ weight: '', outcome: 'pass-a', reason: '', photo: null })
  const [payingId, setPayingId] = useState(null)
  const [payRef, setPayRef] = useState('')

  const todaysQueue = bookings
    .filter((b) => b.date === today && ['accepted', 'arrived', 'processing'].includes(b.status))
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0))

  const visible =
    filter === 'today' ? todaysQueue :
    filter === 'all' ? bookings :
    bookings.filter((b) => b.status === filter)

  const stats = {
    todayCount: todaysQueue.length,
    completedToday: bookings.filter((b) => b.date === today && b.status === 'completed').length,
    paymentsPending: bookings.filter((b) => b.payment === 'pending' || b.payment === 'processing').length,
    totalQuintals: bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.processing?.weight || 0), 0),
  }

  function openProcessing(b) {
    setProcessingId(b.id)
    setPf({ weight: b.quantity, outcome: 'pass-a', reason: '', photo: null })
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImageFile(file)
    setPf((s) => ({ ...s, photo: dataUrl }))
  }

  async function submitProcessing(e) {
    e.preventDefault()
    const pass = pf.outcome !== 'fail'
    const grade = pf.outcome === 'pass-a' ? 'Grade A' : pf.outcome === 'pass-common' ? 'Common' : 'Rejected'
    await recordProcessing(processingId, {
      weight: pf.weight,
      grade,
      pass,
      rejectionReason: pf.reason,
      receiptImage: pf.photo,
    })
    setProcessingId(null)
  }

  function openPay(b) {
    setPayingId(b.id)
    setPayRef('')
  }
  async function submitPay(toStatus) {
    await advancePayment(payingId, { toStatus, reference: payRef })
    setPayingId(null)
  }

  return (
    <div className="container queue-page">
      <span className="eyebrow">Today's queue</span>
      <div className="page-head">
        <h1>Live queue &amp; farmer processing</h1>
        <Link to="/centre/display" target="_blank" className="btn btn-secondary">Open big-screen display ↗</Link>
      </div>

      <div className="now-serving card">
        <div className="ns-block">
          <span className="ns-label">Now serving</span>
          <strong className="ns-value">{queue?.nowServing || 0}</strong>
        </div>
        <button className="btn btn-primary call-next" onClick={() => callNextToken(profile.id, today)}>
          Call next token →
        </button>
        <div className="ns-block ns-right">
          <span className="ns-label">Tokens issued today</span>
          <strong className="ns-value">{queue?.lastToken || 0}</strong>
        </div>
      </div>

      <div className="stats-row">
        <div className="card stat"><span>In queue today</span><strong>{stats.todayCount}</strong></div>
        <div className="card stat"><span>Completed today</span><strong>{stats.completedToday}</strong></div>
        <div className="card stat"><span>Payments pending</span><strong>{stats.paymentsPending}</strong></div>
        <div className="card stat"><span>Total procured</span><strong>{stats.totalQuintals} qtl</strong></div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'today' ? "Today's queue" : f.replace('-', ' ')}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="empty-note">Nothing here.</p>}

      <div className="list">
        {visible.map((b) => (
          <div className="card f-card" key={b.id}>
            <div className="f-main">
              <div className="f-token">{b.tokenNumber ? <span className="token-chip">#{b.tokenNumber}</span> : null}</div>
              <div>
                <strong>{b.farmerName}</strong>
                <span className="f-sub">{b.farmerPhone} · {b.farmerVillage}</span>
              </div>
              <div className="f-figures">
                <span>{b.cropType} · {b.quantity} qtl</span>
                <span className="f-date">{b.date} · {b.window}</span>
              </div>
              <div className="badge-stack">
                <StatusBadge status={b.status} />
                <PaymentBadge payment={b.payment} />
              </div>
            </div>

            {b.status === 'accepted' && (
              <div className="row-actions">
                <button className="btn btn-secondary" onClick={() => markNoShow(b.id)}>Mark no-show</button>
                <button className="btn btn-primary" onClick={() => markArrived(b.id)}>Mark arrived</button>
              </div>
            )}

            {b.status === 'arrived' && (
              <div className="row-actions">
                <button className="btn btn-primary" onClick={() => startProcessing(b.id)}>Call to counter</button>
              </div>
            )}

            {b.status === 'processing' && processingId !== b.id && (
              <div className="row-actions">
                <button className="btn btn-primary" onClick={() => openProcessing(b)}>Record weight &amp; quality</button>
              </div>
            )}

            {processingId === b.id && (
              <form className="inline-form" onSubmit={submitProcessing}>
                <div className="mini-row">
                  <div className="field">
                    <label>Weight accepted (qtl)</label>
                    <input type="number" step="0.1" min="0" required value={pf.weight} onChange={(e) => setPf((s) => ({ ...s, weight: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Outcome</label>
                    <select value={pf.outcome} onChange={(e) => setPf((s) => ({ ...s, outcome: e.target.value }))}>
                      <option value="pass-a">Accept — Grade A</option>
                      <option value="pass-common">Accept — Common</option>
                      <option value="fail">Reject</option>
                    </select>
                  </div>
                </div>
                {pf.outcome === 'fail' && (
                  <div className="field">
                    <label>Reason for rejection</label>
                    <input required value={pf.reason} onChange={(e) => setPf((s) => ({ ...s, reason: e.target.value }))} placeholder="e.g. moisture too high" />
                  </div>
                )}
                <div className="field">
                  <label>Receipt / weighbridge slip photo (optional)</label>
                  <input type="file" accept="image/*" onChange={handlePhoto} />
                  {pf.photo && <img src={pf.photo} alt="preview" className="photo-preview" />}
                </div>
                <div className="row-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setProcessingId(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {b.status === 'completed' && b.payment !== 'paid' && payingId !== b.id && (
              <div className="row-actions">
                <button className="btn btn-primary" onClick={() => openPay(b)}>Update payment</button>
              </div>
            )}

            {payingId === b.id && (
              <div className="inline-form pay-form">
                <div className="field">
                  <label>Payment reference / UTR (optional)</label>
                  <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. UTR2024..." />
                </div>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => setPayingId(null)}>Cancel</button>
                  {b.payment === 'pending' && <button className="btn btn-secondary" onClick={() => submitPay('processing')}>Mark processing</button>}
                  <button className="btn btn-primary" onClick={() => submitPay('paid')}>Mark paid</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .queue-page { padding: 36px 20px 72px; }
        .page-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
        .page-head h1 { font-size: clamp(24px, 3vw, 30px); margin: 8px 0 0; letter-spacing: -0.02em; }

        .now-serving {
          display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
          background: linear-gradient(135deg, var(--soil) 0%, #3D3226 100%);
          margin-bottom: 18px; padding: 24px 28px; border: none;
          box-shadow: var(--shadow-lg);
        }
        .ns-block { display: flex; flex-direction: column; gap: 4px; }
        .ns-right { align-items: flex-end; text-align: right; }
        .ns-label { font-size: 11px; font-weight: 700; color: var(--wheat); text-transform: uppercase; letter-spacing: 0.08em; }
        .ns-value { font-family: var(--font-mono); font-size: 42px; color: var(--cream); letter-spacing: -0.03em; line-height: 1; }
        .call-next { white-space: nowrap; background: var(--wheat) !important; color: var(--soil) !important; box-shadow: 0 4px 14px rgba(232,185,74,0.35) !important; }
        .call-next:hover:not(:disabled) { background: #F0C85C !important; }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .stat { text-align: center; padding: 16px 12px; }
        .stat span { display: block; font-size: 11px; font-weight: 600; color: var(--ink-soft); margin-bottom: 6px; }
        .stat strong { font-family: var(--font-display); font-size: 22px; color: var(--soil); letter-spacing: -0.02em; }

        .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }

        .empty-note { color: var(--ink-soft); }
        .list { display: flex; flex-direction: column; gap: 12px; }
        .f-main { display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
        .f-sub { display: block; font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
        .f-figures { flex: 1; min-width: 140px; font-size: 13px; font-weight: 500; }
        .f-figures span { display: block; }
        .f-date { color: var(--ink-soft); font-size: 12px; margin-top: 2px; font-weight: 400; }
        .badge-stack { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
        .row-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

        .inline-form { margin-top: 12px; padding-top: 14px; border-top: 1px solid var(--line); }
        .mini-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .photo-preview { max-width: 140px; border-radius: 10px; margin-top: 8px; display: block; border: 1px solid var(--line); }

        @media (max-width: 900px) { .stats-row { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) {
          .mini-row { grid-template-columns: 1fr; }
          .now-serving { justify-content: center; text-align: center; }
          .ns-right { align-items: center; text-align: center; }
        }
      `}</style>
    </div>
  )
}
