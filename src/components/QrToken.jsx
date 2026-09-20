import { useEffect, useState } from 'react'
import { makeQrDataUrl } from '../lib/qr.js'

export default function QrToken({ bookingId, tokenNumber }) {
  const [qrUrl, setQrUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    makeQrDataUrl(bookingId).then((url) => {
      if (!cancelled) setQrUrl(url)
    })
    return () => { cancelled = true }
  }, [bookingId])

  return (
    <div className="qr-token">
      <div className="qr-box">
        {qrUrl ? <img src={qrUrl} alt={`QR code for token ${tokenNumber}`} width={140} height={140} /> : <div className="qr-placeholder" />}
      </div>
      <div className="token-big">Token {tokenNumber}</div>
      <style>{`
        .qr-token { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qr-box { background: #fff; padding: 12px; border-radius: 12px; border: 1px solid var(--line); }
        .qr-placeholder { width: 140px; height: 140px; background: var(--paper); border-radius: 6px; }
        .token-big { font-family: var(--font-mono); font-size: 26px; font-weight: 700; color: var(--soil); letter-spacing: 0.02em; }
      `}</style>
    </div>
  )
}
