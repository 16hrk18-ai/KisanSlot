import { createContext, useContext, useEffect, useState } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc,
  query, where, runTransaction, serverTimestamp, arrayUnion, increment,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

const DataContext = createContext(null)

export const CROP_OPTIONS = ['Paddy', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Groundnut']

function nowText() {
  return new Date().toISOString()
}

function todayKey() {
  return new Date().toDateString()
}

function queueDocId(centreId, date) {
  return `${centreId}__${date.replace(/\s+/g, '-')}`
}

export function DataProvider({ children }) {
  const [centres, setCentres] = useState([])
  const [centresLoaded, setCentresLoaded] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'centres'), (snap) => {
      setCentres(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCentresLoaded(true)
    })
    return unsub
  }, [])

  // ---- Schedules ----

  function useCentreSchedules(centreId) {
    const [schedules, setSchedules] = useState([])
    useEffect(() => {
      if (!centreId) return
      const q = query(collection(db, 'schedules'), where('centreId', '==', centreId))
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (a.date + a.window).localeCompare(b.date + b.window))
        setSchedules(list)
      })
      return unsub
    }, [centreId])
    return schedules
  }

  async function createSchedule(centreId, centreName, { date, window, cropType, capacity }) {
    await addDoc(collection(db, 'schedules'), {
      centreId, centreName, date, window, cropType,
      capacity: Number(capacity),
      bookedCount: 0,
      status: 'open',
      createdAt: serverTimestamp(),
    })
  }

  async function closeSchedule(scheduleId) {
    await updateDoc(doc(db, 'schedules', scheduleId), { status: 'closed' })
  }
  async function reopenSchedule(scheduleId) {
    await updateDoc(doc(db, 'schedules', scheduleId), { status: 'open' })
  }
  async function deleteSchedule(scheduleId) {
    await deleteDoc(doc(db, 'schedules', scheduleId))
  }

  // ---- Live queue (per centre, per day) ----
  // A simple, real-time "Now Serving: Token N" counter, independent of
  // any single booking's own status — exactly like a token display at a
  // bank or hospital counter.

  function useQueue(centreId, date) {
    const [queueState, setQueueState] = useState(null)
    useEffect(() => {
      if (!centreId || !date) return
      const ref = doc(db, 'queues', queueDocId(centreId, date))
      const unsub = onSnapshot(ref, (snap) => {
        setQueueState(snap.exists() ? snap.data() : { centreId, date, lastToken: 0, nowServing: 0 })
      })
      return unsub
    }, [centreId, date])
    return queueState
  }

  async function callNextToken(centreId, date) {
    const ref = doc(db, 'queues', queueDocId(centreId, date))
    // Read-modify-write so centreId is always present for security rules
    // whether this is the first write of the day or a later update.
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const cur = snap.exists() ? snap.data() : { lastToken: 0, nowServing: 0 }
      tx.set(ref, {
        centreId,
        date,
        lastToken: cur.lastToken || 0,
        nowServing: (cur.nowServing || 0) + 1,
      })
    })
  }

  // ---- Bookings ----

  function useFarmerBookings(farmerId) {
    const [bookings, setBookings] = useState([])
    useEffect(() => {
      if (!farmerId) return
      const q = query(collection(db, 'bookings'), where('farmerId', '==', farmerId))
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
        setBookings(list)
      })
      return unsub
    }, [farmerId])
    return bookings
  }

  function useCentreBookings(centreId) {
    const [bookings, setBookings] = useState([])
    useEffect(() => {
      if (!centreId) return
      const q = query(collection(db, 'bookings'), where('centreId', '==', centreId))
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
        setBookings(list)
      })
      return unsub
    }, [centreId])
    return bookings
  }

  async function createBooking({ schedule, farmer, quantity }) {
    const scheduleRef = doc(db, 'schedules', schedule.id)
    const bookingRef = doc(collection(db, 'bookings'))

    await runTransaction(db, async (tx) => {
      const scheduleSnap = await tx.get(scheduleRef)
      if (!scheduleSnap.exists()) throw new Error('This schedule no longer exists.')
      const s = scheduleSnap.data()
      if (s.status !== 'open') throw new Error('This slot is no longer open.')
      if (s.bookedCount >= s.capacity) throw new Error('This slot just filled up.')

      tx.update(scheduleRef, { bookedCount: s.bookedCount + 1 })
      tx.set(bookingRef, {
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmerPhone: farmer.phone,
        farmerVillage: farmer.village,
        centreId: schedule.centreId,
        centreName: schedule.centreName,
        scheduleId: schedule.id,
        date: schedule.date,
        window: schedule.window,
        cropType: schedule.cropType,
        quantity: Number(quantity),
        status: 'pending',
        tokenNumber: null,
        reschedule: null,
        payment: 'not-applicable',
        paymentRef: null,
        processing: null,
        rejectionReason: null,
        receiptImage: null,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        timeline: [{ ts: nowText(), text: `Slot requested for ${schedule.date}, ${schedule.window}.` }],
      })
    })
  }

  async function releaseSeat(scheduleId) {
    if (!scheduleId) return
    try {
      await updateDoc(doc(db, 'schedules', scheduleId), { bookedCount: increment(-1) })
    } catch {
      // Schedule may already be gone — nothing to release.
    }
  }

  // Approving assigns the next queue token for that centre+date, issued
  // atomically so two simultaneous approvals never collide on a number.
  // All reads happen before writes (Firestore transaction requirement).
  // Queue write always includes centreId so security rules pass on create.
  async function approveBooking(booking) {
    if (!booking?.id || !booking?.centreId || !booking?.date) {
      throw new Error('Invalid booking data')
    }
    const bookingRef = doc(db, 'bookings', booking.id)
    const queueRef = doc(db, 'queues', queueDocId(booking.centreId, booking.date))

    await runTransaction(db, async (tx) => {
      // Reads first
      const bookingSnap = await tx.get(bookingRef)
      const queueSnap = await tx.get(queueRef)

      if (!bookingSnap.exists()) {
        throw new Error('This booking no longer exists.')
      }
      const b = bookingSnap.data()
      if (b.status !== 'pending') {
        throw new Error('This booking is no longer pending.')
      }

      const current = queueSnap.exists()
        ? queueSnap.data()
        : { centreId: booking.centreId, date: booking.date, lastToken: 0, nowServing: 0 }
      const nextToken = (current.lastToken || 0) + 1

      // Writes — full fields so create rules see centreId == auth.uid
      tx.set(queueRef, {
        centreId: booking.centreId,
        date: booking.date,
        lastToken: nextToken,
        nowServing: current.nowServing || 0,
      })
      tx.update(bookingRef, {
        status: 'accepted',
        tokenNumber: nextToken,
        timeline: arrayUnion({
          ts: nowText(),
          text: `Centre accepted your request. Your token is ${nextToken}.`,
        }),
      })
    })
  }

  async function declineBooking(booking, reason) {
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'declined',
      declineReason: reason,
      timeline: arrayUnion({ ts: nowText(), text: `Centre declined this request: ${reason}` }),
    })
    await releaseSeat(booking.scheduleId)
  }

  async function proposeReschedule(booking, { date, window, note }) {
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'reschedule-proposed',
      reschedule: { date, window, note: note || '' },
      timeline: arrayUnion({ ts: nowText(), text: `Centre proposed a new time: ${date}, ${window}.` }),
    })
    await releaseSeat(booking.scheduleId)
  }

  async function acceptReschedule(booking) {
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'pending',
      date: booking.reschedule.date,
      window: booking.reschedule.window,
      timeline: arrayUnion({ ts: nowText(), text: 'Farmer accepted the new time. Waiting for centre to confirm.' }),
    })
  }

  async function declineReschedule(booking) {
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'cancelled',
      timeline: arrayUnion({ ts: nowText(), text: 'Farmer declined the proposed time. Request cancelled.' }),
    })
  }

  async function cancelBooking(booking) {
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'cancelled',
      timeline: arrayUnion({ ts: nowText(), text: 'Cancelled by farmer.' }),
    })
    if (booking.status === 'pending' || booking.status === 'accepted') {
      await releaseSeat(booking.scheduleId)
    }
  }

  async function markArrived(id) {
    await updateDoc(doc(db, 'bookings', id), {
      status: 'arrived',
      timeline: arrayUnion({ ts: nowText(), text: 'Checked in at the centre.' }),
    })
  }

  async function startProcessing(id) {
    await updateDoc(doc(db, 'bookings', id), {
      status: 'processing',
      timeline: arrayUnion({ ts: nowText(), text: 'Called to the counter — weighing and quality check in progress.' }),
    })
  }

  async function recordProcessing(id, { weight, grade, pass, rejectionReason, receiptImage }) {
    const ref = doc(db, 'bookings', id)
    if (!pass) {
      await updateDoc(ref, {
        status: 'rejected',
        rejectionReason,
        processing: { weight: Number(weight), grade, checkedAt: nowText() },
        timeline: arrayUnion({ ts: nowText(), text: `Not accepted — ${rejectionReason}` }),
      })
      return
    }
    await updateDoc(ref, {
      status: 'completed',
      payment: 'pending',
      processing: { weight: Number(weight), grade, checkedAt: nowText() },
      receiptImage: receiptImage || null,
      timeline: arrayUnion({ ts: nowText(), text: `Procurement completed — ${weight} qtl accepted, grade ${grade}. Payment is now pending.` }),
    })
  }

  async function markNoShow(id) {
    await updateDoc(doc(db, 'bookings', id), {
      status: 'no-show',
      timeline: arrayUnion({ ts: nowText(), text: 'Farmer did not arrive for the scheduled slot.' }),
    })
  }

  async function advancePayment(id, { toStatus, reference }) {
    const updates = { payment: toStatus }
    let text = ''
    if (toStatus === 'processing') text = 'Payment moved to processing.'
    if (toStatus === 'paid') {
      updates.paymentRef = reference || null
      text = reference ? `Payment credited. Reference: ${reference}.` : 'Payment credited.'
    }
    await updateDoc(doc(db, 'bookings', id), {
      ...updates,
      timeline: arrayUnion({ ts: nowText(), text }),
    })
  }

  return (
    <DataContext.Provider
      value={{
        centres, centresLoaded, todayKey,
        useCentreSchedules, createSchedule, closeSchedule, reopenSchedule, deleteSchedule,
        useQueue, callNextToken,
        useFarmerBookings, useCentreBookings, createBooking,
        approveBooking, declineBooking, proposeReschedule, acceptReschedule, declineReschedule, cancelBooking,
        markArrived, startProcessing, recordProcessing, markNoShow, advancePayment,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
