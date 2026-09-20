// Notifications aren't a separate collection — they're derived from each
// booking's own activity timeline, which keeps writes (and cost) minimal
// while still giving a proper feed and unread count.
export function collectNotifications(bookings, role) {
  return bookings
    .flatMap((b) =>
      (b.timeline || []).map((t) => ({
        ts: t.ts,
        text: t.text,
        bookingId: b.id,
        who: role === 'farmer' ? b.centreName : b.farmerName,
        tone: /declined|not accepted|no-show|cancelled/i.test(t.text)
          ? 'bad'
          : /accepted|completed|credited|token is/i.test(t.text)
            ? 'ok'
            : 'pending',
      })),
    )
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
}

export function countUnread(notifications, seenAt) {
  if (!seenAt) return notifications.length
  const seenMs = new Date(seenAt).getTime()
  return notifications.filter((n) => new Date(n.ts).getTime() > seenMs).length
}
