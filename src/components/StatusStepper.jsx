const STEP_ORDER = ['pending', 'accepted', 'arrived', 'processing', 'completed']
const STEP_LABELS = { pending: 'Requested', accepted: 'Accepted', arrived: 'Arrived', processing: 'In process', completed: 'Done' }

export default function StatusStepper({ status }) {
  const terminal = ['declined', 'cancelled', 'rejected', 'no-show', 'reschedule-proposed'].includes(status)
  if (terminal) return null
  const idx = Math.max(0, STEP_ORDER.indexOf(status))

  return (
    <div className="stepper">
      {STEP_ORDER.map((s, i) => (
        <div className={`step ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`} key={s}>
          <div className="step-dot">{i < idx ? '✓' : i + 1}</div>
          <span className="step-label">{STEP_LABELS[s]}</span>
          {i < STEP_ORDER.length - 1 && <div className={`step-line ${i < idx ? 'done' : ''}`} />}
        </div>
      ))}
      <style>{`
        .stepper {
          display: flex;
          align-items: flex-start;
          margin: 4px 0 8px;
          padding: 4px 0;
        }
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .step-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--paper);
          border: 2px solid var(--line);
          color: var(--ink-faint);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          z-index: 1;
          transition: all 0.2s ease;
        }
        .step.done .step-dot {
          background: var(--leaf);
          border-color: var(--leaf);
          color: var(--cream);
        }
        .step.current .step-dot {
          background: var(--white);
          border-color: var(--leaf);
          color: var(--leaf);
          box-shadow: 0 0 0 4px var(--leaf-soft);
        }
        .step-label {
          font-size: 10px;
          margin-top: 8px;
          color: var(--ink-faint);
          text-align: center;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .step.done .step-label,
        .step.current .step-label {
          color: var(--soil);
          font-weight: 600;
        }
        .step-line {
          position: absolute;
          top: 14px;
          left: calc(50% + 14px);
          right: calc(-50% + 14px);
          height: 2px;
          background: var(--line);
          z-index: 0;
        }
        .step-line.done { background: var(--leaf); }
      `}</style>
    </div>
  )
}
