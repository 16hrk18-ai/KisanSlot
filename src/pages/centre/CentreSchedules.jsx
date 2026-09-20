import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'

const WINDOWS = ['7:00 – 9:00 AM', '9:00 – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 – 4:00 PM', '4:00 – 6:00 PM']

function nextDates(n) {
  const out = []
  const d = new Date()
  for (let i = 0; i <= n; i++) {
    const nd = new Date(d)
    nd.setDate(d.getDate() + i)
    out.push(nd.toDateString())
  }
  return out
}

export default function CentreSchedules() {
  const { profile } = useAuth()
  const { useCentreSchedules, createSchedule, closeSchedule, reopenSchedule, deleteSchedule } = useData()
  const schedules = useCentreSchedules(profile?.id)
  const dates = nextDates(6)
  const crops = profile?.cropQuotas || []

  const [form, setForm] = useState({ date: dates[0], window: WINDOWS[0], cropType: crops[0] || '', capacity: 15 })
  const [saving, setSaving] = useState(false)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createSchedule(profile.id, profile.centreName, form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container sched-page">
      <span className="eyebrow">Schedules</span>
      <h1>Open slots for farmers</h1>
      <p className="page-sub">Farmers can only request a slot you've opened here.</p>

      <form className="card create-form" onSubmit={handleCreate}>
        <h3>Add a new slot</h3>
        <div className="row-4">
          <div className="field">
            <label>Date</label>
            <select value={form.date} onChange={(e) => update('date', e.target.value)}>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Time window</label>
            <select value={form.window} onChange={(e) => update('window', e.target.value)}>
              {WINDOWS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Crop</label>
            <select value={form.cropType} onChange={(e) => update('cropType', e.target.value)}>
              {crops.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Capacity (farmers)</label>
            <input type="number" min="1" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving || crops.length === 0}>
          {saving ? 'Adding…' : 'Add slot'}
        </button>
        {crops.length === 0 && <p className="err">Add crops to your centre profile before opening slots.</p>}
      </form>

      <div className="list">
        {schedules.length === 0 && <p className="empty-note">No slots created yet.</p>}
        {schedules.map((s) => (
          <div className="card slot-row" key={s.id}>
            <div>
              <strong>{s.date}</strong>
              <span className="slot-sub">{s.window} · {s.cropType}</span>
            </div>
            <div className="slot-count">{s.bookedCount}/{s.capacity} booked</div>
            <span className={`badge ${s.status === 'open' ? 'badge-ok' : 'badge-bad'}`}>{s.status}</span>
            <div className="row-actions">
              {s.status === 'open' ? (
                <button className="btn btn-secondary" onClick={() => closeSchedule(s.id)}>Close</button>
              ) : (
                <button className="btn btn-secondary" onClick={() => reopenSchedule(s.id)}>Reopen</button>
              )}
              {s.bookedCount === 0 && (
                <button className="btn btn-secondary" onClick={() => deleteSchedule(s.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .sched-page { padding: 36px 20px 72px; }
        .sched-page h1 { font-size: clamp(26px, 3.5vw, 32px); margin: 8px 0 6px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); margin: 0 0 28px; font-size: 15px; }
        .create-form { margin-bottom: 28px; padding: 24px; }
        .create-form h3 { font-size: 16px; margin-bottom: 16px; }
        .row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .list { display: flex; flex-direction: column; gap: 10px; }
        .slot-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .slot-info strong { font-size: 15px; }
        .slot-meta { display: block; font-size: 12px; color: var(--ink-soft); margin-top: 3px; }
        .slot-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .err { font-size: 12px; color: var(--bad); margin-top: 10px; }
        @media (max-width: 800px) { .row-4 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .row-4 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
