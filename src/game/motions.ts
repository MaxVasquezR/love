import type { StationId } from '../core/types'
import { CALF_L, HIP_Y, THIGH_L } from './body/buildBody'

/** Mop swing speed (rad/s), shared by the mopping pose and the mop prop so hands and handle move together. */
export const MOP_SWING = 2.2

/** What the athlete holds during the lift. */
export type Prop = 'none' | 'handsBar' | 'latBar' | 'backBar' | 'frontBar' | 'hipBar' | 'db2' | 'goblet'

/**
 * Target joint angles (radians). Conventions:
 * thigh X < 0 = hip flexion, calf X > 0 = knee flexion, arm X < 0 = raise forward,
 * arm Z = abduction (sign per side), fore X < 0 = elbow flexion, lean > 0 = torso forward.
 * `pelvis` tilts the whole body (−π/2 = lying face up). `hipY` is relative to standing hip height.
 */
export interface Joints {
  hipY: number
  hipZ: number
  pelvis: number
  lean: number
  sway: number
  headX: number
  headY: number
  lArmX: number
  rArmX: number
  lArmZ: number
  rArmZ: number
  lForeX: number
  rForeX: number
  lForeZ: number
  rForeZ: number
  lThighX: number
  rThighX: number
  lCalfX: number
  rCalfX: number
  /** Planted ankle targets in rig space (z forward, y up); legs are solved with IK when set. */
  feetL: [number, number] | null
  feetR: [number, number] | null
  /** World pitch of the soles (0 = flat on the floor). */
  footPitch: number
  prop: Prop
}

export type MotionId =
  | 'bench'
  | 'incline'
  | 'dbBench'
  | 'fly'
  | 'ohp'
  | 'dip'
  | 'pullup'
  | 'pulldown'
  | 'row'
  | 'dbRow'
  | 'deadlift'
  | 'rdl'
  | 'squat'
  | 'frontSquat'
  | 'goblet'
  | 'lunge'
  | 'hipThrust'
  | 'legPress'

const EXERCISE_MOTION: Record<string, MotionId> = {
  'bench-bar': 'bench',
  'bench-db': 'dbBench',
  incline: 'incline',
  ohp: 'ohp',
  dips: 'dip',
  fly: 'fly',
  'bar-row': 'row',
  'lat-pulldown': 'pulldown',
  'db-row': 'dbRow',
  pullup: 'pullup',
  rdl: 'rdl',
  deadlift: 'deadlift',
  squat: 'squat',
  goblet: 'goblet',
  'leg-press': 'legPress',
  lunges: 'lunge',
  'front-squat': 'frontSquat',
  'hip-thrust': 'hipThrust',
}

const STATION_MOTION: Record<StationId, MotionId> = { push: 'ohp', pull: 'row', legs: 'frontSquat' }

