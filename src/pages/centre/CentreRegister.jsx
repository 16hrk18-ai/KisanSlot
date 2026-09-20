import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { CROP_OPTIONS } from '../../context/DataContext.jsx'
import LocationPicker from '../../components/LocationPicker.jsx'

export default function CentreRegister() {
  const { user, role, registerCentre } = useAuth()
  const navigate = useNavigate()

  // Already registered → never show this form again.
  useEffect(() => {
    if (role === 'centre') navigate('/centre', { replace: true })
    else if (role === 'farmer') navigate('/farmer', { replace: true })
  }, [role, navigate])
  const [form, setForm] = useState({ centreName: '', officerName: user?.displayName || '', phone: '' })
  const [crops, setCrops] = useState([])
  const [location, setLocation] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleCrop(crop) {
    setCrops((prev) => (prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]))
  }

  function validate() {
    const e = {}
    if (!form.centreName.trim()) e.centreName = 'Enter the centre name'
    if (!form.officerName.trim()) e.officerName = 'Enter the responsible officer\'s name'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    if (crops.length === 0) e.crops = 'Select at least one crop this centre accepts'
    if (!location) e.location = 'Pin the centre\'s location on the map'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSubmitError('')
    try {
      await registerCentre({
        centreName: form.centreName,
        officerName: form.officerName,
        phone: form.phone,
        address: location.address || '',
        lat: location.lat,
        lng: location.lng,
        cropQuotas: crops,
      })
      navigate('/centre', { replace: true })
    } catch (err) {
      console.error(err)
      setSubmitError(err.message || 'Could not save centre profile. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container reg-page">
      <span className="eyebrow">Procurement centre sign-up</span>
      <h1>Set up your centre</h1>
      <p className="page-sub">Farmers nearby will see this centre and its open schedule once you're set up.</p>

      <form className="card reg-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="centreName">Centre name</label>
          <input id="centreName" value={form.centreName} onChange={(e) => update('centreName', e.target.value)} placeholder="e.g. Periyanaickenpalayam Mandi" />
          {errors.centreName && <span className="err">{errors.centreName}</span>}
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="officer">Responsible officer</label>
            <input id="officer" value={form.officerName} onChange={(e) => update('officerName', e.target.value)} />
            {errors.officerName && <span className="err">{errors.officerName}</span>}
          </div>
          <div className="field">
            <label htmlFor="phone">Centre contact number</label>
            <input id="phone" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))} />
            {errors.phone && <span className="err">{errors.phone}</span>}
          </div>
        </div>

        <div className="field">
          <label>Crops accepted here</label>
          <div className="crop-chips">
            {CROP_OPTIONS.map((c) => (
              <button type="button" key={c} className={`chip ${crops.includes(c) ? 'active' : ''}`} onClick={() => toggleCrop(c)}>
                {c}
              </button>
            ))}
          </div>
          {errors.crops && <span className="err">{errors.crops}</span>}
        </div>

        <div className="field">
          <label>Centre location</label>
          <LocationPicker value={location} onChange={setLocation} />
          {errors.location && <span className="err">{errors.location}</span>}
        </div>

        {submitError && <p className="err" style={{ marginBottom: 12 }}>{submitError}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create centre profile'}
        </button>
      </form>

      <style>{`
        .reg-page { padding: 36px 20px 72px; max-width: 640px; margin: 0 auto; }
        .reg-page h1 { font-size: clamp(24px, 3.5vw, 28px); margin: 8px 0 8px; letter-spacing: -0.02em; }
        .page-sub { color: var(--ink-soft); font-size: 14px; margin: 0 0 28px; line-height: 1.55; }
        .reg-form { padding: 28px 24px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .err { font-size: 12px; color: var(--bad); display: block; margin-top: 4px; }
        .crop-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          padding: 8px 14px; border-radius: 999px; border: 1.5px solid var(--line);
          background: #fff; font-size: 13px; font-weight: 600; color: var(--ink-soft);
          transition: all 0.15s ease; cursor: pointer;
        }
        .chip:hover { border-color: var(--line-strong); }
        .chip.active { background: var(--leaf); border-color: var(--leaf); color: var(--cream); }
        @media (max-width: 480px) { .row-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
