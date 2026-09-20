import QRCode from 'qrcode'

// Generates a real, scannable QR code as a data URL — fully offline,
// no network call, no API key. Encodes just the booking id; a centre
// scanning it (or typing it in) can look the booking up directly.
export async function makeQrDataUrl(text) {
  return QRCode.toDataURL(text, {
    width: 240,
    margin: 1,
    color: { dark: '#2E2418', light: '#FFFFFF' },
  })
}
