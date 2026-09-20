import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Landing() {
  const { user, role, loading, signInGoogle } = useAuth()
  const navigate = useNavigate()
  const [kind, setKind] = useState('farmer') // 'farmer' | 'centre'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (user && role === 'farmer') navigate('/farmer', { replace: true })
    else if (user && role === 'centre') navigate('/centre', { replace: true })
  }, [user, role, loading, navigate])

  async function handleSignIn() {
    setBusy(true)
    setError('')
    try {
      const result = await signInGoogle()
      const existingRole = result.role

      if (existingRole === 'farmer') {
        navigate('/farmer', { replace: true })
      } else if (existingRole === 'centre') {
        navigate('/centre', { replace: true })
      } else {
        navigate(kind === 'farmer' ? '/farmer/register' : '/centre/register', { replace: true })
      }
    } catch (e) {
      console.error(e)
      setError(
        e.code === 'auth/popup-closed-by-user'
          ? 'Sign-in was closed before finishing.'
          : e.message || 'Sign-in failed. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading || (user && role)) {
    return (
      <div className="lp-shell lp-loading">
        <div className="lp-spinner" aria-hidden="true" />
        <p>{user && role ? 'Taking you in…' : 'Loading…'}</p>
        <style>{loadingStyles}</style>
      </div>
    )
  }

  const isFarmer = kind === 'farmer'

  return (
    <div className="lp-shell">
      {/* Ambient background */}
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-grid" />
      </div>

      <div className="lp-layout">
        {/* Brand / story panel */}
        <aside className="lp-brand">
          <div className="lp-brand-inner">
            <div className="lp-mark">
              <span className="lp-mark-glyph">क</span>
              <span className="lp-mark-name">KisanSlot</span>
            </div>

            <h1 className="lp-headline">
              Know your slot.
              <br />
              <em>Skip the wait.</em>
            </h1>

            <p className="lp-lede">
              A quiet bridge between farmers and procurement centres —
              open schedules, clear tokens, no guesswork at the gate.
            </p>

            <ul className="lp-points">
              <li>
                <span className="lp-point-icon" aria-hidden="true">◎</span>
                <span>Book a nearby slot in minutes</span>
              </li>
              <li>
                <span className="lp-point-icon" aria-hidden="true">◎</span>
                <span>Live queue & token updates</span>
              </li>
              <li>
                <span className="lp-point-icon" aria-hidden="true">◎</span>
                <span>One Google account — register once</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Sign-in card */}
        <main className="lp-main">
          <div className="lp-card">
            <header className="lp-card-head">
              <h2>Welcome</h2>
              <p>Sign in to continue. Choose who you are below.</p>
            </header>

            {/* Role switch */}
            <div className="lp-switch" role="tablist" aria-label="I am a">
              <button
                type="button"
                role="tab"
                aria-selected={isFarmer}
                className={`lp-switch-btn ${isFarmer ? 'is-active' : ''}`}
                onClick={() => setKind('farmer')}
                disabled={busy}
              >
                <span className="lp-switch-label">Farmer</span>
                <span className="lp-switch-hint">Book a slot</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isFarmer}
                className={`lp-switch-btn ${!isFarmer ? 'is-active' : ''}`}
                onClick={() => setKind('centre')}
                disabled={busy}
              >
                <span className="lp-switch-label">Centre</span>
                <span className="lp-switch-hint">Open schedule</span>
              </button>
              <div
                className="lp-switch-thumb"
                style={{ transform: isFarmer ? 'translateX(0)' : 'translateX(100%)' }}
                aria-hidden="true"
              />
            </div>

            <p className="lp-role-copy">
              {isFarmer
                ? 'Find nearby centres, request a time, and track your token in real time.'
                : 'Publish open slots, approve requests, and run a calm queue for the day.'}
            </p>

            <button
              type="button"
              className="lp-google"
              onClick={handleSignIn}
              disabled={busy}
            >
              <GoogleG />
              <span>{busy ? 'Signing in…' : 'Continue with Google'}</span>
            </button>

            {error && (
              <p className="lp-error" role="alert">
                {error}
              </p>
            )}

            <p className="lp-fine">
              Uses your Google account. No password to remember.
              Already registered? You’ll go straight in.
            </p>
          </div>
        </main>
      </div>

      <style>{styles}</style>
    </div>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.9c1.7-1.56 2.7-3.87 2.7-6.64z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.27c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.69A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.69V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  )
}

const loadingStyles = `
  .lp-shell.lp-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: var(--cream);
    color: var(--ink-soft);
    font-size: 14px;
  }
  .lp-spinner {
    width: 28px;
    height: 28px;
    border: 2.5px solid var(--line);
    border-top-color: var(--leaf);
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }
`

