import { useEffect, useRef, useState } from 'react'
import {
  SIDES,
  SLAM_SPEED,
  STALL_FROM,
  STALL_TO,
  TILT_WARN,
  freshLift,
  stepLift,
  type LiftEvent,
  type LiftInput,
  type LiftPhase,
  type LiftState,
  type Side,
} from '../core/liftEngine'
import type { LiftTuning } from '../core/progression'
import type { RepSignal } from '../game/Doll'
import { useGame } from '../core/store'
import { gymSfx } from '../core/gymAudio'
import { useT } from '../i18n'

type Props = {
  tuning: LiftTuning
  kg: number
  /** Changes on every new set (or second chance) to restart the bar. */
  resetKey: number
  startTank?: number
  /** First set of the session: chalk up before gripping the bar. */
  chalk: boolean
  /** Input is ignored until this `performance.now()` time (camera moves, set transitions). */
  lockRef: React.MutableRefObject<number>
  stateRef: React.MutableRefObject<LiftState>
  repRef: React.MutableRefObject<RepSignal>
  onEvent: (e: LiftEvent, s: LiftState) => void
  tutorial: boolean
  onTutorialDone: () => void
  children?: React.ReactNode
}

type Ritual = 'chalk' | 'grip' | null
type TutorialStep = 'drag' | 'lower' | 'decide' | null

/** Share of the pad height a thumb has to travel for a full rep. */
const DRAG_RANGE = 0.85
/** Both thumbs on the bar this long to unrack it. */
const GRIP_HOLD = 0.5
const KEYS: Record<string, Side> = { KeyF: 'L', KeyD: 'L', KeyJ: 'R', KeyK: 'R' }
const OTHER: Record<Side, Side> = { L: 'R', R: 'L' }

