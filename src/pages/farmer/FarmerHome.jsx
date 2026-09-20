import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../context/DataContext.jsx'
import { getCurrentPosition, distanceKm } from '../../lib/location.js'

export default function FarmerHome() {
  const { centres, centresLoaded } = useData()
  const [myLocation, setMyLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  async function findNearby() {
    setLocating(true)
    setError('')
    try {
      const pos = await getCurrentPosition()
      setMyLocation(pos)
    } catch {
      setError('Could not access your location. You can still browse all centres below.')
    } finally {
      setLocating(false)
    }
  }

  const withDistance = centres
    .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
    .map((c) => ({ ...c, distance: myLocation ? distanceKm(myLocation, c) : null }))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))

  return (
    <div className="container page home-page">
      <span className="page-eyebrow">Find a centre</span>
      <h1 className="page-title">Procurement centres</h1>
      <p className="page-sub">Enable location to sort by distance, or browse the full list.</p>

      {!myLocation && (
        <button className="btn btn-primary locate-btn" onClick={findNearby} disabled={locating}>
          {locating ? 'Locating…' : 'Show centres near me'}
        </button>
      )}
      {myLocation && (
        <p className="loc-ok">Sorted by distance from your location</p>
      )}
      {error && <p className="loc-error">{error}</p>}

      {!centresLoaded && <p className="empty-note">Loading centres…</p>}
      {centresLoaded && withDistance.length === 0 && (
        <div className="empty-state">
          <p>No centres have registered yet. Check back soon.</p>
        </div>
      )}

      <div className="centre-list">
        {withDistance.map((c) => (
          <div className="card centre-card" key={c.id}>
            <div className="centre-info">
              <div className="centre-title-row">
                <h3>{c.centreName}</h3>
                {c.distance != null && (
                  <span className="centre-dist">{c.distance.toFixed(1)} km</span>
                )}
              </div>
              <p className="centre-addr">{c.address || 'Location pinned on map'}</p>
              <div className="crop-tags">
                {(c.cropQuotas || []).map((crop) => (
                  <span key={crop} className="crop-tag">{crop}</span>
                ))}
              </div>
            </div>
            <Link to={`/farmer/centre/${c.id}`} className="btn btn-primary">
              View schedule
            </Link>
          </div>
        ))}
      </div>

      <style>{`
        .home-page .locate-btn { margin-bottom: 20px; }
        .loc-ok {
          font-size: 13px;
          font-weight: 600;
          color: var(--leaf);
          margin: 0 0 16px;
        }
        .loc-error {
          font-size: 13px;
          color: var(--pending);
          margin: 0 0 16px;
          padding: 10px 14px;
          background: rgba(201, 154, 46, 0.1);
          border-radius: 10px;
        }
        .centre-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        .centre-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .centre-title-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .centre-info h3 {
          font-size: 18px;
          margin: 0;
        }
        .centre-addr {
          color: var(--ink-soft);
          font-size: 13px;
          margin: 0 0 12px;
          max-width: 440px;
          line-height: 1.45;
        }
        .centre-dist {
          font-size: 12px;
          font-weight: 700;
          color: var(--leaf);
          background: var(--leaf-soft);
          padding: 3px 10px;
          border-radius: 999px;
        }
        .crop-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  )
}