const styles = `
  .lp-shell {
    position: relative;
    min-height: calc(100vh - 58px);
    display: flex;
    align-items: stretch;
    overflow: hidden;
    background: var(--cream);
  }

  .lp-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .lp-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
  }
  .lp-orb-a {
    width: 420px;
    height: 420px;
    background: rgba(61, 107, 76, 0.28);
    top: -120px;
    left: -80px;
  }
  .lp-orb-b {
    width: 380px;
    height: 380px;
    background: rgba(232, 185, 74, 0.22);
    bottom: -100px;
    right: -60px;
  }
  .lp-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(46, 36, 24, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(46, 36, 24, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent);
  }

  .lp-layout {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    padding: 32px 24px 48px;
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 48px;
    align-items: center;
  }

  /* Brand panel */
  .lp-brand-inner {
    max-width: 440px;
  }
  .lp-mark {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
  }
  .lp-mark-glyph {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: var(--leaf);
    color: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(61, 107, 76, 0.25);
  }
  .lp-mark-name {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    color: var(--soil);
    letter-spacing: -0.02em;
  }

  .lp-headline {
    font-family: var(--font-display);
    font-size: clamp(32px, 4.2vw, 48px);
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.03em;
    color: var(--soil);
    margin: 0 0 18px;
  }
  .lp-headline em {
    font-style: italic;
    font-weight: 500;
    color: var(--leaf);
  }

  .lp-lede {
    margin: 0 0 28px;
    font-size: 16px;
    line-height: 1.65;
    color: var(--ink-soft);
    max-width: 38ch;
  }

  .lp-points {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .lp-points li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
  }
  .lp-point-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(61, 107, 76, 0.12);
    color: var(--leaf);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* Sign-in card */
  .lp-main {
    display: flex;
    justify-content: center;
  }
  .lp-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(221, 208, 176, 0.7);
    border-radius: 20px;
    padding: 32px 28px 28px;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 24px 48px -12px rgba(46, 36, 24, 0.12),
      0 8px 16px -8px rgba(46, 36, 24, 0.06);
  }

  .lp-card-head {
    margin-bottom: 24px;
  }
  .lp-card-head h2 {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0 0 6px;
    color: var(--soil);
  }
  .lp-card-head p {
    margin: 0;
    font-size: 14px;
    color: var(--ink-soft);
    line-height: 1.5;
  }

  /* Segmented switch */
  .lp-switch {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    padding: 4px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    margin-bottom: 16px;
  }
  .lp-switch-thumb {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: #fff;
    border-radius: 11px;
    box-shadow: 0 2px 8px rgba(46, 36, 24, 0.1), 0 1px 2px rgba(46, 36, 24, 0.06);
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    z-index: 0;
    pointer-events: none;
  }
  .lp-switch-btn {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 12px 8px;
    border: none;
    background: transparent;
    border-radius: 11px;
    cursor: pointer;
    font-family: var(--font-body);
    transition: color 0.2s ease;
    color: var(--ink-soft);
  }
  .lp-switch-btn.is-active {
    color: var(--soil);
  }
  .lp-switch-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .lp-switch-label {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .lp-switch-hint {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.75;
  }

  .lp-role-copy {
    margin: 0 0 22px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-soft);
    min-height: 40px;
  }

  /* Google button */
  .lp-google {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 14px 20px;
    border: none;
    border-radius: 12px;
    background: var(--soil);
    color: var(--cream);
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    cursor: pointer;
    box-shadow: 0 8px 20px -6px rgba(46, 36, 24, 0.45);
    transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  }
  .lp-google:hover:not(:disabled) {
    background: var(--soil-light);
    box-shadow: 0 10px 24px -6px rgba(46, 36, 24, 0.5);
  }
  .lp-google:active:not(:disabled) {
    transform: scale(0.985);
  }
  .lp-google:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
  .lp-google svg {
    flex-shrink: 0;
    background: #fff;
    border-radius: 4px;
    padding: 2px;
    box-sizing: content-box;
  }

  .lp-error {
    margin: 14px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(181, 72, 47, 0.08);
    border: 1px solid rgba(181, 72, 47, 0.2);
    color: var(--bad);
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
  }

  .lp-fine {
    margin: 18px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ink-soft);
    text-align: center;
  }

  @media (max-width: 860px) {
    .lp-layout {
      grid-template-columns: 1fr;
      gap: 28px;
      padding: 28px 20px 40px;
      max-width: 480px;
    }
    .lp-brand-inner {
      max-width: none;
      text-align: center;
    }
    .lp-mark {
      justify-content: center;
      margin-bottom: 24px;
    }
    .lp-lede {
      max-width: none;
      margin-left: auto;
      margin-right: auto;
    }
    .lp-points {
      align-items: center;
    }
    .lp-points li {
      justify-content: center;
    }
    .lp-headline {
      font-size: clamp(28px, 7vw, 36px);
    }
  }

  @media (max-width: 420px) {
    .lp-card {
      padding: 26px 20px 22px;
      border-radius: 16px;
    }
    .lp-switch-hint {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-switch-thumb { transition: none; }
    .lp-google { transition: none; }
  }
`
