import * as THREE from 'three'
import type { CharacterLook, MuscleGroup } from '../../core/types'

/** Skeleton layout, in body units (1 = 1.8 m athlete) relative to the parent bone. */
export const HIP_Y = 0.92
export const TORSO_Y = 0.05
export const SHOULDER_Y = 0.46
export const UPPER_L = 0.3
export const FORE_L = 0.27
export const THIGH_L = 0.43
export const CALF_L = 0.42
export const HEAD_Y = 0.59

export const BONES = ['hips', 'torso', 'head', 'lArm', 'lFore', 'rArm', 'rFore', 'lThigh', 'lCalf', 'rThigh', 'rCalf'] as const
export type BoneName = (typeof BONES)[number]
const B = Object.fromEntries(BONES.map((b, i) => [b, i])) as Record<BoneName, number>

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'back',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
]
const MG = (g: MuscleGroup) => MUSCLE_GROUPS.indexOf(g) + 1

/** Body measurements in meters, driven by build and muscle (0..1). */
export function bodyDims(look: CharacterLook) {
  const m = look.muscle
  const f = look.build === 'female'
  const mm = m * (f ? 0.55 : 1)
  return {
    f,
    m,
    hipW: f ? 0.16 : 0.14,
    waist: f ? 0.107 + 0.01 * m : 0.12 + 0.015 * m,
    chestW: f ? 0.145 + 0.025 * m : 0.165 + 0.07 * m,
    chestD: f ? 0.1 : 0.105 + 0.03 * m,
    shoulderX: (f ? 0.165 : 0.19) + 0.06 * mm,
    delt: 0.05 + 0.03 * mm,
    upper: (f ? 0.037 : 0.043) + 0.016 * mm,
    bi: 0.03 + 0.03 * mm,
    tri: 0.03 + 0.024 * mm,
    fore: (f ? 0.033 : 0.039) + 0.013 * mm,
    thigh: (f ? 0.08 : 0.074) + 0.02 * mm,
    quad: 0.045 + 0.026 * mm,
    calf: 0.045 + 0.014 * mm,
    glute: (f ? 0.095 : 0.078) + 0.02 * m,
    pec: 0.06 + 0.035 * mm,
    lat: 0.05 + 0.05 * mm,
    trap: 0.04 + 0.045 * mm,
    neck: 0.043 + 0.016 * mm,
  }
}
export type Dims = ReturnType<typeof bodyDims>

/** Muscles swell a bit right after a hard set. */
function pumped(d: Dims): Dims {
  const k = 1.07
  return {
    ...d,
    delt: d.delt * k,
    upper: d.upper * k,
    bi: d.bi * 1.15,
    tri: d.tri * 1.12,
    fore: d.fore * k,
    thigh: d.thigh * 1.04,
    quad: d.quad * 1.12,
    calf: d.calf * 1.05,
    pec: d.pec * 1.12,
    lat: d.lat * 1.1,
    trap: d.trap * 1.1,
  }
}

/** Rest-pose position of every bone relative to the body root. */
export function restPositions(d: Dims): Record<BoneName, THREE.Vector3> {
  const torsoY = HIP_Y + TORSO_Y
  const sy = torsoY + SHOULDER_Y
  const lx = d.hipW * 0.6
  const hy = HIP_Y - 0.03
  return {
    hips: new THREE.Vector3(0, HIP_Y, 0),
    torso: new THREE.Vector3(0, torsoY, 0),
    head: new THREE.Vector3(0, torsoY + HEAD_Y, 0),
    lArm: new THREE.Vector3(-d.shoulderX, sy, 0),
    lFore: new THREE.Vector3(-d.shoulderX, sy - UPPER_L, 0),
    rArm: new THREE.Vector3(d.shoulderX, sy, 0),
    rFore: new THREE.Vector3(d.shoulderX, sy - UPPER_L, 0),
    lThigh: new THREE.Vector3(-lx, hy, 0),
    lCalf: new THREE.Vector3(-lx, hy - THIGH_L, 0),
    rThigh: new THREE.Vector3(lx, hy, 0),
    rCalf: new THREE.Vector3(lx, hy - THIGH_L, 0),
  }
}

export function boneInverses(d: Dims) {
  const p = restPositions(d)
  return BONES.map((b) => new THREE.Matrix4().makeTranslation(-p[b].x, -p[b].y, -p[b].z))
}

