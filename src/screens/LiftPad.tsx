import { useEffect, useRef, useState } from 'react'
import { STALL_FROM, STALL_TO, freshLift, stepLift, type LiftEvent, type LiftInput, type LiftState } from '../core/liftEngine'
import type { LiftTuning } from '../core/progression'
import type { RepSignal } from '../game/Doll'
import { useT } from '../i18n'

type Props = {
  tuning: LiftTuning
  /** Changes on every new set (or second chance) to restart the bar. */
  resetKey: number
  startTank?: number
  /** Input is ignored until this `performance.now()` time (camera moves, set transitions). */
  lockRef: React.MutableRefObject<number>
  stateRef: React.MutableRefObject<LiftState>
  repRef: React.MutableRefObject<RepSignal>
  onEvent: (e: LiftEvent, s: LiftState) => void
  tutorial: boolean
  onTutorialDone: () => void
  children?: React.ReactNode
}

type TutorialStep = 'drag' | 'lower' | 'decide' | null

/** Share of the pad height the finger has to travel for a full rep. */
const DRAG_RANGE = 0.85

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

/**
 * One-thumb lifting pad: drag up to push the weight, lower it slowly for a perfect rep.
 * Animated with requestAnimationFrame straight into the DOM; React only re-renders on tutorial steps.
 */
export function LiftPad({ tuning, resetKey, startTank = 1, lockRef, stateRef, repRef, onEvent, tutorial, onTutorialDone, children }: Props) {
  const { t } = useT()
  const pad = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const tankFill = useRef<HTMLDivElement>(null)
  const stallBand = useRef<HTMLDivElement>(null)
  const pushTag = useRef<HTMLDivElement>(null)
  const tempo = useRef<HTMLDivElement>(null)
  const input = useRef<LiftInput>({ holding: false, target: 0, taps: 0 })
  const anchor = useRef({ y: 0, pos: 0 })
  const pointers = useRef(new Set<number>())
  const onEventRef = useRef(onEvent)
  const [tip, setTip] = useState<TutorialStep>(tutorial ? 'drag' : null)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    stateRef.current = { ...freshLift(), tank: startTank }
    input.current = { holding: false, target: 0, taps: 0 }
    pointers.current.clear()
  }, [resetKey, startTank, stateRef])

  // Tutorial walks through the first rep, then explains when to stop.
  const tipRef = useRef(tip)
  useEffect(() => {
    tipRef.current = tip
    if (tip !== 'decide') return
    const id = window.setTimeout(() => {
      setTip(null)
      onTutorialDone()
    }, 4200)
    return () => window.clearTimeout(id)
  }, [tip, onTutorialDone])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const locked = now < lockRef.current
      const inp = locked ? { holding: false, target: 0, taps: 0 } : input.current
      const { state, events } = stepLift(stateRef.current, inp, dt, tuning)
      input.current.taps = 0
      stateRef.current = state
      for (const e of events) {
        if (e.type === 'lockout') {
          buzz(12)
          if (tipRef.current === 'drag') setTip('lower')
        } else if (e.type === 'rep') {
          buzz(e.quality === 'perfect' ? [8, 30, 8] : 8)
          if (tipRef.current === 'lower') setTip('decide')
        } else if (e.type === 'miss') buzz(80)
        else if (e.type === 'stall') buzz([20, 40, 20])
        onEventRef.current(e, state)
      }

      const shake = state.strain > 0.05 ? Math.sin(now / 18) * state.strain * 4 : 0
      if (bar.current) bar.current.style.transform = `translate(calc(-50% + ${shake}px), 50%)`
      if (bar.current) bar.current.style.bottom = `${8 + state.pos * 80}%`
      if (tankFill.current) {
        tankFill.current.style.height = `${state.tank * 100}%`
        tankFill.current.dataset.low = state.tank < 0.3 ? '1' : ''
      }
      const showStall = tuning.stallBase > 0.12 || state.tank < 0.4
      if (stallBand.current) stallBand.current.style.opacity = showStall ? '1' : '0'
      if (pushTag.current) pushTag.current.style.opacity = state.inStall ? '1' : '0'
      if (tempo.current) {
        if (state.phase === 'lower') {
          const el = state.time - state.lowerStart
          tempo.current.style.width = `${Math.min(1, el / tuning.tempoMax) * 100}%`
          tempo.current.dataset.ok = el >= tuning.tempoMin && el <= tuning.tempoMax ? '1' : ''
        } else if (state.phase === 'bottom') tempo.current.style.width = '0%'
      }
      repRef.current.live = state.pos
      repRef.current.strain = state.strain
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const rep = repRef.current
    return () => {
      cancelAnimationFrame(raf)
      rep.live = undefined
      rep.strain = undefined
    }
  }, [lockRef, repRef, stateRef, tuning])

  // Keyboard: hold Space / Enter / Arrow Up to push, release to lower.
  useEffect(() => {
    const keys = new Set(['Space', 'Enter', 'ArrowUp'])
    const down = (e: KeyboardEvent) => {
      if (!keys.has(e.code)) return
      e.preventDefault()
      if (!input.current.holding) input.current.taps += 1
      input.current.holding = true
      input.current.target = 1
    }
    const up = (e: KeyboardEvent) => {
      if (!keys.has(e.code)) return
      e.preventDefault()
      input.current.holding = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const height = () => pad.current?.getBoundingClientRect().height || 300

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    pad.current?.setPointerCapture(e.pointerId)
    pointers.current.add(e.pointerId)
    anchor.current = { y: e.clientY, pos: stateRef.current.pos }
    input.current.holding = true
    input.current.target = stateRef.current.pos
    input.current.taps += 1
  }

  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    const moved = (anchor.current.y - e.clientY) / (height() * DRAG_RANGE)
    input.current.target = Math.min(1, Math.max(0, anchor.current.pos + moved))
  }

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) input.current.holding = false
  }

  return (
    <div
      ref={pad}
      className="liftpad"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="liftpad__rail">
        <div className="liftpad__top" />
        <div
          ref={stallBand}
          className="liftpad__stall"
          style={{ bottom: `${8 + STALL_FROM * 80}%`, height: `${(STALL_TO - STALL_FROM) * 80}%` }}
        />
        <div ref={bar} className="liftpad__bar">
          <i />
          <span />
          <i />
        </div>
      </div>
      <div className="liftpad__tank" aria-label={t('liftTank')}>
        <div ref={tankFill} className="liftpad__tank-fill" />
        <small>{t('liftTank')}</small>
      </div>
      <div ref={pushTag} className="liftpad__push">
        {t('liftPush')}
      </div>
      <div className="liftpad__tempo">
        <div ref={tempo} />
      </div>
      {tip && (
        <div className={`liftpad__tip liftpad__tip--${tip}`}>
          {tip !== 'decide' && <span className="liftpad__ghost" />}
          <b>{t(tip === 'drag' ? 'liftTutDrag' : tip === 'lower' ? 'liftTutLower' : 'liftTutDecide')}</b>
        </div>
      )}
      {children}
    </div>
  )
}