function buzz(pattern: number | number[]) {
  if (!useGame.getState().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

const idleInput = (): LiftInput => ({ L: { holding: false, target: 0, taps: 0 }, R: { holding: false, target: 0, taps: 0 } })
const sidePos = (s: LiftState, k: Side) => (k === 'L' ? s.posL : s.posR)

/** Keyboard: holding a key pushes its side (kept level with the other), releasing lowers under control. */
function keyboardInput(st: LiftState, down: Record<Side, boolean>, taps: Record<Side, number>): LiftInput {
  const out = idleInput()
  for (const k of SIDES) {
    if (down[k]) out[k] = { holding: true, target: Math.min(1, sidePos(st, OTHER[k]) + 0.05), taps: taps[k] }
    else if (st.phase === 'top') out[k] = { holding: true, target: 0.9, taps: 0 }
    else if (st.phase === 'lower') out[k] = { holding: true, target: sidePos(st, k), taps: 0 }
  }
  return out
}

/**
 * Two-thumb lifting pad: left thumb is the left hand, right thumb the right hand.
 * Drag both up together, keep the bar level, brake the weight on the way down.
 * Animated with requestAnimationFrame straight into the DOM; React only re-renders on ritual/tutorial steps.
 */
export function LiftPad({ tuning, kg, resetKey, startTank = 1, chalk, lockRef, stateRef, repRef, onEvent, tutorial, onTutorialDone, children }: Props) {
  const { t } = useT()
  const pad = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const grips = useRef<Record<Side, HTMLElement | null>>({ L: null, R: null })
  const tankFill = useRef<HTMLDivElement>(null)
  const stallBand = useRef<HTMLDivElement>(null)
  const pushTag = useRef<HTMLDivElement>(null)
  const warnTag = useRef<HTMLDivElement>(null)
  const tempo = useRef<HTMLDivElement>(null)
  const input = useRef<LiftInput>(idleInput())
  const anchors = useRef<Record<Side, { y: number; pos: number }>>({ L: { y: 0, pos: 0 }, R: { y: 0, pos: 0 } })
  const sides = useRef(new Map<number, Side>())
  const kb = useRef({ active: false, down: { L: false, R: false }, taps: { L: 0, R: 0 } })
  const onEventRef = useRef(onEvent)
  const [ritual, setRitual] = useState<Ritual>(chalk ? 'chalk' : 'grip')
  const ritualRef = useRef<Ritual>(ritual)
  const [tip, setTip] = useState<TutorialStep>(null)
  const tipRef = useRef(tip)
  const tutorialRef = useRef(tutorial)
  const labels = useRef({ level: '', brake: '', spot: '' })
  labels.current = { level: t('liftLevel'), brake: t('liftBrake'), spot: t('liftSpot') }

  useEffect(() => {
    onEventRef.current = onEvent
    tutorialRef.current = tutorial
  }, [onEvent, tutorial])

  useEffect(() => {
    stateRef.current = { ...freshLift(), tank: startTank }
    input.current = idleInput()
    sides.current.clear()
    kb.current.down = { L: false, R: false }
    const first: Ritual = chalk ? 'chalk' : 'grip'
    ritualRef.current = first
    setRitual(first)
  }, [resetKey, startTank, chalk, stateRef])

  const goRitual = (r: Ritual) => {
    ritualRef.current = r
    setRitual(r)
  }

  const chalkUp = () => {
    gymSfx.chalk()
    buzz(15)
    repRef.current = { ...repRef.current, chalk: performance.now() }
    goRitual('grip')
    onEventRef.current({ type: 'chalk' }, stateRef.current)
  }

  // Tutorial walks through the first rep, then explains when to stop.
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
    let gripHeld = 0
    let lastBuzz = 0
    let lastGrunt = 0
    let prevPhase: LiftPhase = 'bottom'
    let warnText = ''
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const locked = now < lockRef.current
      const k = kb.current
      const st0 = stateRef.current
      const raw = k.active ? keyboardInput(st0, k.down, k.taps) : input.current

      if (ritualRef.current === 'grip' && !locked) {
        gripHeld = raw.L.holding && raw.R.holding ? gripHeld + dt : 0
        if (gripHeld >= GRIP_HOLD) {
          gripHeld = 0
          ritualRef.current = null
          setRitual(null)
          buzz([15, 40, 15])
          gymSfx.unrack(kg)
          onEventRef.current({ type: 'grip' }, st0)
          if (tutorialRef.current && !tipRef.current) setTip('drag')
        }
      }
      const live = !locked && ritualRef.current === null
      const { state, events } = stepLift(st0, live ? raw : idleInput(), dt, tuning)
      for (const s of SIDES) {
        input.current[s].taps = 0
        k.taps[s] = 0
      }
      stateRef.current = state

      if (state.phase !== prevPhase) {
        if (state.phase === 'up') gymSfx.breathOut(0.35 + tuning.difficulty * 0.35)
        else if (state.phase === 'lower') gymSfx.breathIn(0.3 + state.strain * 0.5)
        else if (state.phase === 'assist') gymSfx.grunt(1)
        prevPhase = state.phase
      }
      if (state.inStall && now - lastGrunt > 750) {
        lastGrunt = now
        gymSfx.grunt(0.5 + state.strain * 0.5)
      }
      if (live && state.strain > 0.45 && now - lastBuzz > 160) {
        lastBuzz = now
        buzz(Math.round(5 + state.strain * 15))
      }

      for (const e of events) {
        if (e.type === 'lockout') {
          buzz(12)
          gymSfx.clank(kg, 0.35)
          if (tipRef.current === 'drag') setTip('lower')
        } else if (e.type === 'rep') {
          if (e.quality === 'dirty') {
            buzz(90)
            gymSfx.slam(kg)
          } else {
            buzz(e.quality === 'perfect' ? [8, 30, 8] : e.quality === 'assisted' ? 20 : 8)
            gymSfx.clank(kg, 0.22)
          }
          if (tipRef.current === 'lower') setTip('decide')
        } else if (e.type === 'miss') {
          buzz(120)
          gymSfx.slam(kg)
        } else if (e.type === 'stall') buzz([20, 40, 20])
        else if (e.type === 'tilt') buzz([10, 20, 10])
        else if (e.type === 'slam') buzz(60)
        else if (e.type === 'assist') buzz([30, 30, 30])
        onEventRef.current(e, state)
      }

      const shake = state.strain > 0.05 ? Math.sin(now / 18) * state.strain * 4 : 0
      if (bar.current) {
        bar.current.style.bottom = `${8 + state.pos * 80}%`
        bar.current.style.transform = `translate(calc(-50% + ${shake}px), 50%) rotate(${(-state.tilt * 60).toFixed(2)}deg)`
      }
      for (const s of SIDES) {
        const g = grips.current[s]
        if (g) g.dataset.on = raw[s].holding ? '1' : ''
      }
      if (tankFill.current) {
        tankFill.current.style.height = `${state.tank * 100}%`
        tankFill.current.dataset.low = state.tank < 0.3 ? '1' : ''
      }
      const showStall = tuning.stallBase > 0.12 || state.tank < 0.4
      if (stallBand.current) stallBand.current.style.opacity = showStall ? '1' : '0'
      if (pushTag.current) pushTag.current.style.opacity = state.inStall ? '1' : '0'

      const L = labels.current
      const moving = state.phase === 'up' || state.phase === 'lower'
      const next =
        state.phase === 'assist'
          ? L.spot
          : state.phase === 'lower' && (state.slammed || state.dropSpeed > SLAM_SPEED * 0.6)
            ? L.brake
            : moving && Math.abs(state.tilt) > TILT_WARN * 0.8
              ? L.level
              : ''
      if (warnTag.current && next !== warnText) {
        warnText = next
        warnTag.current.textContent = next
        warnTag.current.style.opacity = next ? '1' : '0'
        warnTag.current.dataset.kind = next === L.spot ? 'spot' : next === L.brake ? 'brake' : 'level'
      }

      if (tempo.current) {
        if (state.phase === 'lower') {
          const el = state.time - state.lowerStart
          tempo.current.style.width = `${Math.min(1, el / tuning.tempoMax) * 100}%`
          tempo.current.dataset.ok = el >= tuning.tempoMin && el <= tuning.tempoMax && !state.slammed ? '1' : ''
        } else if (state.phase === 'bottom') tempo.current.style.width = '0%'
      }
      repRef.current.live = state.pos
      repRef.current.strain = state.strain
      repRef.current.tilt = state.tilt
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const rep = repRef.current
    return () => {
      cancelAnimationFrame(raf)
      rep.live = undefined
      rep.strain = undefined
      rep.tilt = undefined
    }
  }, [kg, lockRef, repRef, stateRef, tuning])

  // Keyboard: hold F (left hand) and J (right hand).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const side = KEYS[e.code]
      if (!side) return
      e.preventDefault()
      if (e.repeat) return
      const k = kb.current
      k.active = true
      if (ritualRef.current === 'chalk') {
        if (performance.now() >= lockRef.current) chalkUp()
        return
      }
      k.down[side] = true
      k.taps[side] += 1
    }
    const up = (e: KeyboardEvent) => {
      const side = KEYS[e.code]
      if (!side) return
      e.preventDefault()
      kb.current.down[side] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
    // chalkUp only touches refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockRef])

  const height = () => pad.current?.getBoundingClientRect().height || 300
  const sideTaken = (k: Side) => [...sides.current.values()].includes(k)

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (ritualRef.current === 'chalk') {
      if (performance.now() >= lockRef.current) chalkUp()
      return
    }
    const r = pad.current?.getBoundingClientRect()
    let side: Side = r && e.clientX - r.left < r.width / 2 ? 'L' : 'R'
    if (sideTaken(side) && !sideTaken(OTHER[side])) side = OTHER[side]
    pad.current?.setPointerCapture(e.pointerId)
    sides.current.set(e.pointerId, side)
    kb.current.active = false
    const pos = sidePos(stateRef.current, side)
    anchors.current[side] = { y: e.clientY, pos }
    const inp = input.current[side]
    inp.holding = true
    inp.target = pos
    inp.taps += 1
  }

  const onMove = (e: React.PointerEvent) => {
    const side = sides.current.get(e.pointerId)
    if (!side) return
    const h = height() * DRAG_RANGE
    const a = anchors.current[side]
    let raw = a.pos + (a.y - e.clientY) / h
    // Past the ends the anchor slides, so the thumb answers right away when it turns around.
    if (raw > 1) {
      a.y = e.clientY + (1 - a.pos) * h
      raw = 1
    } else if (raw < 0) {
      a.y = e.clientY - a.pos * h
      raw = 0
    }
    input.current[side].target = raw
  }

  const onUp = (e: React.PointerEvent) => {
    const side = sides.current.get(e.pointerId)
    sides.current.delete(e.pointerId)
    if (side && !sideTaken(side)) input.current[side].holding = false
  }

  const fine = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches
  const tipText =
    ritual === 'chalk'
      ? t('liftChalk')
      : ritual === 'grip'
        ? fine
          ? t('liftKeys')
          : t('liftTutGrip')
        : tip === 'drag'
          ? t('liftTutDrag')
          : tip === 'lower'
            ? t('liftTutLower')
            : tip === 'decide'
              ? t('liftTutDecide')
              : ''

  return (
    <div
      ref={pad}
      className={`liftpad${ritual ? ` liftpad--${ritual}` : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="liftpad__half liftpad__half--L" />
      <div className="liftpad__half liftpad__half--R" />
      <div className="liftpad__rail">
        <div className="liftpad__top" />
        <div
          ref={stallBand}
          className="liftpad__stall"
          style={{ bottom: `${8 + STALL_FROM * 80}%`, height: `${(STALL_TO - STALL_FROM) * 80}%` }}
        />
        <div ref={bar} className="liftpad__bar">
          <b ref={(el) => void (grips.current.L = el)} className="liftpad__grip" />
          <i />
          <span />
          <i />
          <b ref={(el) => void (grips.current.R = el)} className="liftpad__grip" />
        </div>
      </div>
      <div className="liftpad__tank" aria-label={t('liftTank')}>
        <div ref={tankFill} className="liftpad__tank-fill" />
        <small>{t('liftTank')}</small>
      </div>
      <div ref={pushTag} className="liftpad__push">
        {t('liftPush')}
      </div>
      <div ref={warnTag} className="liftpad__warn" />
      <div className="liftpad__tempo">
        <div ref={tempo} />
      </div>
      {tipText && (
        <div className={`liftpad__tip liftpad__tip--${ritual ?? tip}`}>
          {ritual === 'chalk' ? (
            <span className="liftpad__chalk" />
          ) : (
            tip !== 'decide' && (
              <span className="liftpad__thumbs">
                <span className="liftpad__ghost" />
                <span className="liftpad__ghost" />
              </span>
            )
          )}
          <b>{tipText}</b>
        </div>
      )}
      {children}
    </div>
  )
}
