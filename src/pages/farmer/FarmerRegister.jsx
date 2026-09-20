import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { CROP_OPTIONS } from '../../context/DataContext.jsx'

export default function FarmerRegister() {
  const { user, role, registerFarmer } = useAuth()
  const navigate = useNavigate()

  // Already registered → never show this form again.
  useEffect(() => {
    if (role === 'farmer') navigate('/farmer', { replace: true })
    else if (role === 'centre') navigate('/centre', { replace: true })
  }, [role, navigate])
  const [form, setForm] = useState({ name: user?.displayName || '', phone: '', village: '', cropType: CROP_OPTIONS[0], typicalQuantity: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Enter your name'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    if (!form.village.trim()) e.village = 'Enter your village or town'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSubmitError('')
    try {
      await registerFarmer(form)
      navigate('/farmer', { replace: true })
    } catch (err) {
      console.error(err)
      setSubmitError(err.message || 'Could not save profile. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container reg-page">
      <span className="eyebrow">Farmer sign-up</span>
      <h1>Tell us a little about you</h1>
      <p className="page-sub">This is what procurement centres will see when you request a slot.</p>

      <form className="card reg-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          {errors.name && <span className="err">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="phone">Mobile number</label>
          <input id="phone" inputMode="numeric" maxLength={10} placeholder="9xxxxxxxxx" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))} />
          {errors.phone && <span className="err">{errors.phone}</span>}
        </div>
        <div className="field">
          <label htmlFor="village">Village / town</label>
          <input id="village" value={form.village} onChange={(e) => update('village', e.target.value)} />
          {errors.village && <span className="err">{errors.village}</span>}
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="crop">Crop you usually grow</label>
            <select id="crop" value={form.cropType} onChange={(e) => update('cropType', e.target.value)}>
              {CROP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="qty">Typical quantity (qtl, optional)</label>
            <input id="qty" type="number" min="0" value={form.typicalQuantity} onChange={(e) => update('typicalQuantity', e.target.value)} placeholder="e.g. 20" />
          </div>
        </div>

        {submitError && <p className="err" style={{ marginBottom: 12 }}>{submitError}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </form>

      <style>{`
        .reg-page { padding: 36px 20px 72px; max-width: 480px; margin: 0 auto; }
        .reg-page h1 { font-size: clamp(24px, 3.5vw, 28px); margin: 8px 0 8px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); font-size: 14px; margin: 0 0 28px; line-height: 1.55; }
        .reg-form { padding: 28px 24px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .err { font-size: 12px; color: var(--bad); }
        @media (max-width: 420px) { .row-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
