import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase.js'

const AuthContext = createContext(null)

/**
 * Real Firebase Google sign-in.
 * Farmer / centre profiles live in Firestore keyed by the Google uid.
 * Register once → every later sign-in with the same Gmail goes straight
 * to the correct home screen. Registration is never asked again.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null) // 'farmer' | 'centre' | null
  const [loading, setLoading] = useState(true)

  // Latest snapshot always available to async callers (avoids stale closures).
  const snapshotRef = useRef({ user: null, role: null, profile: null, loading: true })
  const readyWaiters = useRef([])

  function publish(next) {
    snapshotRef.current = { ...snapshotRef.current, ...next }
    // Wake anyone waiting for a settled auth state.
    if (next.loading === false) {
      const waiters = readyWaiters.current
      readyWaiters.current = []
      waiters.forEach((w) => w(snapshotRef.current))
    }
  }

  /** Resolves with the latest { user, role, profile } once loading is false. */
  function waitUntilReady() {
    if (!snapshotRef.current.loading) {
      return Promise.resolve(snapshotRef.current)
    }
    return new Promise((resolve) => {
      readyWaiters.current.push(resolve)
    })
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true)
      publish({ loading: true })

      if (fbUser) {
        setUser(fbUser)
        try {
          const [farmerSnap, centreSnap] = await Promise.all([
            getDoc(doc(db, 'farmers', fbUser.uid)),
            getDoc(doc(db, 'centres', fbUser.uid)),
          ])

          if (farmerSnap.exists()) {
            const p = { id: fbUser.uid, ...farmerSnap.data() }
            setRole('farmer')
            setProfile(p)
            publish({ user: fbUser, role: 'farmer', profile: p, loading: false })
          } else if (centreSnap.exists()) {
            const p = { id: fbUser.uid, ...centreSnap.data() }
            setRole('centre')
            setProfile(p)
            publish({ user: fbUser, role: 'centre', profile: p, loading: false })
          } else {
            setRole(null)
            setProfile(null)
            publish({ user: fbUser, role: null, profile: null, loading: false })
          }
        } catch (err) {
          console.error('Failed to load profile from Firestore:', err)
          setRole(null)
          setProfile(null)
          publish({ user: fbUser, role: null, profile: null, loading: false })
        }
      } else {
        setUser(null)
        setRole(null)
        setProfile(null)
        publish({ user: null, role: null, profile: null, loading: false })
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    // Force a wait for the listener that onAuthStateChanged will fire
    // (or may already have fired). Mark loading so waiters block if needed.
    if (!snapshotRef.current.loading && snapshotRef.current.user?.uid === result.user.uid) {
      // Listener already finished for this user.
      return { user: result.user, ...snapshotRef.current }
    }
    // Listener still running (or about to) — wait for it.
    publish({ loading: true })
    setLoading(true)
    const settled = await waitUntilReady()
    return { user: result.user, role: settled.role, profile: settled.profile }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  async function registerFarmer(fields) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'farmers', user.uid)
    const data = {
      name: fields.name.trim(),
      email: user.email || '',
      phone: fields.phone,
      village: fields.village.trim(),
      cropType: fields.cropType || '',
      typicalQuantity: fields.typicalQuantity ? Number(fields.typicalQuantity) : null,
      notifSeenAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    }
    await setDoc(ref, data, { merge: true })
    // Keep local profile free of the serverTimestamp sentinel.
    const local = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      village: data.village,
      cropType: data.cropType,
      typicalQuantity: data.typicalQuantity,
      notifSeenAt: data.notifSeenAt,
    }
    setRole('farmer')
    setProfile({ id: user.uid, ...local })
    publish({ role: 'farmer', profile: { id: user.uid, ...local }, loading: false })
  }

  async function registerCentre(fields) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'centres', user.uid)
    const data = {
      centreName: fields.centreName.trim(),
      officerName: fields.officerName.trim(),
      phone: fields.phone,
      address: fields.address || '',
      lat: fields.lat,
      lng: fields.lng,
      cropQuotas: fields.cropQuotas || [],
      email: user.email || '',
      notifSeenAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    }
    await setDoc(ref, data, { merge: true })
    const local = {
      centreName: data.centreName,
      officerName: data.officerName,
      phone: data.phone,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      cropQuotas: data.cropQuotas,
      email: data.email,
      notifSeenAt: data.notifSeenAt,
    }
    setRole('centre')
    setProfile({ id: user.uid, ...local })
    publish({ role: 'centre', profile: { id: user.uid, ...local }, loading: false })
  }

  async function markNotificationsSeen() {
    if (!user || !role) return
    const stamp = new Date().toISOString()
    const collectionName = role === 'farmer' ? 'farmers' : 'centres'
    await updateDoc(doc(db, collectionName, user.uid), { notifSeenAt: stamp })
    setProfile((p) => (p ? { ...p, notifSeenAt: stamp } : p))
  }

  return (
    <AuthContext.Provider
      value={{
        user, profile, role, loading,
        signInGoogle, signOut, registerFarmer, registerCentre,
        markNotificationsSeen, setProfile, waitUntilReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
