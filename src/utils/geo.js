// Geo helpers
export function haversine(a, b) {
  const R = 6371000
  const toRad = (x) => x * Math.PI / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat)
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function offsetLatLng(lat, lng, metersNorth, metersEast) {
  const dLat = metersNorth / 111111
  const dLng = metersEast / (111111 * Math.cos(lat * Math.PI / 180))
  return { lat: lat + dLat, lng: lng + dLng }
}

// Generate random drops around a center point
export function generateDrops(center, count = 12, radiusM = 250) {
  const drops = []
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2
    const r = 30 + Math.random() * (radiusM - 30)
    const pos = offsetLatLng(center.lat, center.lng, Math.sin(ang) * r, Math.cos(ang) * r)
    drops.push({
      id: `drop-${Date.now()}-${i}`,
      trackId: null, // assigned by caller
      lat: pos.lat,
      lng: pos.lng,
      expires: Date.now() + 30 * 60 * 1000,
      caught: false,
    })
  }
  return drops
}

export const DEFAULT_CENTER = { lat: 43.4516, lng: -80.4925 } // Kitchener, ON (user region)
