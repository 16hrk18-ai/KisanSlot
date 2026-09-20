const MAP = {
  pending: { cls: 'badge-pending', label: 'Awaiting approval' },
  accepted: { cls: 'badge-ok', label: 'Accepted' },
  'reschedule-proposed': { cls: 'badge-pending', label: 'New time proposed' },
  arrived: { cls: 'badge-pending', label: 'Checked in' },
  processing: { cls: 'badge-pending', label: 'In process' },
  completed: { cls: 'badge-ok', label: 'Completed' },
  rejected: { cls: 'badge-bad', label: 'Not accepted' },
  declined: { cls: 'badge-bad', label: 'Declined' },
  cancelled: { cls: 'badge-bad', label: 'Cancelled' },
  'no-show': { cls: 'badge-bad', label: 'No-show' },
}

export function StatusBadge({ status }) {
  const s = MAP[status] || MAP.pending
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

const PAYMENT_MAP = {
  pending: { cls: 'badge-pending', label: 'Payment pending' },
  processing: { cls: 'badge-pending', label: 'Payment processing' },
  paid: { cls: 'badge-ok', label: 'Paid' },
}

export function PaymentBadge({ payment }) {
  const p = PAYMENT_MAP[payment]
  if (!p) return null
  return <span className={`badge ${p.cls}`}>{p.label}</span>
}
