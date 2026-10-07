import type { LiftTuning } from './progression'

/**
 * Two-thumb lifting: each thumb drives one side of the bar (left hand, right hand).
 * Strength sets how fast each side follows its thumb and how hard the sticking point is;
 * the weight pushes back on the way down (eccentric) and the two sides drift apart when heavy or tired.
 * Endurance is a tank that drains with every rep, while grinding and while braking the descent.
 */

export type LiftPhase = 'bottom' | 'up' | 'top' | 'lower' | 'assist' | 'drop'
export type Side = 'L' | 'R'
export type MissReason = 'tilt' | 'drop' | 'tank'
export type LiftQuality = 'perfect' | 'good' | 'dirty' | 'assisted'

export interface LiftState {
  /** Bar height (average of both sides), 0 = start position, 1 = lockout. */
  pos: number
  posL: number
  posR: number
  /** posL - posR: positive when the left side is higher. */
  tilt: number
  phase: LiftPhase
  /** Remaining energy for this set, 0..1. */
  tank: number
  time: number
  lowerStart: number
  /** Seconds since each thumb left the screen (lets a thumb lift off to mash the sticking point). */
  relL: number
  relR: number
  inStall: boolean
  /** Time stuck in the sticking point; taps buy time back. */
  stallTime: number
  /** 0..1 shake of the bar (fatigue, grinding, braking). */
  strain: number
  /** Current strength difference between arms (share of speed), random walk. */
  drift: number
  maxTilt: number
  tiltWarned: boolean
  slammed: boolean
  assisted: boolean
  assistsLeft: number
  /** How fast the bar is coming down (share of the range per second). */
  dropSpeed: number
  missReason: MissReason
}

export interface SideInput {
  holding: boolean
  /** Thumb height on the pad, 0..1. */
  target: number
  /** New taps since the last step. */
  taps: number
}

export type LiftInput = Record<Side, SideInput>

export type LiftEvent =
  | { type: 'lockout' }
  | { type: 'rep'; quality: LiftQuality; tempo: number }
  | { type: 'miss'; reason: MissReason }
  | { type: 'stall' }
  | { type: 'tilt' }
  | { type: 'slam' }
  | { type: 'assist' }
  | { type: 'chalk' }
  | { type: 'grip' }

export const SIDES: Side[] = ['L', 'R']
export const STALL_FROM = 0.5
export const STALL_TO = 0.72
/** Tilt that triggers the "level it" warning, and the one that dumps the bar. */
export const TILT_WARN = 0.1
export const TILT_FAIL = 0.22
/** Max tilt during the rep that still allows a perfect rep. */
export const PERFECT_TILT = 0.08
/** Descent speed (range per second) that counts as letting the weight fall. */
export const SLAM_SPEED = 2
const TOP = 0.97
const BOTTOM = 0.03
const RELEASE_GRACE = 0.22
const FALL_SPEED = 2.6
/** A side without its thumb sags this fast. */
const SIDE_FALL = 1.4
/** Fastest a thumb can drag the weight down. */
const FINGER_MAX = 3
/** Below this height letting go is just setting the weight down. */
const SLAM_SAFE = 0.15
const TAP_PUSH = 0.08
const ASSIST_SPEED = 0.38
/** Stuck this long in the sticking point and the Profe steps in. */
const SPOT_AFTER = 1.5
const LOCKOUT_SHARE = 0.95
const ECC_DRAIN = 0.08
const ECC_PUSH_DRAIN = 0.35

export function freshLift(): LiftState {
  return {
    pos: 0,
    posL: 0,
    posR: 0,
    tilt: 0,
    phase: 'bottom',
    tank: 1,
    time: 0,
    lowerStart: 0,
    relL: 9,
    relR: 9,
    inStall: false,
    stallTime: 0,
    strain: 0,
    drift: 0,
    maxTilt: 0,
    tiltWarned: false,
    slammed: false,
    assisted: false,
    assistsLeft: 1,
    dropSpeed: 0,
    missReason: 'drop',
  }
}

/** Cost of one rep, as a share of the tank. */
export function repCost(t: LiftTuning) {
  return 1 / t.repsInTank
}

/** Reps left before failure (what RIR measures). */
export function repsLeft(s: LiftState, t: LiftTuning) {
  return s.tank * t.repsInTank
}