// ---------- math helpers ----------
const g = (v: number, c: number, w: number) => Math.exp(-(((v - c) / w) ** 2))
const pos = (v: number) => (v > 0 ? v : 0)
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Uniform Catmull-Rom through keys `[s, ...values]` (ascending s). */
function spline(keys: number[][]) {
  const n = keys.length
  return (s: number): number[] => {
    if (s <= keys[0][0]) return keys[0].slice(1)
    if (s >= keys[n - 1][0]) return keys[n - 1].slice(1)
    let i = 0
    while (s > keys[i + 1][0]) i++
    const p0 = keys[Math.max(0, i - 1)]
    const p1 = keys[i]
    const p2 = keys[i + 1]
    const p3 = keys[Math.min(n - 1, i + 2)]
    const t = (s - p1[0]) / (p2[0] - p1[0])
    const t2 = t * t
    const t3 = t2 * t
    const out: number[] = []
    for (let k = 1; k < p1.length; k++) {
      out.push(
        0.5 *
          (2 * p1[k] +
            (-p0[k] + p2[k]) * t +
            (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
            (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
      )
    }
    return out
  }
}

/** Ring parameters: domain [0, len] plus rounded caps of fixed ring count. */
function samples(len: number, step: number, cuts: number[], capT: number, capB: number) {
  const out: number[] = []
  const CAP = 5
  for (let k = 0; k < CAP; k++) out.push(-capT * Math.sin((Math.PI / 2) * 0.96 * (1 - k / CAP)))
  const body: number[] = []
  for (let s = 0; s < len; s += step) body.push(s)
  body.push(len)
  for (const c of cuts) if (c > 0 && c < len) body.push(c - 0.0015, c + 0.0015)
  body.sort((a, b) => a - b)
  for (const s of body) if (!out.length || s - out[out.length - 1] > 0.0008) out.push(s)
  for (let k = 1; k <= CAP; k++) out.push(len + capB * Math.sin((Math.PI / 2) * 0.96 * (k / CAP)))
  return out
}

/** Rounded-cap radius multiplier for a parameter outside [0, len]. */
function capF(s: number, len: number, capT: number, capB: number) {
  if (s < 0) return Math.sqrt(Math.max(0, 1 - (s / capT) ** 2))
  if (s > len) return Math.sqrt(Math.max(0, 1 - ((s - len) / capB) ** 2))
  return 1
}

const RAD = 22

interface Buf {
  pos: number[]
  pump: number[]
  col: number[]
  uv: number[]
  si: number[]
  sw: number[]
  mg: number[]
  idx: number[]
  /** Vertex pairs that share a position on the texture seam (their normals get averaged). */
  seams: [number, number][]
}

type RingPoint = { p: [number, number, number]; color: THREE.Color; muscle: number }
type Ring = (dims: Dims, s: number, th: number) => RingPoint

function tube(
  b: Buf,
  d: Dims,
  dp: Dims,
  ss: number[],
  ring: Ring,
  weight: (s: number) => [number, number, number],
  mirror: boolean,
  /** Length used for the V texture coordinate; 0 keeps the part on the flat corner of the vein map. */
  uvLen = 0,
) {
  const start = b.pos.length / 3
  const sx = mirror ? -1 : 1
  const cols = RAD + 1
  for (const s of ss) {
    const [ba, bb, w] = weight(s)
    const ringStart = b.pos.length / 3
    for (let k = 0; k < cols; k++) {
      const th = ((k % RAD) / RAD) * Math.PI * 2
      const r = ring(d, s, th)
      const rp = ring(dp, s, th)
      b.pos.push(r.p[0] * sx, r.p[1], r.p[2])
      b.pump.push((rp.p[0] - r.p[0]) * sx, rp.p[1] - r.p[1], rp.p[2] - r.p[2])
      b.col.push(r.color.r, r.color.g, r.color.b)
      if (uvLen) b.uv.push(k / RAD, 1 - Math.min(1, Math.max(0, s / uvLen)))
      else b.uv.push(0.01, 0.99)
      b.mg.push(r.muscle)
      b.si.push(ba, bb, 0, 0)
      b.sw.push(1 - w, w, 0, 0)
    }
    b.seams.push([ringStart, ringStart + RAD])
  }
  for (let i = 0; i < ss.length - 1; i++) {
    for (let k = 0; k < RAD; k++) {
      const a = start + i * cols + k
      const n = a + 1
      const c = a + cols
      const e = n + cols
      if (mirror) b.idx.push(a, c, n, n, c, e)
      else b.idx.push(a, n, c, n, e, c)
    }
  }
}

// ---------- body parts ----------
function palette(look: CharacterLook) {
  const c = (h: string) => new THREE.Color(h)
  return {
    skin: c(look.skin),
    top: c(look.top),
    topDark: c(look.top).multiplyScalar(0.72),
    bottom: c(look.bottom),
    bottomDark: c(look.bottom).multiplyScalar(0.7),
    socks: c(look.socks),
  }
}
type Pal = ReturnType<typeof palette>

const TORSO_TOP = 1.63
const TORSO_LEN = TORSO_TOP - 0.845

function torsoKeys(d: Dims) {
  const midW = d.chestW * 0.45 + d.waist * 1.1 * 0.55
  return [
    [TORSO_TOP - 1.63, d.neck, d.neck * 1.05, -0.01],
    [TORSO_TOP - 1.55, d.neck * 1.05, d.neck * 1.1, -0.012],
    [TORSO_TOP - 1.5, d.neck + 0.035 + d.trap * 0.8, d.neck * 1.25 + 0.01, -0.02],
    [TORSO_TOP - 1.455, d.shoulderX * 0.82, d.chestD * 0.78, -0.015],
    [TORSO_TOP - 1.39, d.chestW * 0.95, d.chestD * 0.95, -0.005],
    [TORSO_TOP - 1.3, d.chestW * 0.96, d.chestD * 0.98, 0],
    [TORSO_TOP - 1.19, midW, d.chestD * 0.5 + 0.048, 0.003],
    [TORSO_TOP - 1.08, d.waist * 1.04, (d.f ? 0.085 : 0.095) + 0.01 * d.m, 0.005],
    [TORSO_TOP - 0.99, d.hipW + 0.012, d.f ? 0.108 : 0.1, 0],
    [TORSO_TOP - 0.91, d.hipW + 0.022, d.f ? 0.112 : 0.105, -0.005],
    [TORSO_TOP - 0.855, d.hipW * 0.7, 0.085, -0.005],
  ]
}

/** Torso ellipse (rx, rz, center z) at body height `y`, for placing accessories. */
export function torsoAt(d: Dims, y: number) {
  const [rx, rz, zc] = spline(torsoKeys(d))(TORSO_TOP - y)
  return { rx, rz, zc }
}

function torsoRing(look: CharacterLook, pal: Pal): Ring {
  const ts = look.topStyle
  return (d, s, th) => {
    const sc = Math.min(TORSO_LEN, Math.max(0, s))
    const y = TORSO_TOP - s
    const yc = TORSO_TOP - sc
    const f = capF(s, TORSO_LEN, 0.02, 0.045)
    const [rx, rz, zc] = spline(torsoKeys(d))(sc)
    const x = Math.cos(th)
    const z = Math.sin(th)
    const ax = Math.abs(x)
    let b = 0
    if (d.f) {
      b += 0.046 * (0.85 + 0.3 * d.m) * g(yc, 1.335, 0.048) * (g(x, 0.42, 0.24) + g(x, -0.42, 0.24)) * pos(z) ** 1.2
    } else {
      b += d.pec * 0.4 * g(yc, 1.36, 0.055) * (g(x, 0.48, 0.3) + g(x, -0.48, 0.3)) * pos(z)
    }
    if (d.m > 0.2) {
      const z4 = pos(z) ** 4
      const rows = pos(Math.sin(((1.255 - yc) / 0.062) * Math.PI)) * g(yc, 1.14, 0.1)
      b += 0.006 * d.m * z4 * (g(x, 0.17, 0.11) + g(x, -0.17, 0.11)) * rows
      b -= 0.004 * d.m * z4 * g(x, 0, 0.05) * g(yc, 1.18, 0.1)
    }
    b += d.lat * 0.32 * g(yc, 1.27, 0.075) * ax ** 3 * (1 - pos(z))
    b += d.glute * 0.42 * g(yc, 0.915, 0.06) * (g(x, 0.45, 0.33) + g(x, -0.45, 0.33)) * pos(-z) ** 1.3
    b += d.trap * 0.25 * g(yc, 1.48, 0.04) * pos(-z)

    let color = pal.skin
    if (yc < 0.995) color = yc > 0.975 && look.bottomStyle !== 'shorts' ? pal.bottomDark : pal.bottom
    else if (ts === 'tee' && yc < 1.5 - 0.03 * pos(z)) color = pal.top
    else if (ts === 'hoodie' && yc < 1.53) color = pal.top
    else if (ts === 'tank' && yc < 1.455 - 0.05 * pos(z) ** 2) color = pal.top
    else if (ts === 'stringer' && yc < 1.4 - 0.06 * pos(z) && !(ax > 0.8 && yc > 1.15 && z < 0.4)) color = pal.top
    else if (ts === 'bra' && yc >= 1.245 && yc < 1.43 - 0.04 * pos(z)) color = yc < 1.265 ? pal.topDark : pal.top

    let muscle = 0
    if (yc < 0.99 && z < -0.1) muscle = MG('glutes')
    else if (z > 0.2 && yc > 1.28 && yc < 1.43) muscle = MG('chest')
    else if (z > 0.3 && ax < 0.65 && yc > 1.0 && yc <= 1.28) muscle = MG('abs')
    else if (z < -0.1 && yc > 1.05 && yc < 1.5) muscle = MG('back')

    return { p: [(rx + b) * x * f, y, zc + (rz + b) * z * f], color, muscle }
  }
}

function torsoWeight(s: number): [number, number, number] {
  const y = TORSO_TOP - s
  if (y > 1.55) return [B.torso, B.head, 0.7 * smooth(1.55, 1.63, y)]
  return [B.hips, B.torso, smooth(0.95, 1.03, y)]
}

const ARM_LEN = UPPER_L + FORE_L - 0.015

function armRing(look: CharacterLook, pal: Pal): Ring {
  const ts = look.topStyle
  return (d, s, th) => {
    const sc = Math.min(ARM_LEN, Math.max(0, s))
    const capT = d.delt * 0.9
    const f = capF(s, ARM_LEN, capT, 0.02)
    const [rx, rz, zc] = spline([
      [0, d.delt * 0.92, d.delt * 0.9, 0],
      [0.06, d.delt * 0.95, d.delt * 0.85, 0],
      [0.13, d.upper, d.upper * 0.98, 0],
      [0.21, d.upper * 0.95, d.upper * 0.95, 0.002],
      [0.28, d.upper * 0.78, d.upper * 0.74, 0],
      [0.31, d.upper * 0.72, d.upper * 0.7, 0],
      [0.36, d.fore * 1.05, d.fore * 0.95, 0.004],
      [0.42, d.fore, d.fore * 0.88, 0.004],
      [0.49, d.fore * 0.78, d.fore * 0.66, 0.002],
      [ARM_LEN, d.fore * 0.62, d.fore * 0.48, 0],
    ])(sc)
    const c = Math.cos(th)
    const sn = Math.sin(th)
    let b =
      d.bi * 0.55 * g(sc, 0.19, 0.055) * pos(sn) ** 2 +
      d.tri * 0.5 * g(sc, 0.13, 0.06) * pos(-sn) ** 1.5 +
      d.delt * 0.12 * g(sc, 0.03, 0.05) * pos(c) +
      d.fore * 0.25 * g(sc, 0.36, 0.045) * pos(Math.cos(th - 0.7)) ** 2

    let color = pal.skin
    if (ts === 'tee' && sc < 0.13) {
      color = pal.top
      b += 0.008
    } else if (ts === 'hoodie' && sc < 0.53) {
      color = sc > 0.5 ? pal.topDark : pal.top
      b += sc > 0.5 ? 0.008 : 0.012
    }

    let muscle = MG('forearms')
    if (sc < 0.11) muscle = MG('shoulders')
    else if (sc < 0.3) muscle = sn > 0 ? MG('biceps') : MG('triceps')

    return { p: [(rx + b) * c * f, -s, zc + (rz + b) * sn * f], color, muscle }
  }
}

function armWeight(side: -1 | 1) {
  const up = side < 0 ? B.lArm : B.rArm
  const lo = side < 0 ? B.lFore : B.rFore
  return (s: number): [number, number, number] => [up, lo, smooth(UPPER_L - 0.045, UPPER_L + 0.035, s)]
}

const LEG_LEN = 0.82

function legRing(look: CharacterLook, pal: Pal): Ring {
  const bs = look.bottomStyle
  return (d, s, th) => {
    const sc = Math.min(LEG_LEN, Math.max(0, s))
    const f = capF(s, LEG_LEN, d.thigh * 0.75, 0.025)
    const [rx, rz, zc] = spline([
      [0, d.thigh, d.thigh * 1.08, -0.005],
      [0.08, d.thigh * 1.02, d.thigh * 1.04, 0],
      [0.2, d.thigh * 0.92, d.thigh * 0.92, 0.004],
      [0.32, d.thigh * 0.74, d.thigh * 0.72, 0.004],
      [THIGH_L, d.thigh * 0.58, d.thigh * 0.6, 0.004],
      [0.49, d.calf * 0.86, d.calf * 0.88, -0.004],
      [0.56, d.calf * 0.98, d.calf, -0.012],
      [0.65, d.calf * 0.82, d.calf * 0.82, -0.006],
      [0.74, d.calf * 0.6, d.calf * 0.62, 0],
      [LEG_LEN, d.calf * 0.55, d.calf * 0.58, 0.004],
    ])(sc)
    const c = Math.cos(th)
    const sn = Math.sin(th)
    let b =
      d.quad * 0.42 * g(sc, 0.18, 0.1) * pos(sn) ** 1.3 +
      d.quad * 0.32 * g(sc, 0.35, 0.04) * pos(Math.cos(th - 2.3)) ** 2 +
      d.quad * 0.2 * g(sc, 0.2, 0.1) * pos(-sn) ** 1.5 +
      d.calf * 0.42 * g(sc, 0.55, 0.055) * pos(-sn) ** 1.4 * (g(c, 0.4, 0.5) + g(c, -0.4, 0.5))

    let color = pal.skin
    if (bs === 'shorts') {
      if (sc < 0.2) {
        color = pal.bottom
        b += 0.014 + 0.02 * (sc / 0.2)
      } else if (sc > 0.72) color = pal.socks
    } else if (bs === 'leggings') {
      if (sc < 0.8) color = pal.bottom
      b += 0.002
    } else {
      if (sc < 0.76) {
        color = pal.bottom
        b += 0.014
      } else {
        color = pal.bottomDark
        b += 0.008
      }
    }

    let muscle = 0
    if (sc < 0.42) muscle = sn > 0 ? MG('quads') : MG('hamstrings')
    else if (sc > 0.45 && sn < 0) muscle = MG('calves')

    return { p: [(rx + b) * c * f, -s, zc + (rz + b) * sn * f], color, muscle }
  }
}

function legWeight(side: -1 | 1) {
  const up = side < 0 ? B.lThigh : B.rThigh
  const lo = side < 0 ? B.lCalf : B.rCalf
  return (s: number): [number, number, number] => [up, lo, smooth(THIGH_L - 0.05, THIGH_L + 0.05, s)]
}

/** Shift a ring builder to a bone's rest position. */
function at(ring: Ring, off: THREE.Vector3): Ring {
  return (d, s, th) => {
    const r = ring(d, s, th)
    return { ...r, p: [r.p[0] + Math.abs(off.x), r.p[1] + off.y, r.p[2] + off.z] }
  }
}

export interface BodyMesh {
  geometry: THREE.BufferGeometry
  muscleIds: Uint8Array
  baseColors: Float32Array
}

/** One continuous skinned body: torso, arms and legs share a skeleton, no joint balls. */
export function buildBody(look: CharacterLook): BodyMesh {
  const d = bodyDims(look)
  const dp = pumped(d)
  const pal = palette(look)
  const rest = restPositions(d)
  const b: Buf = { pos: [], pump: [], col: [], uv: [], si: [], sw: [], mg: [], idx: [], seams: [] }

  const torsoCuts = [0.975, 0.995, 1.245, 1.265, 1.4, 1.43, 1.455, 1.5, 1.53].map((y) => TORSO_TOP - y)
  tube(b, d, dp, samples(TORSO_LEN, 0.012, torsoCuts, 0.02, 0.045), torsoRing(look, pal), torsoWeight, false)

  const armCuts = [0.13, 0.5, 0.53]
  const legCuts = [0.2, 0.72, 0.76, 0.8]
  for (const side of [-1, 1] as const) {
    const arm = side < 0 ? rest.lArm : rest.rArm
    tube(
      b,
      d,
      dp,
      samples(ARM_LEN, 0.012, armCuts, d.delt * 0.9, 0.02),
      at(armRing(look, pal), arm),
      armWeight(side),
      side < 0,
      ARM_LEN,
    )
    const thigh = side < 0 ? rest.lThigh : rest.rThigh
    tube(b, d, dp, samples(LEG_LEN, 0.013, legCuts, d.thigh * 0.75, 0.025), at(legRing(look, pal), thigh), legWeight(side), side < 0)
  }

  const geo = new THREE.BufferGeometry()
  geo.setIndex(b.idx)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(b.si, 4))
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(b.sw, 4))
  geo.morphAttributes.position = [new THREE.Float32BufferAttribute(b.pump, 3)]
  geo.morphTargetsRelative = true
  geo.computeVertexNormals()
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (const [a, c] of b.seams) {
    v.set(nrm.getX(a) + nrm.getX(c), nrm.getY(a) + nrm.getY(c), nrm.getZ(a) + nrm.getZ(c)).normalize()
    nrm.setXYZ(a, v.x, v.y, v.z)
    nrm.setXYZ(c, v.x, v.y, v.z)
  }
  geo.computeBoundingSphere()
  return { geometry: geo, muscleIds: Uint8Array.from(b.mg), baseColors: Float32Array.from(b.col) }
}

/** Tint the worked muscles (for the Profe's technique demos); `null` restores the base colors. */
export function paintMuscles(body: BodyMesh, groups: readonly MuscleGroup[] | null, tint = '#ff4d3d', amount = 0.65) {
  const col = body.geometry.getAttribute('color') as THREE.BufferAttribute
  const arr = col.array as Float32Array
  const wanted = new Set((groups ?? []).map(MG))
  const t = new THREE.Color(tint)
  for (let i = 0; i < body.muscleIds.length; i++) {
    const on = wanted.has(body.muscleIds[i])
    const k = on ? amount : 0
    arr[i * 3] = body.baseColors[i * 3] * (1 - k) + t.r * k
    arr[i * 3 + 1] = body.baseColors[i * 3 + 1] * (1 - k) + t.g * k
    arr[i * 3 + 2] = body.baseColors[i * 3 + 2] * (1 - k) + t.b * k
  }
  col.needsUpdate = true
}

let veinTex: THREE.CanvasTexture | null = null

/**
 * Bump map for the arms: U wraps around the limb (0.25 = front), V runs shoulder (top) to wrist (bottom).
 * Raised veins are lighter strokes on a flat mid-gray.
 */
export function veinTexture() {
  if (veinTex) return veinTex
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const x = c.getContext('2d')!
  x.fillStyle = '#808080'
  x.fillRect(0, 0, 256, 512)
  x.filter = 'blur(2px)'
  x.strokeStyle = '#d8d8d8'
  x.lineCap = 'round'
  const vein = (pts: [number, number][], w: number) => {
    x.lineWidth = w
    x.beginPath()
    x.moveTo(pts[0][0] * 256, pts[0][1] * 512)
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = ((pts[i][0] + pts[i + 1][0]) / 2) * 256
      const my = ((pts[i][1] + pts[i + 1][1]) / 2) * 512
      x.quadraticCurveTo(pts[i][0] * 256, pts[i][1] * 512, mx, my)
    }
    const last = pts[pts.length - 1]
    x.lineTo(last[0] * 256, last[1] * 512)
    x.stroke()
  }
  // Cephalic vein over the biceps and its forearm branches.
  vein([[0.2, 0.22], [0.22, 0.32], [0.2, 0.42], [0.23, 0.52], [0.26, 0.6]], 7)
  vein([[0.26, 0.6], [0.22, 0.7], [0.19, 0.8], [0.2, 0.92]], 6)
  vein([[0.26, 0.6], [0.31, 0.7], [0.34, 0.8], [0.32, 0.93]], 5)
  vein([[0.31, 0.7], [0.26, 0.76], [0.24, 0.86]], 4)
  vein([[0.3, 0.3], [0.32, 0.4], [0.3, 0.5]], 4)
  veinTex = new THREE.CanvasTexture(c)
  return veinTex
}

/** Limb radius helpers for accessories (sleeves, watch, belt). */
export function kneeRadius(d: Dims) {
  return d.thigh * 0.6 + 0.004
}
export function wristRadius(d: Dims) {
  return d.fore * 0.7
}