export function motionFor(exerciseId: string | undefined, station: StationId | null): MotionId {
  return (exerciseId && EXERCISE_MOTION[exerciseId]) || STATION_MOTION[station ?? 'push']
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ss = (t: number) => t * t * (3 - 2 * t)

function arms(j: Joints, x: number, abd: number, fore: number, foreZ = 0) {
  j.lArmX = j.rArmX = x
  j.lArmZ = -abd
  j.rArmZ = abd
  j.lForeX = j.rForeX = fore
  j.lForeZ = -foreZ
  j.rForeZ = foreZ
}

const abs = (y: number) => y - HIP_Y

/** Movements whose classic mistake is cutting the range short. */
const PARTIAL: MotionId[] = ['pullup', 'pulldown', 'dip', 'legPress', 'lunge']

/**
 * Write the pose of `m` at rep phase `p` (0 = start position, 1 = far end of the rep).
 * `bad` shows the typical mistake (flared elbows, rounded back, half reps…) for the Profe's demo.
 */
export function applyMotion(m: MotionId, p: number, j: Joints, bad = false) {
  if (bad && PARTIAL.includes(m)) p *= 0.4
  motion(m, p, j)
  if (bad) applyFault(m, p, j)
}

function applyFault(m: MotionId, p: number, j: Joints) {
  switch (m) {
    case 'bench':
    case 'incline':
    case 'dbBench':
    case 'ohp':
      // Elbows flared to 90°: shoulders pay the bill.
      j.lArmZ -= 0.5 * p
      j.rArmZ += 0.5 * p
      j.headX -= 0.25
      break
    case 'fly':
      j.lForeX = j.rForeX = -1.4
      break
    case 'row':
    case 'dbRow':
    case 'deadlift':
    case 'rdl':
      // Rounded lower back and head cranked up.
      j.lean += 0.55 * Math.max(p, m === 'deadlift' ? 1 - p : p)
      j.pelvis -= 0.25 * p
      j.headX = 0.35
      break
    case 'squat':
    case 'frontSquat':
    case 'goblet':
      // Chest collapses and the heels come up.
      j.lean += 0.5 * p
      j.footPitch = 0.35 * p
      j.headX = -0.4 * p
      break
    case 'hipThrust':
      j.lean -= 0.45 * p
      j.headX = 0.4
      break
    default:
      j.headX -= 0.2
  }
}

function motion(m: MotionId, p: number, j: Joints) {
  j.headY = 0
  switch (m) {
    case 'bench':
    case 'dbBench':
    case 'fly': {
      j.pelvis = -Math.PI / 2
      j.hipY = abs(0.55)
      j.hipZ = 0.28
      j.lean = -0.04
      j.feetL = j.feetR = [0.64, 0.06]
      j.headX = 0
      if (m === 'fly') arms(j, lerp(-1.5, -0.2, p), lerp(0.12, 1.35, p), lerp(-0.2, -0.4, p))
      else arms(j, lerp(-1.5, 0.15, p), lerp(0.25, m === 'bench' ? 1.1 : 0.95, p), lerp(-0.05, -1.5, p))
      j.prop = m === 'bench' ? 'handsBar' : 'db2'
      break
    }
    case 'incline': {
      j.pelvis = -0.96
      j.hipY = abs(0.56)
      j.hipZ = 0.26
      j.lean = 0
      j.feetL = j.feetR = [0.8, 0.06]
      j.headX = 0.05
      arms(j, lerp(-1.55, 0.1, p), lerp(0.25, 1.0, p), lerp(-0.05, -1.45, p))
      j.prop = 'db2'
      break
    }
    case 'ohp': {
      arms(j, lerp(-1.0, -2.95, p), lerp(0.45, 0.2, p), lerp(-1.75, -0.1, p))
      j.lean = lerp(-0.02, -0.07, p)
      j.headX = lerp(0.05, -0.1, p)
      j.lCalfX = j.rCalfX = 0.06
      j.prop = 'handsBar'
      break
    }
    case 'dip': {
      j.hipY = abs(lerp(1.34, 1.06, p))
      j.hipZ = lerp(0, 0.05, p)
      j.lean = lerp(0.1, 0.35, p)
      arms(j, lerp(-0.1, 0.75, p), lerp(0.05, 0.12, p), lerp(0, -1.45, p))
      j.lThighX = j.rThighX = -0.25
      j.lCalfX = j.rCalfX = 1.3
      j.footPitch = 0.5
      j.headX = 0.05
      j.prop = 'none'
      break
    }
    case 'pullup': {
      j.hipY = abs(lerp(1.14, 1.52, p))
      j.lean = 0.08
      arms(j, -0.15, lerp(2.9, 1.45, p), 0, lerp(0, 1.55, p))
      j.lThighX = j.rThighX = -0.2
      j.lCalfX = j.rCalfX = 1.1
      j.footPitch = 0.6
      j.headX = lerp(0, -0.25, p)
      j.prop = 'none'
      break
    }
    case 'pulldown': {
      j.hipY = abs(0.58)
      j.hipZ = 0
      j.lean = lerp(-0.08, -0.22, p)
      j.feetL = j.feetR = [0.46, 0.06]
      arms(j, lerp(-0.25, -0.4, p), lerp(2.85, 1.35, p), 0, lerp(0, 1.6, p))
      j.headX = lerp(-0.1, 0.05, p)
      j.prop = 'latBar'
      break
    }
    case 'row':
    case 'dbRow': {
      j.hipY = abs(0.86)
      j.hipZ = -0.15
      j.pelvis = 0.55
      j.lean = 0.3
      j.feetL = j.feetR = [0.03, 0.06]
      arms(j, -0.85 + p * 0.95, 0.12, -0.15 - p * 1.05)
      j.headX = -0.6
      j.prop = m === 'row' ? 'handsBar' : 'db2'
      break
    }
    case 'deadlift': {
      const s = ss(p)
      j.hipY = abs(lerp(0.6, 0.92, Math.pow(p, 0.8)))
      j.hipZ = lerp(-0.33, 0, s)
      j.pelvis = lerp(0.75, 0, s)
      j.lean = lerp(0.35, 0, s)
      j.feetL = j.feetR = [0.03, 0.06]
      arms(j, -(j.pelvis + j.lean) + 0.02, 0.08, -0.05)
      j.headX = lerp(-0.5, 0, s)
      j.prop = 'handsBar'
      break
    }
    case 'rdl': {
      j.hipY = abs(lerp(0.92, 0.88, p))
      j.hipZ = lerp(0, -0.22, p)
      j.pelvis = lerp(0.05, 0.95, p)
      j.lean = lerp(0, 0.2, p)
      j.feetL = j.feetR = [0.03, 0.06]
      arms(j, -(j.pelvis + j.lean) + 0.03, 0.08, -0.05)
      j.headX = lerp(0, -0.5, p)
      j.prop = 'handsBar'
      break
    }
    case 'squat':
    case 'frontSquat':
    case 'goblet': {
      const dep = p * 0.95 + 0.05
      j.hipY = abs(0.92 - (m === 'goblet' ? 0.47 : 0.44) * dep)
      j.hipZ = -(m === 'squat' ? 0.28 : 0.2) * dep
      j.pelvis = (m === 'squat' ? 0.45 : 0.35) * dep
      j.lean = (m === 'squat' ? 0.3 : m === 'goblet' ? 0.05 : 0.0) * dep
      j.feetL = j.feetR = [0.04, 0.06]
      const tilt = j.pelvis + j.lean
      if (m === 'squat') {
        arms(j, 0.35, 1.3, 0, 1.9)
        j.prop = 'backBar'
      } else if (m === 'frontSquat') {
        arms(j, -1.35 - tilt, 0.12, -1.95)
        j.prop = 'frontBar'
      } else {
        arms(j, -0.75 - tilt * 0.5, -0.12, -2.1)
        j.prop = 'goblet'
      }
      j.headX = -tilt * 0.8
      break
    }
    case 'lunge': {
      j.hipY = abs(lerp(0.9, 0.58, p))
      j.hipZ = lerp(0, -0.04, p)
      j.lean = 0.04
      j.feetL = [0.42, 0.06]
      j.feetR = [-0.42, lerp(0.07, 0.12, p)]
      arms(j, 0, 0.12, -0.08)
      j.headX = 0
      j.prop = 'db2'
      break
    }
    case 'hipThrust': {
      j.pelvis = lerp(-1.12, -1.55, p)
      j.hipY = abs(lerp(0.27, 0.52, p))
      j.hipZ = lerp(0, 0.04, p)
      j.lean = 0
      j.feetL = j.feetR = [0.5, 0.06]
      arms(j, -0.35, 0.3, -0.9)
      j.headX = -0.4
      j.prop = 'hipBar'
      break
    }
    case 'legPress': {
      const dist = lerp(0.8, 0.42, p)
      j.pelvis = -0.85
      j.hipY = abs(0.48)
      j.hipZ = 0
      j.lean = 0
      const f: [number, number] = [0.06 + 0.707 * dist, 0.45 + 0.707 * dist]
      j.feetL = j.feetR = f
      j.footPitch = -2.36
      arms(j, 0.25, 0.35, -0.5)
      j.headX = 0.25
      j.prop = 'none'
      break
    }
  }
}

/**
 * Two-bone leg IK in the sagittal plane. `hip` is the hip joint in rig space (z, y),
 * `pelvis` the body tilt. Returns [thighX, calfX] relative to the pelvis, knee bending forward.
 */
export function legIK(hip: [number, number], foot: [number, number], pelvis: number): [number, number] {
  const dz = foot[0] - hip[0]
  const dy = foot[1] - hip[1]
  const L = Math.min(THIGH_L + CALF_L - 1e-3, Math.max(Math.abs(THIGH_L - CALF_L) + 1e-3, Math.hypot(dz, dy)))
  const dir = Math.atan2(dz, -dy)
  const a = Math.acos((THIGH_L * THIGH_L + L * L - CALF_L * CALF_L) / (2 * THIGH_L * L))
  const b = Math.acos((CALF_L * CALF_L + L * L - THIGH_L * THIGH_L) / (2 * CALF_L * L))
  const thighW = dir + a
  const calfW = dir - b
  return [-thighW - pelvis, thighW - calfW]
}