function stallStrength(s: LiftState, t: LiftTuning) {
  const tired = Math.max(0, 0.4 - s.tank) * 2.5
  return Math.min(0.97, t.stallBase + tired)
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const getSide = (s: LiftState, k: Side) => (k === 'L' ? s.posL : s.posR)
function setSide(s: LiftState, k: Side, v: number) {
  if (k === 'L') s.posL = clamp(v, 0, 1)
  else s.posR = clamp(v, 0, 1)
}
function settle(s: LiftState) {
  s.pos = (s.posL + s.posR) / 2
  s.tilt = s.posL - s.posR
}

export function stepLift(prev: LiftState, input: LiftInput, dt: number, t: LiftTuning): { state: LiftState; events: LiftEvent[] } {
  const s: LiftState = { ...prev, time: prev.time + dt }
  const events: LiftEvent[] = []
  const cost = repCost(t)
  const fresh = Math.min(1, s.tank / 0.35)
  const speed = t.liftSpeed * (0.45 + 0.55 * fresh)
  const holdDrain = cost * 0.06 * dt
  const wob = t.wobble * (0.6 + 0.8 * (1 - fresh))
  s.relL = input.L.holding ? 0 : s.relL + dt
  s.relR = input.R.holding ? 0 : s.relR + dt
  const grip: Record<Side, boolean> = { L: s.relL <= RELEASE_GRACE, R: s.relR <= RELEASE_GRACE }
  const drop = (reason: MissReason) => {
    s.phase = 'drop'
    s.missReason = reason
    s.inStall = false
  }
  const lockout = () => {
    s.posL = s.posR = s.pos = 1
    s.tilt = 0
    s.phase = 'top'
    s.inStall = false
    s.stallTime = 0
    events.push({ type: 'lockout' })
  }

  switch (s.phase) {
    case 'bottom':
      s.strain = 0
      s.posL = s.posR = s.pos = s.tilt = 0
      if (SIDES.some((k) => input[k].holding && input[k].target > 0.03)) {
        s.phase = 'up'
        s.maxTilt = 0
        s.tiltWarned = false
        s.slammed = false
        s.assisted = false
        s.stallTime = 0
        s.drift = (Math.random() * 2 - 1) * wob * 0.6
      }
      break

    case 'up': {
      if (!grip.L && !grip.R) {
        drop('drop')
        break
      }
      const stall = stallStrength(s, t)
      const inBand = stall > 0.12 && s.pos >= STALL_FROM && s.pos <= STALL_TO
      if (inBand && !s.inStall) events.push({ type: 'stall' })
      s.inStall = inBand
      s.tank = Math.max(0, s.tank - holdDrain * (inBand ? 4 : 1))
      s.drift = clamp(s.drift + (Math.random() * 2 - 1) * wob * 3 * dt - s.drift * 0.4 * dt, -wob, wob)
      const v = s.tank <= 0 ? 0 : speed * (inBand ? Math.max(0.04, 1 - stall) : 1)
      let taps = 0
      for (const k of SIDES) {
        const inp = input[k]
        let p = getSide(s, k)
        if (!grip[k]) p -= SIDE_FALL * dt
        else if (inp.holding) {
          const vs = v * (1 + (k === 'L' ? s.drift : -s.drift))
          if (inp.target > p) p += Math.min(inp.target - p, vs * dt)
          else if (inp.target < p - 0.05) p = Math.max(inp.target, p - speed * dt)
        }
        if (inBand && inp.taps > 0 && s.tank > 0) p += inp.taps * TAP_PUSH * (1.1 - stall * 0.6)
        taps += inp.taps
        setSide(s, k, p)
      }
      settle(s)
      s.stallTime = inBand ? Math.max(0, s.stallTime + dt - taps * 0.12) : 0
      const tilt = Math.abs(s.tilt)
      s.maxTilt = Math.max(s.maxTilt, tilt)
      if (tilt > TILT_WARN && !s.tiltWarned) {
        s.tiltWarned = true
        events.push({ type: 'tilt' })
      }
      s.strain = Math.min(1, (inBand ? stall : 0) * 0.8 + (1 - fresh) * 0.6 + Math.max(0, t.difficulty - 0.6) * 0.3 + tilt * 1.5)
      if (tilt > TILT_FAIL) {
        drop('tilt')
        break
      }
      if (s.posL >= TOP && s.posR >= TOP) {
        s.tank = Math.max(0, s.tank - cost * LOCKOUT_SHARE)
        lockout()
        break
      }
      if (s.tank <= 0 || s.stallTime > SPOT_AFTER) {
        if (s.assistsLeft > 0) {
          s.assistsLeft -= 1
          s.phase = 'assist'
          s.assisted = true
          s.inStall = false
          events.push({ type: 'assist' })
        } else if (s.tank <= 0 || s.stallTime > SPOT_AFTER * 2) drop('tank')
      }
      break
    }

    case 'assist': {
      s.strain = 0.9
      const level = 1 - Math.min(1, dt * 4)
      const pos = Math.min(1, s.pos + ASSIST_SPEED * dt)
      const tilt = s.tilt * level
      s.posL = clamp(pos + tilt / 2, 0, 1)
      s.posR = clamp(pos - tilt / 2, 0, 1)
      settle(s)
      if (s.pos >= TOP) lockout()
      break
    }

    case 'top':
      s.strain = (1 - fresh) * 0.3 + Math.max(0, t.difficulty - 0.6) * 0.2
      s.tank = Math.max(0, s.tank - holdDrain * 0.5)
      if (SIDES.some((k) => !grip[k] || (input[k].holding && input[k].target < 0.94))) {
        s.phase = 'lower'
        s.lowerStart = s.time
        s.dropSpeed = 0
      }
      break

    case 'lower': {
      const slam = () => {
        s.slammed = true
        events.push({ type: 'slam' })
      }
      if (!s.slammed && SIDES.some((k) => !grip[k] && getSide(s, k) > SLAM_SAFE)) slam()
      let push = 0
      if (!s.slammed) {
        const creep = t.eccCreep * (1 + (1 - fresh) * 0.5)
        let fastest = 0
        for (const k of SIDES) {
          const inp = input[k]
          const p = getSide(s, k)
          const pk = inp.holding ? clamp((inp.target - p) / 0.25, 0, 1) : 0
          push += pk / 2
          const own = creep * (1 - pk * 0.65) * (1 + (k === 'L' ? -s.drift : s.drift) * 0.5)
          const want = inp.holding ? Math.max(0, p - inp.target) : 0
          const down = Math.max(own * dt, Math.min(want, FINGER_MAX * dt))
          fastest = Math.max(fastest, down / dt)
          setSide(s, k, p - down)
        }
        s.dropSpeed += (fastest - s.dropSpeed) * Math.min(1, dt * 12)
        s.tank = Math.max(0, s.tank - cost * (ECC_DRAIN + push * ECC_PUSH_DRAIN * t.difficulty) * dt)
        settle(s)
        if (s.pos > SLAM_SAFE && (s.dropSpeed > SLAM_SPEED || Math.abs(s.tilt) > TILT_FAIL)) slam()
      }
      if (s.slammed) {
        s.posL = Math.max(0, s.posL - FALL_SPEED * dt)
        s.posR = Math.max(0, s.posR - FALL_SPEED * dt)
        s.dropSpeed = FALL_SPEED
        settle(s)
      }
      s.maxTilt = Math.max(s.maxTilt, Math.abs(s.tilt))
      s.strain = Math.min(1, (1 - fresh) * 0.3 + push * 0.5 * t.difficulty + Math.abs(s.tilt))
      if (s.pos <= BOTTOM) {
        const tempo = s.time - s.lowerStart
        const quality: LiftQuality = s.assisted
          ? 'assisted'
          : s.slammed
            ? 'dirty'
            : tempo >= t.tempoMin && tempo <= t.tempoMax && s.maxTilt < PERFECT_TILT
              ? 'perfect'
              : 'good'
        s.posL = s.posR = s.pos = s.tilt = 0
        s.phase = 'bottom'
        s.dropSpeed = 0
        events.push({ type: 'rep', quality, tempo })
      }
      break
    }

    case 'drop':
      s.inStall = false
      s.strain = 0.6
      s.posL = Math.max(0, s.posL - FALL_SPEED * dt)
      s.posR = Math.max(0, s.posR - FALL_SPEED * dt)
      settle(s)
      if (s.pos <= 0) {
        s.phase = 'bottom'
        s.strain = 0
        s.tilt = 0
        events.push({ type: 'miss', reason: s.missReason })
      }
      break
  }
  return { state: s, events }
}
