import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { getCurrentPosition, reverseGeocode } from '../lib/location.js'

// Leaflet's default marker assets don't resolve correctly under Vite's
// bundler by default — point them at the bundled files explicitly.
const markerIconDef = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const DEFAULT_CENTER = { lat: 11.0168, lng: 76.9558 } // Coimbatore, as a sensible default

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function Recenter({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 15)
  }, [position, map])
  return null
}

export default function LocationPicker({ value, onChange }) {
  const [position, setPosition] = useState(value || null)
  const [address, setAddress] = useState('')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  async function applyPosition(pos) {
    setPosition(pos)
    setError('')
    try {
      const addr = await reverseGeocode(pos.lat, pos.lng)
      setAddress(addr)
      onChange({ ...pos, address: addr })
    } catch {
      onChange({ ...pos, address: '' })
    }
  }

  async function useMyLocation() {
    setLocating(true)
    setError('')
    try {
      const pos = await getCurrentPosition()
      await applyPosition(pos)
    } catch {
      setError('Could not get your location. You can also click on the map to place the pin.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="loc-picker">
      <div className="loc-actions">
        <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={locating}>
          {locating ? 'Locating…' : '📍 Use my current location'}
        </button>
        <span className="loc-hint">or click anywhere on the map to place the pin</span>
      </div>

      <div className="map-box">
        <MapContainer center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={12} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={applyPosition} />
          {position && <Marker position={[position.lat, position.lng]} icon={markerIconDef} />}
          {position && <Recenter position={position} />}
        </MapContainer>
      </div>

      {error && <p className="loc-error">{error}</p>}
      {address && (
        <p className="loc-address"><strong>Pinned:</strong> {address}</p>
      )}
      {position && !address && <p className="loc-address">Pinned at {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>}

      <style>{`
        .loc-picker { display: flex; flex-direction: column; gap: 10px; }
        .loc-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .loc-hint { font-size: 12px; color: var(--ink-soft); }
        .map-box { height: 260px; border-radius: 12px; overflow: hidden; border: 1.5px solid var(--line); }
        .loc-error { font-size: 12px; color: var(--bad); margin: 0; }
        .loc-address { font-size: 13px; color: var(--soil-light); margin: 0; background: var(--paper); padding: 10px 12px; border-radius: 8px; }
      `}</style>
    </div>
  )
}
