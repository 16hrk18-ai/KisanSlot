// All location features here are free and keyless:
// - navigator.geolocation is a browser API, no key needed
// - Nominatim (OpenStreetMap) is a free reverse-geocoding service;
//   it asks only for a descriptive User-Agent/Referer, which the
//   browser supplies automatically. Keep request volume light
//   (this app only calls it once per address lookup).

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Could not look up that location.')
  const data = await res.json()
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export async function searchPlace(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Search failed.')
  const data = await res.json()
  return data.map((d) => ({ lat: Number(d.lat), lng: Number(d.lon), label: d.display_name }))
}

// Haversine distance in km between two lat/lng points.
export function distanceKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
