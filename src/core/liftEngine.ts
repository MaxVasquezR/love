import type { LiftTuning } from './progression'

/**
 * Drag-the-bar lifting: the thumb pushes the weight up (concentric), then lowers it under control (eccentric).
 * Strength sets how fast the bar can follow the finger and how hard the sticking point is;
 * endurance is a tank that drains with every rep and while the bar is held.
 */

export type LiftPhase = 'bottom' | 'up' | 'top' | 'lower' | 'drop'

export interface LiftState {
  /** Bar height, 0 = start position, 1 = lockout. */
  pos: number
  phase: LiftPhase
  /** Remaining energy for this set, 0..1. */
  tank: number
  time: number
  lowerStart: number
  /** Seconds since the finger left the screen during the push (lets the same thumb mash the sticking point). */
  released: number
  inStall: boolean
  /** 0..1 shake of the bar (fatigue and grinding). */
  strain: number
}

export interface LiftInput {
  holding: boolean
  /** Finger height on the pad, 0..1. */
  target: number
  /** New taps since the last step. */
  taps: number
}

export type LiftEvent =
  | { type: 'lockout' }
  | { type: 'rep'; quality: 'perfect' | 'good'; tempo: number }
  | { type: 'miss' }
  | { type: 'stall' }

export const STALL_FROM = 0.5
export const STALL_TO = 0.72
const TOP = 0.97
const BOTTOM = 0.03
const RELEASE_GRACE = 0.22
const FALL_SPEED = 2.6
const SELF_LOWER_SPEED = 1.7

export function freshLift(): LiftState {
  return { pos: 0, phase: 'bottom', tank: 1, time: 0, lowerStart: 0, released: 0, inStall: false, strain: 0 }
}

/** Cost of one rep and of holding the bar, as a share of the tank. */
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

export function stepLift(prev: LiftState, input: LiftInput, dt: number, t: LiftTuning): { state: LiftState; events: LiftEvent[] } {
  const s = { ...prev, time: prev.time + dt }
  const events: LiftEvent[] = []
  const cost = repCost(t)
  const fresh = Math.min(1, s.tank / 0.35)
  const speed = t.liftSpeed * (0.45 + 0.55 * fresh)
  const holdDrain = cost * 0.06 * dt

  switch (s.phase) {
    case 'bottom':
      s.strain = 0
      if (input.holding && input.target > s.pos + 0.03) {
        s.phase = 'up'
        s.released = 0
      }
      break

    case 'up': {
      if (!input.holding) {
        s.released += dt
        if (s.released > RELEASE_GRACE) {
          s.phase = 'drop'
          break
        }
      } else s.released = 0
      s.tank = Math.max(0, s.tank - holdDrain)
      const stall = stallStrength(s, t)
      const inBand = stall > 0.12 && s.pos >= STALL_FROM && s.pos <= STALL_TO
      if (inBand && !s.inStall) events.push({ type: 'stall' })
      s.inStall = inBand
      let v = speed * (inBand ? Math.max(0.04, 1 - stall) : 1)
      if (s.tank <= 0) v = 0
      if (input.holding && input.target > s.pos) s.pos += Math.min(input.target - s.pos, v * dt)
      else if (input.holding && input.target < s.pos - 0.05) s.pos = Math.max(input.target, s.pos - speed * dt)
      if (inBand && input.taps > 0) s.pos += input.taps * 0.045 * (1.1 - stall * 0.6)
      s.strain = Math.min(1, (inBand ? stall : 0) * 0.8 + (1 - fresh) * 0.6)
      if (s.tank <= 0 && s.pos < TOP) {
        s.phase = 'drop'
        break
      }
      if (s.pos >= TOP) {
        s.pos = 1
        s.phase = 'top'
        s.inStall = false
        s.tank = Math.max(0, s.tank - cost)
        events.push({ type: 'lockout' })
      }
      break
    }

    case 'top':
      s.strain = (1 - fresh) * 0.3
      if (!input.holding) {
        s.phase = 'lower'
        s.lowerStart = s.time
      } else if (input.target < s.pos - 0.04) {
        s.phase = 'lower'
        s.lowerStart = s.time
      }
      break

    case 'lower':
      s.tank = Math.max(0, s.tank - holdDrain * 0.5)
      s.strain = (1 - fresh) * 0.3
      if (input.holding) s.pos = Math.min(s.pos, Math.max(input.target, s.pos - FALL_SPEED * dt))
      else s.pos -= SELF_LOWER_SPEED * dt
      if (s.pos <= BOTTOM) {
        const tempo = s.time - s.lowerStart
        s.pos = 0
        s.phase = 'bottom'
        events.push({ type: 'rep', quality: tempo >= t.tempoMin && tempo <= t.tempoMax ? 'perfect' : 'good', tempo })
      }
      break

    case 'drop':
      s.inStall = false
      s.strain = 0.6
      s.pos -= FALL_SPEED * dt
      if (s.pos <= 0) {
        s.pos = 0
        s.phase = 'bottom'
        s.strain = 0
        events.push({ type: 'miss' })
      }
      break
  }
  s.pos = Math.min(1, Math.max(0, s.pos))
  return { state: s, events }
}
