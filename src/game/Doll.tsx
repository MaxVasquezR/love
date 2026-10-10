import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterLook, MuscleGroup, Pose, RepQuality, StationId } from '../core/types'
import { printTexture, vzlaPrintTexture } from './brandTextures'
import {
  CALF_L,
  FORE_L,
  HEAD_Y,
  HIP_Y,
  SHOULDER_Y,
  THIGH_L,
  TORSO_Y,
  UPPER_L,
  bodyDims,
  boneInverses,
  buildBody,
  kneeRadius,
  paintMuscles,
  torsoAt,
  veinTexture,
} from './body/buildBody'
import { MOP_SWING, applyMotion, legIK, motionFor, type Joints } from './motions'
import { Barbell, Dumbbell, LatBar } from './equipment/Barbell'
import { rigLive } from './rigs'

export interface RepSignal {
  start: number
  quality: RepQuality
  /** Current exercise, so the athlete uses the right rig and plates. */
  exerciseId?: string
  kg?: number
  /** Near-max load: the belt comes out. */
  heavy?: boolean
  /** Rep length multiplier (the Profe demos in slow motion). */
  slow?: number
  /** Show the classic mistake instead of clean form. */
  bad?: boolean
  /** Rep phase driven by the player's thumb (0..1); overrides the timed animation. */
  live?: number
  /** Bar shake while grinding or tired, 0..1. */
  strain?: number
  /** Left side minus right side of the bar (two-thumb lifting); the weak arm drops. */
  tilt?: number
  /** `performance.now()` of the last chalk-up (ritual before the set). */
  chalk?: number
  /** Session fatigue 0..1: red face, sweat, heavy breathing. */
  fatigue?: number
}

type Props = {
  look: CharacterLook
  poseRef: React.MutableRefObject<Pose>
  styleRef: React.MutableRefObject<StationId | null>
  repRef?: React.MutableRefObject<RepSignal>
  position: [number, number, number]
  /** The player's body moves the machines (pulldown cable, leg press sled). */
  drivesRig?: boolean
  /** Muscle groups lit up in red (technique demo). */
  highlight?: readonly MuscleGroup[] | null
}

const REP_SECONDS = 0.6
const FLUSH = new THREE.Color('#d8423a')
/** Sweat drop start points on the forehead (x, y in head space). */
const DROPS: [number, number][] = [
  [-0.055, 0.165],
  [0.03, 0.175],
  [-0.015, 0.17],
  [0.06, 0.16],
  [0.0, 0.18],
]
const damp = THREE.MathUtils.damp
const X_AXIS = new THREE.Vector3(1, 0, 0)
const vA = new THREE.Vector3()
const vB = new THREE.Vector3()

/** Abduction for an arm on `side` (-1 left, 1 right). Positive `a` moves the arm away from the body. */
const abd = (side: -1 | 1, a: number) => side * a

type BoneRef = React.RefObject<THREE.Bone | null>

export const Doll = forwardRef<THREE.Group, Props>(function Doll(
  { look, poseRef, styleRef, repRef, position, drivesRig = false, highlight = null },
  ref,
) {
  const glow = useRef({ last: 0 })
  const lHand = useRef<THREE.Group>(null)
  const rHand = useRef<THREE.Group>(null)
  const held = useRef<THREE.Group>(null)
  const heldBar = useRef<THREE.Group>(null)
  const heldLat = useRef<THREE.Group>(null)
  const backBar = useRef<THREE.Group>(null)
  const hipBar = useRef<THREE.Group>(null)
  const goblet = useRef<THREE.Group>(null)
  const [kg, setKg] = useState(60)
  const hips = useRef<THREE.Bone>(null)
  const torso = useRef<THREE.Bone>(null)
  const head = useRef<THREE.Bone>(null)
  const lArm = useRef<THREE.Bone>(null)
  const rArm = useRef<THREE.Bone>(null)
  const lFore = useRef<THREE.Bone>(null)
  const rFore = useRef<THREE.Bone>(null)
  const lThigh = useRef<THREE.Bone>(null)
  const rThigh = useRef<THREE.Bone>(null)
  const lCalf = useRef<THREE.Bone>(null)
  const rCalf = useRef<THREE.Bone>(null)
  const tail = useRef<THREE.Group>(null)
  const lFoot = useRef<THREE.Group>(null)
  const rFoot = useRef<THREE.Group>(null)
  const lBell = useRef<THREE.Group>(null)
  const rBell = useRef<THREE.Group>(null)
  const frontBar = useRef<THREE.Group>(null)
  const belt = useRef<THREE.Mesh>(null)
  const knees = useRef<(THREE.Mesh | null)[]>([])
  const straps = useRef<(THREE.Mesh | null)[]>([])
  const chalkFx = useRef<(THREE.Group | null)[]>([])
  const towel = useRef<THREE.Group>(null)
  const bottle = useRef<THREE.Group>(null)
  const t = useRef(0)
  const fx = useRef({ pump: 0, sweat: 0, lastRep: -1, chalk: 0, lastChalk: 0, flush: 0 })
  const drops = useRef<(THREE.Mesh | null)[]>([])
  const skinColor = useMemo(() => new THREE.Color(look.skin), [look.skin])
  const [faceMat] = useState(() => new THREE.MeshStandardMaterial({ color: look.skin, roughness: 0.55 }))
  const [cheekMat] = useState(() => new THREE.MeshStandardMaterial({ color: look.skin, roughness: 0.5 }))
  const [sweatMat] = useState(
    () => new THREE.MeshStandardMaterial({ color: '#e4f3ff', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.85 }),
  )

  const d = useMemo(() => bodyDims(look), [look])
  const body = useMemo(() => buildBody(look), [look])
  const [mat] = useState(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.66 }))
  const [chalkMat] = useState(
    () => new THREE.MeshBasicMaterial({ color: '#f4f4f0', transparent: true, opacity: 0, depthWrite: false }),
  )
  const [skin] = useState(() => {
    const mesh = new THREE.SkinnedMesh(new THREE.BufferGeometry(), mat)
    mesh.castShadow = true
    mesh.frustumCulled = false
    return mesh
  })

  useLayoutEffect(() => {
    const bones = [hips, torso, head, lArm, lFore, rArm, rFore, lThigh, lCalf, rThigh, rCalf].map((r) => r.current!)
    skin.geometry = body.geometry
    skin.updateMorphTargets()
    const skeleton = new THREE.Skeleton(bones, boneInverses(d))
    skin.bind(skeleton, new THREE.Matrix4())
    const veins = look.topStyle !== 'hoodie' && look.muscle >= (look.build === 'female' ? 0.5 : 0.4)
    mat.bumpMap = veins ? veinTexture() : null
    mat.bumpScale = 1.6 * look.muscle
    mat.needsUpdate = true
    return () => {
      skeleton.dispose()
      body.geometry.dispose()
    }
  }, [skin, mat, body, d, look])

  useLayoutEffect(() => {
    if (!highlight) paintMuscles(body, null)
  }, [body, highlight])

  useFrame((_, dt) => {
    t.current += dt
    const time = t.current
    const pose = poseRef.current
    const style = styleRef.current
    const rep = repRef?.current
    const f = fx.current
    const lifting = pose === 'lift'

    // Pump and sweat build with every good rep and fade slowly afterwards.
    if (rep && rep.start !== f.lastRep) {
      f.lastRep = rep.start
      if (rep.start > 0 && rep.quality !== 'miss') {
        f.pump = Math.min(1, f.pump + 0.14)
        f.sweat = Math.min(1, f.sweat + 0.035)
      }
    }
    // Highlighted muscles pulse so the eye finds them (repainted ~12 times a second).
    if (highlight && time - glow.current.last > 0.08) {
      glow.current.last = time
      paintMuscles(body, highlight, '#ff3b2f', 0.45 + 0.3 * (0.5 + 0.5 * Math.sin(time * 6)))
    }
    f.pump = Math.max(0, f.pump - dt * 0.04)
    f.sweat = Math.max(0, f.sweat - dt * 0.003)
    if (skin.morphTargetInfluences) skin.morphTargetInfluences[0] = f.pump
    mat.roughness = 0.66 - 0.36 * f.sweat
    if (rep?.chalk && rep.chalk !== f.lastChalk) {
      f.lastChalk = rep.chalk
      f.chalk = 1
    }
    f.chalk = Math.max(0, f.chalk - dt * 1.1)

    // Effort shows on the face: flushed cheeks while grinding and as the session wears on, sweat running down.
    const fatigue = rep?.fatigue ?? 0
    const strainNow = lifting ? (rep?.strain ?? 0) : 0
    f.flush = damp(f.flush, Math.min(1, fatigue * 0.7 + strainNow * 0.6 + f.pump * 0.15), 3, dt)
    faceMat.color.copy(skinColor).lerp(FLUSH, f.flush * 0.22)
    cheekMat.color.copy(skinColor).lerp(FLUSH, f.flush * 0.6)
    const sweatLvl = Math.min(1, f.sweat * 1.6 + fatigue * 0.7)
    faceMat.roughness = 0.55 - 0.3 * sweatLvl
    drops.current.forEach((m, i) => {
      if (!m) return
      m.visible = sweatLvl > (i + 1) / (DROPS.length + 1)
      if (!m.visible) return
      const cyc = (time * 0.32 + i * 0.37) % 1
      const [x, y] = DROPS[i]
      m.position.set(x, y - cyc * 0.085, 0.1 - Math.abs(x) * 0.3 + cyc * 0.004)
      m.scale.set(1, 1 + cyc * 0.6, 1)
    })
    chalkMat.opacity = f.chalk * 0.75
    for (const g of chalkFx.current) {
      if (!g) continue
      g.visible = f.chalk > 0
      g.scale.setScalar(1 + (1 - f.chalk) * 2.6)
    }
    const kneesOn = !!look.kneeSleeves || (lifting && style === 'legs')
    const strapsOn = !!look.wristStraps || (lifting && style === 'pull')
    for (const m of knees.current) if (m) m.visible = kneesOn
    for (const m of straps.current) if (m) m.visible = strapsOn
    if (belt.current) belt.current.visible = !!look.belt || (lifting && !!rep?.heavy)
    const resting = pose === 'rest'
    if (towel.current) towel.current.visible = resting
    if (bottle.current) bottle.current.visible = resting

    let phase = 0
    let shake = 0
    if (rep?.live !== undefined) {
      phase = rep.live
      shake = Math.sin(time * 70) * 0.04 * (rep.strain ?? 0)
    } else if (rep) {
      const elapsed = (performance.now() - rep.start) / 1000
      const len = REP_SECONDS * (rep.slow ?? 1)
      if (elapsed >= 0 && elapsed < len) {
        const miss = rep.quality === 'miss'
        phase = Math.sin((Math.PI * elapsed) / len) * (miss ? 0.45 : 1)
        if (miss) shake = Math.sin(time * 70) * 0.05
      }
    }
    const breathe = Math.sin(time * 2.4) * 0.012

    const j: Joints = {
      hipY: breathe,
      hipZ: 0,
      lean: 0,
      sway: 0,
      headX: Math.sin(time * 0.9) * 0.05,
      headY: Math.sin(time * 1.15) * 0.25,
      lArmX: 0.05 + Math.sin(time * 1.9) * 0.05,
      rArmX: 0.05 + Math.cos(time * 2.1) * 0.05,
      lArmZ: abd(-1, 0.12 + d.lat * 0.7),
      rArmZ: abd(1, 0.12 + d.lat * 0.7),
      lForeX: -0.2,
      rForeX: -0.15,
      lForeZ: 0,
      rForeZ: 0,
      lThighX: 0,
      rThighX: 0,
      lCalfX: 0.04,
      rCalfX: 0.04,
      pelvis: 0,
      feetL: null,
      feetR: null,
      footPitch: 0,
      prop: 'none',
    }

    const motion = motionFor(rep?.exerciseId, style)
    if (rep?.kg !== undefined && rep.kg !== kg) setKg(rep.kg)
    if (drivesRig) rigLive.incline = rep?.exerciseId === 'incline' ? 0.61 : 0

    if (lifting) {
      const tilt = rep?.live !== undefined ? (rep.tilt ?? 0) : 0
      if (Math.abs(tilt) > 0.005) {
        // Each arm follows its own thumb: the weak side lags and the bar in the hands tilts with it.
        const jr = { ...j }
        applyMotion(motion, Math.min(1, Math.max(0, phase - tilt / 2)), jr, !!rep?.bad)
        applyMotion(motion, Math.min(1, Math.max(0, phase + tilt / 2)), j, !!rep?.bad)
        j.rArmX = jr.rArmX
        j.rArmZ = jr.rArmZ
        j.rForeX = jr.rForeX
        j.rForeZ = jr.rForeZ
      } else applyMotion(motion, phase, j, !!rep?.bad)
      j.sway = shake + tilt * 0.25
      const tremor = strainNow * 0.035
      if (tremor > 0.004) {
        j.lArmX += Math.sin(time * 63) * tremor
        j.rArmX += Math.sin(time * 71 + 1.3) * tremor
        j.lForeX += Math.sin(time * 57 + 0.7) * tremor
        j.rForeX += Math.sin(time * 66 + 2.1) * tremor
      }
      if (drivesRig) {
        if (motion === 'pulldown') rigLive.pulldown = phase
        if (motion === 'legPress') rigLive.legpress = 0.8 - 0.38 * phase
      }
    } else if (pose === 'walk') {
      const s = Math.sin(time * 9)
      j.hipY = Math.abs(Math.cos(time * 9)) * 0.03
      j.lThighX = -s * 0.55
      j.rThighX = s * 0.55
      j.lCalfX = 0.12 + Math.max(0, j.lThighX) * 1.3
      j.rCalfX = 0.12 + Math.max(0, j.rThighX) * 1.3
      j.lArmX = s * 0.5
      j.rArmX = -s * 0.5
      j.lForeX = j.rForeX = -0.4
      j.lean = 0.06
      j.sway = s * 0.04
      j.headY = 0
    } else if (pose === 'cheer') {
      j.hipY = Math.abs(Math.sin(time * 9)) * 0.06
      j.lArmX = -2.75 + Math.sin(time * 14) * 0.1
      j.rArmX = -2.75 + Math.cos(time * 14) * 0.1
      j.lArmZ = abd(-1, 0.4)
      j.rArmZ = abd(1, 0.4)
      j.lForeX = j.rForeX = -0.25
      j.lCalfX = j.rCalfX = 0.1 + j.hipY
      j.headY = Math.sin(time * 7) * 0.25
    } else if (pose === 'wave') {
      j.lArmX = -2.5
      j.lArmZ = abd(-1, 0.35)
      j.lForeX = -0.5 + Math.sin(time * 12) * 0.45
      j.headY = 0.25
    } else if (pose === 'clap') {
      const c = Math.max(0, Math.sin(time * 16))
      j.lArmX = j.rArmX = -1.35
      j.lForeX = j.rForeX = -0.5
      j.lArmZ = abd(-1, -0.05 - 0.22 * c)
      j.rArmZ = abd(1, -0.05 - 0.22 * c)
      j.headX = -0.05
    } else if (pose === 'point') {
      j.rArmX = -1.5 + Math.sin(time * 5) * 0.06
      j.rArmZ = abd(1, 0.1)
      j.rForeX = -0.05
      j.lArmX = 0.15
      j.lArmZ = abd(-1, 0.55)
      j.lForeX = -1.5
      j.headY = -0.15
    } else if (pose === 'cross') {
      j.lArmX = j.rArmX = -0.45
      j.lArmZ = abd(-1, -0.3)
      j.rArmZ = abd(1, -0.3)
      j.lForeX = j.rForeX = -2.0
      j.headY = Math.sin(time * 0.8) * 0.15
      j.headX = -0.06
    } else if (pose === 'fist') {
      const pump = Math.max(0, Math.sin(time * 9))
      j.rArmX = -2.55 - pump * 0.2
      j.rArmZ = abd(1, 0.25)
      j.rForeX = -0.7 + pump * 0.4
      j.hipY = pump * 0.02
    } else if (pose === 'facepalm') {
      j.rArmX = -1.65
      j.rArmZ = abd(1, -0.38)
      j.rForeX = -2.15
      j.headX = 0.3
      j.headY = 0
      j.lean = 0.08
    } else if (pose === 'rest') {
      // Catch your breath between sets: heavy breathing, a sip from the bottle every few seconds.
      // A harder session means faster, deeper breaths.
      const cyc = time % 5
      const sip = cyc < 1.8 ? Math.sin((Math.PI * cyc) / 1.8) : 0
      const br = 3.2 + fatigue * 4
      j.hipY = Math.sin(time * br) * 0.012 * (1 + fatigue)
      j.lean = 0.05 + fatigue * 0.08 + Math.sin(time * br) * 0.02 * (1 + fatigue)
      j.lArmX = 0.05 - sip * 1.45
      j.lArmZ = abd(-1, 0.25 - sip * 0.2)
      j.lForeX = -0.3 - sip * 1.85
      j.headX = -0.05 - sip * 0.35
      j.headY = sip ? 0 : Math.sin(time * 0.7) * 0.2
      j.rArmX = 0.1
      j.rForeX = -0.25
    } else if (pose === 'spot') {
      // Spotter: leaning over the bar, hands under it, lifting with the athlete.
      const push = 0.5 + 0.5 * Math.sin(time * 3.2)
      j.lean = 0.32
      j.lArmX = j.rArmX = -1.25 - push * 0.35
      j.lArmZ = abd(-1, -0.12)
      j.rArmZ = abd(1, -0.12)
      j.lForeX = j.rForeX = -0.55 + push * 0.3
      j.headX = 0.35
      j.headY = 0
      j.lThighX = j.rThighX = -0.15
      j.lCalfX = j.rCalfX = 0.25
    } else if (pose === 'mop') {
      // Mopping: both hands on the handle, swinging it side to side while shuffling forward.
      const s = Math.sin(time * MOP_SWING)
      const step = Math.sin(time * 3)
      j.lean = 0.2
      j.headX = 0.3
      j.headY = s * 0.15
      j.sway = s * 0.05
      j.lArmX = -0.75
      j.rArmX = -0.55
      j.lArmZ = abd(-1, -0.12 - s * 0.22)
      j.rArmZ = abd(1, -0.12 + s * 0.22)
      j.lForeX = -0.75
      j.rForeX = -0.5
      j.lThighX = -step * 0.2
      j.rThighX = step * 0.2
      j.lCalfX = 0.1 + Math.max(0, j.lThighX) * 0.8
      j.rCalfX = 0.1 + Math.max(0, j.rThighX) * 0.8
    } else if (pose === 'flex') {
      const pulse = Math.sin(time * 4) * 0.06
      j.lArmZ = abd(-1, 1.45)
      j.rArmZ = abd(1, 1.45)
      j.lArmX = j.rArmX = -0.15
      j.lForeX = j.rForeX = 0
      j.lForeZ = -1.55 - pulse
      j.rForeZ = 1.55 + pulse
      j.lThighX = 0.02
      j.rThighX = -0.12
      j.rCalfX = 0.12
      j.headX = -0.05
      j.headY = 0
    }

    // Planted feet: solve thigh and knee so the soles stay where the motion put them.
    if (j.feetL || j.feetR) {
      const hy = HIP_Y + j.hipY - 0.03 * Math.cos(j.pelvis)
      const hz = j.hipZ - 0.03 * Math.sin(j.pelvis)
      if (j.feetL) [j.lThighX, j.lCalfX] = legIK([hz, hy], j.feetL, j.pelvis)
      if (j.feetR) [j.rThighX, j.rCalfX] = legIK([hz, hy], j.feetR, j.pelvis)
    }

    const k = lifting ? 22 : 11
    const rot = (r: React.RefObject<THREE.Object3D | null>, axis: 'x' | 'y' | 'z', v: number) => {
      const o = r.current
      if (o) o.rotation[axis] = damp(o.rotation[axis], v, k, dt)
    }
    const h = hips.current
    if (h) {
      h.position.y = damp(h.position.y, HIP_Y + j.hipY, k, dt)
      h.position.z = damp(h.position.z, j.hipZ, k, dt)
    }
    rot(hips, 'x', j.pelvis)
    rot(torso, 'x', j.lean)
    rot(torso, 'z', j.sway)
    rot(head, 'x', j.headX)
    rot(head, 'y', j.headY)
    rot(lArm, 'x', j.lArmX)
    rot(rArm, 'x', j.rArmX)
    rot(lArm, 'z', j.lArmZ)
    rot(rArm, 'z', j.rArmZ)
    rot(lFore, 'x', j.lForeX)
    rot(rFore, 'x', j.rForeX)
    rot(lFore, 'z', j.lForeZ)
    rot(rFore, 'z', j.rForeZ)
    rot(lThigh, 'x', j.lThighX)
    rot(rThigh, 'x', j.rThighX)
    rot(lCalf, 'x', j.lCalfX)
    rot(rCalf, 'x', j.rCalfX)
    // Keep soles flat on the floor.
    const walkToe = (thigh: number) => (pose === 'walk' ? Math.max(0, thigh) * 0.6 : 0)
    rot(lFoot, 'x', j.footPitch - (j.pelvis + j.lThighX + j.lCalfX) + walkToe(j.lThighX))
    rot(rFoot, 'x', j.footPitch - (j.pelvis + j.rThighX + j.rCalfX) + walkToe(j.rThighX))

    // What the hands hold.
    const prop = j.prop
    if (lBell.current) lBell.current.visible = prop === 'db2'
    if (rBell.current) rBell.current.visible = prop === 'db2'
    if (frontBar.current) frontBar.current.visible = prop === 'frontBar'
    if (backBar.current) backBar.current.visible = prop === 'backBar'
    if (hipBar.current) hipBar.current.visible = prop === 'hipBar'
    if (goblet.current) goblet.current.visible = prop === 'goblet'
    const inHands = prop === 'handsBar' || prop === 'latBar'
    if (held.current) held.current.visible = inHands
    if (heldBar.current) heldBar.current.visible = prop === 'handsBar'
    if (heldLat.current) heldLat.current.visible = prop === 'latBar'
    const root = h?.parent
    if ((inHands || drivesRig) && root && lHand.current && rHand.current) {
      h.updateWorldMatrix(true, true)
      lHand.current.getWorldPosition(vA)
      rHand.current.getWorldPosition(vB)
      if (drivesRig && lifting) rigLive.hands.addVectors(vA, vB).multiplyScalar(0.5)
      root.worldToLocal(vA)
      root.worldToLocal(vB)
      if (held.current && inHands) {
        held.current.position.addVectors(vA, vB).multiplyScalar(0.5)
        held.current.quaternion.setFromUnitVectors(X_AXIS, vB.sub(vA).normalize())
      }
    }
    if (tail.current) {
      const swing = pose === 'walk' ? Math.sin(time * 9) * 0.25 : Math.sin(time * 2.5) * 0.08
      tail.current.rotation.x = damp(tail.current.rotation.x, 0.45 + swing + j.lean * -0.6, 8, dt)
      tail.current.rotation.z = damp(tail.current.rotation.z, Math.sin(time * 3.1) * 0.12, 8, dt)
    }
  })

  const M = (color: string, rough = 0.6) => <meshStandardMaterial color={color} roughness={rough} />

  const ts = look.topStyle
  const torsoY = HIP_Y + TORSO_Y
  const chest = torsoAt(d, 1.24)
  const neckRing = torsoAt(d, 1.5)
  const rack = torsoAt(d, 1.44)
  const traps = torsoAt(d, 1.47)
  const pelvisFront = torsoAt(d, 0.93)
  const waist = torsoAt(d, 1.0)
  const flap = torsoAt(d, 1.37)
  const flapFront = flap.zc + flap.rz + (d.f ? 0.05 : d.pec * 0.4) + 0.012
  const flapBack = flap.zc - flap.rz - 0.03
  const showPrint = look.topPrint && ts !== 'bra'
  const foreR = d.fore * 0.74

  const leg = (side: -1 | 1, thigh: BoneRef, calf: BoneRef, foot: React.RefObject<THREE.Group | null>) => (
    <bone ref={thigh} position={[side * d.hipW * 0.6, -0.03, 0]}>
      <bone ref={calf} position={[0, -THIGH_L, 0]}>
        <mesh
          ref={(m) => {
            knees.current[side < 0 ? 0 : 1] = m
          }}
          position={[0, -0.015, 0.002]}
          scale={[1, 1, 1.05]}
          visible={!!look.kneeSleeves}
        >
          <cylinderGeometry args={[kneeRadius(d) + 0.014, kneeRadius(d) + 0.012, 0.13, 16, 1, true]} />
          <meshStandardMaterial color="#151515" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <group ref={foot} position={[0, -CALF_L, 0]}>
          <mesh position={[0, -0.005, 0.045]} castShadow>
            <boxGeometry args={[0.095, 0.07, 0.24]} />
            {M(look.shoes, 0.5)}
          </mesh>
          <mesh position={[0, 0.03, 0.12]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.09, 0.03, 0.09]} />
            {M(look.shoes, 0.5)}
          </mesh>
          <mesh position={[0, -0.042, 0.047]}>
            <boxGeometry args={[0.1, 0.022, 0.25]} />
            {M('#f4f4f4', 0.8)}
          </mesh>
          <mesh position={[side * 0.049, 0, 0.04]}>
            <boxGeometry args={[0.004, 0.028, 0.13]} />
            {M(look.shoeStripe, 0.5)}
          </mesh>
        </group>
      </bone>
    </bone>
  )

  const arm = (side: -1 | 1, upper: BoneRef, fore: BoneRef, bell: React.RefObject<THREE.Group | null>) => (
    <bone ref={upper} position={[side * d.shoulderX, SHOULDER_Y, 0]}>
      <bone ref={fore} position={[0, -UPPER_L, 0]}>
        <group position={[0, -FORE_L, 0.004]}>
          <mesh scale={[0.95, 1.35, 0.55]} castShadow>
            <sphereGeometry args={[0.034, 12, 10]} />
            {M(look.gloves ? '#1b1b1b' : look.skin, 0.7)}
          </mesh>
          <mesh position={[0, -0.045, 0.004]} scale={[0.9, 1, 0.5]}>
            <capsuleGeometry args={[0.026, 0.02, 4, 8]} />
            {M(look.skin, 0.7)}
          </mesh>
          <mesh position={[-side * 0.03, -0.008, 0.012]} rotation={[0, 0, side * 0.5]}>
            <capsuleGeometry args={[0.0095, 0.03, 4, 6]} />
            {M(look.skin, 0.7)}
          </mesh>
          <group
            ref={(g) => {
              chalkFx.current[side < 0 ? 0 : 1] = g
            }}
            visible={false}
          >
            {[
              [0.02, 0.01, 0.03],
              [-0.025, -0.02, 0.02],
              [0.01, -0.05, -0.02],
              [-0.01, 0.03, -0.03],
              [0.03, -0.03, 0],
            ].map((p, i) => (
              <mesh key={i} position={p as [number, number, number]} material={chalkMat}>
                <sphereGeometry args={[0.022, 6, 5]} />
              </mesh>
            ))}
          </group>
          {side === -1 && (
            <group ref={bottle} position={[0, -0.03, 0.02]} visible={false}>
              <mesh>
                <cylinderGeometry args={[0.032, 0.032, 0.2, 14]} />
                <meshStandardMaterial color="#2ec4b6" roughness={0.25} transparent opacity={0.85} />
              </mesh>
              <mesh position={[0, 0.115, 0]}>
                <cylinderGeometry args={[0.02, 0.026, 0.035, 10]} />
                {M('#111', 0.4)}
              </mesh>
              <mesh position={[0, 0.02, 0.0325]}>
                <planeGeometry args={[0.04, 0.07]} />
                <meshBasicMaterial map={printTexture()} transparent depthWrite={false} />
              </mesh>
            </group>
          )}
        </group>
        {look.watch && side === -1 && (
          <mesh position={[0, -0.215, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.85, 1]}>
            <torusGeometry args={[foreR + 0.006, 0.008, 6, 16]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
          </mesh>
        )}
        <mesh
          ref={(m) => {
            straps.current[side < 0 ? 0 : 1] = m
          }}
          position={[0, -0.228, 0]}
          scale={[1, 1, 0.85]}
          visible={!!look.wristStraps}
        >
          <cylinderGeometry args={[foreR + 0.004, foreR + 0.004, 0.035, 12]} />
          {M('#c1121f')}
        </mesh>
        <group ref={side < 0 ? lHand : rHand} position={[0, -FORE_L - 0.02, 0.01]} />
        <group ref={bell} position={[0, -0.29, 0.01]} visible={false}>
          <Dumbbell kg={kg} />
        </group>
      </bone>
    </bone>
  )

  return (
    <group ref={ref} position={position} scale={look.height}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.36, 18]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
      <primitive object={skin} />
      <group ref={held} visible={false}>
        <group ref={heldBar}>
          <Barbell kg={kg} />
        </group>
        <group ref={heldLat}>
          <LatBar />
        </group>
      </group>

      <bone ref={hips} position={[0, HIP_Y, 0]}>
        {leg(-1, lThigh, lCalf, lFoot)}
        {leg(1, rThigh, rCalf, rFoot)}
        <group ref={hipBar} position={[0, 0.93 - HIP_Y, pelvisFront.zc + pelvisFront.rz + 0.06]} visible={false}>
          <Barbell kg={kg} />
        </group>

        <bone ref={torso} position={[0, TORSO_Y, 0]}>
          <mesh
            ref={belt}
            position={[0, 1.0 - torsoY, waist.zc]}
            scale={[waist.rx + 0.012, 1, waist.rz + 0.012]}
            visible={!!look.belt}
          >
            <cylinderGeometry args={[1, 1, 0.075, 24, 1, true]} />
            <meshStandardMaterial color="#4a2f1d" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          {/* towel over the right shoulder while resting */}
          <group ref={towel} position={[d.shoulderX * 0.6, 1.47 - torsoY, 0]} visible={false}>
            <mesh position={[0, 0.012, (flapFront + flapBack) / 2]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.13, 0.014, flapFront - flapBack + 0.02]} />
              {M('#f1faee', 0.95)}
            </mesh>
            {[flapFront, flapBack].map((z, i) => (
              <mesh key={i} position={[0, -0.1, z]}>
                <boxGeometry args={[0.13, 0.22, 0.014]} />
                {M('#f1faee', 0.95)}
              </mesh>
            ))}
            <mesh position={[0, -0.18, flapFront + 0.008]}>
              <boxGeometry args={[0.131, 0.025, 0.004]} />
              {M('#ff6b35', 0.8)}
            </mesh>
          </group>
          {showPrint && (
            <mesh position={[0, 1.24 - torsoY, chest.zc + chest.rz + 0.006]} rotation={[-0.1, 0, 0]}>
              <planeGeometry args={[0.15, 0.075]} />
              <meshBasicMaterial
                map={look.topPrint === 'vzla' ? vzlaPrintTexture() : printTexture()}
                transparent
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-2}
              />
            </mesh>
          )}
          {ts === 'hoodie' && (
            <mesh position={[0, 0.5, -0.1]} scale={[1.25, 0.75, 0.8]}>
              <sphereGeometry args={[0.09, 12, 10]} />
              {M(look.top, 0.7)}
            </mesh>
          )}
          {look.whistle && (
            <>
              <mesh position={[0, 1.5 - torsoY, neckRing.zc + 0.01]} rotation={[1.25, 0, 0]} scale={[neckRing.rx + 0.006, neckRing.rz + 0.02, 0.15]}>
                <torusGeometry args={[1, 0.035, 4, 24]} />
                {M('#e63946')}
              </mesh>
              <mesh position={[0, 1.38 - torsoY, chest.zc + chest.rz + 0.025]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, 0.045, 8]} />
                <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
              </mesh>
            </>
          )}

          {/* bars that ride on the body */}
          <group ref={frontBar} position={[0, 1.44 - torsoY, rack.zc + rack.rz + 0.05]} visible={false}>
            <Barbell kg={kg} />
          </group>
          <group ref={backBar} position={[0, 1.47 - torsoY, traps.zc - traps.rz - 0.03]} visible={false}>
            <Barbell kg={kg} />
          </group>
          <group
            ref={goblet}
            position={[0, 1.27 - torsoY, chest.zc + chest.rz + 0.1]}
            rotation={[0, 0, Math.PI / 2]}
            visible={false}
          >
            <Dumbbell kg={kg} />
          </group>

          {arm(-1, lArm, lFore, lBell)}
          {arm(1, rArm, rFore, rBell)}

          <bone ref={head} position={[0, HEAD_Y, 0]}>
            <group scale={1.08}>
              <Head look={look} tail={tail} faceMat={faceMat} cheekMat={cheekMat} />
              {DROPS.map((_, i) => (
                <mesh
                  key={i}
                  ref={(m) => {
                    drops.current[i] = m
                  }}
                  material={sweatMat}
                  visible={false}
                >
                  <sphereGeometry args={[0.0065, 6, 6]} />
                </mesh>
              ))}
            </group>
          </bone>
        </bone>
      </bone>
    </group>
  )
})

function Head({
  look,
  tail,
  faceMat,
  cheekMat,
}: {
  look: CharacterLook
  tail: React.RefObject<THREE.Group | null>
  /** Skin of the face; reddens with effort. */
  faceMat: THREE.Material
  cheekMat: THREE.Material
}) {
  const f = look.build === 'female'
  const hairM = <meshStandardMaterial color={look.hair} roughness={0.85} />
  return (
    <>
      <mesh position={[0, 0.12, 0]} scale={[0.9, 1.08, 0.98]} material={faceMat} castShadow>
        <sphereGeometry args={[0.105, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.058, 0.018]} scale={[f ? 0.86 : 1, 0.75, 0.95]} material={faceMat}>
        <sphereGeometry args={[0.08, 16, 12]} />
      </mesh>
      {/* cheekbones */}
      {[-1, 1].map((s) => (
        <mesh key={`c${s}`} position={[s * 0.05, 0.095, 0.06]} scale={[1, 0.7, 0.8]} material={cheekMat}>
          <sphereGeometry args={[0.03, 10, 8]} />
        </mesh>
      ))}
      {/* ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.094, 0.11, -0.005]} scale={[0.45, 1, 0.75]} material={faceMat}>
          <sphereGeometry args={[0.026, 8, 8]} />
        </mesh>
      ))}
      {/* nose */}
      <mesh position={[0, 0.098, 0.101]} rotation={[0.25, 0, 0]} material={faceMat}>
        <boxGeometry args={[0.018, 0.04, 0.022]} />
      </mesh>
      {/* eyes */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.036, 0.128, 0.087]}>
          <mesh>
            <sphereGeometry args={[0.0155, 10, 8]} />
            <meshBasicMaterial color="#f5f5f5" />
          </mesh>
          <mesh position={[0, 0, 0.011]}>
            <sphereGeometry args={[0.0085, 8, 8]} />
            <meshBasicMaterial color="#2b1b12" />
          </mesh>
          <mesh position={[0, 0.026, 0.008]} rotation={[0, 0, s * -0.12]}>
            <boxGeometry args={[0.036, 0.007, 0.01]} />
            <meshBasicMaterial color={look.mustache ?? look.hair} />
          </mesh>
        </group>
      ))}
      {/* mouth */}
      <mesh position={[0, 0.064, 0.094]} rotation={[0.25, 0, Math.PI]}>
        <torusGeometry args={[0.02, 0.0045, 4, 10, Math.PI]} />
        <meshBasicMaterial color={f ? '#c0485a' : '#7a3b2e'} />
      </mesh>
      {look.beard && (
        <mesh position={[0, 0.058, 0.018]} scale={[1.04, 0.8, 1]}>
          <sphereGeometry args={[0.084, 14, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
          <meshStandardMaterial color={look.beard} roughness={0.95} />
        </mesh>
      )}
      {look.mustache && (
        <mesh position={[0, 0.078, 0.097]}>
          <boxGeometry args={[0.05, 0.012, 0.014]} />
          <meshStandardMaterial color={look.mustache} roughness={0.95} />
        </mesh>
      )}
      <Hair look={look} hairM={hairM} tail={tail} />
      {look.cap && (
        <>
          <mesh position={[0, 0.15, -0.005]} scale={[0.95, 0.9, 1]}>
            <sphereGeometry args={[0.112, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={look.cap} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.155, 0.1]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.17, 0.012, 0.1]} />
            <meshStandardMaterial color={look.cap} roughness={0.7} />
          </mesh>
        </>
      )}
      {look.headphones && (
        <>
          <mesh position={[0, 0.13, 0]}>
            <torusGeometry args={[0.112, 0.009, 6, 20, Math.PI]} />
            <meshStandardMaterial color="#222" roughness={0.4} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.105, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.032, 0.032, 0.03, 14]} />
              <meshStandardMaterial color={look.scrunchie ?? '#ff8fab'} roughness={0.4} />
            </mesh>
          ))}
        </>
      )}
    </>
  )
}

function Hair({
  look,
  hairM,
  tail,
}: {
  look: CharacterLook
  hairM: React.ReactElement
  tail: React.RefObject<THREE.Group | null>
}) {
  const cap = (r: number, theta: number, y = 0.135) => (
    <mesh position={[0, y, -0.008]} rotation={[-0.4, 0, 0]} scale={[0.92, 1.05, 1]}>
      <sphereGeometry args={[r, 16, 12, 0, Math.PI * 2, 0, theta]} />
      {hairM}
    </mesh>
  )
  const nape = (
    <mesh position={[0, 0.1, -0.03]} scale={[0.9, 1, 0.85]}>
      <sphereGeometry args={[0.104, 14, 12]} />
      {hairM}
    </mesh>
  )
  switch (look.hairStyle) {
    case 'bald':
      return null
    case 'buzz':
      return cap(0.109, 1.35)
    case 'long':
      return (
        <>
          {cap(0.113, 1.6)}
          {nape}
          <mesh position={[0, 0.02, -0.07]} scale={[1.6, 1, 0.6]}>
            <capsuleGeometry args={[0.055, 0.16, 4, 8]} />
            {hairM}
          </mesh>
        </>
      )
    case 'ponytail':
      return (
        <>
          {cap(0.113, 1.6)}
          {nape}
          <group ref={tail} position={[0, 0.17, -0.1]}>
            <mesh position={[0, -0.09, -0.02]}>
              <capsuleGeometry args={[0.03, 0.15, 4, 8]} />
              {hairM}
            </mesh>
            {look.scrunchie && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.028, 0.012, 6, 12]} />
                <meshStandardMaterial color={look.scrunchie} />
              </mesh>
            )}
          </group>
        </>
      )
    case 'bun':
      return (
        <>
          {cap(0.113, 1.6)}
          {nape}
          <mesh position={[0, 0.24, -0.05]}>
            <sphereGeometry args={[0.048, 12, 10]} />
            {hairM}
          </mesh>
        </>
      )
    default:
      return (
        <>
          {cap(0.112, 1.45, 0.14)}
          <mesh position={[0, 0.11, -0.03]} scale={[0.9, 0.95, 0.85]}>
            <sphereGeometry args={[0.104, 14, 12, 0, Math.PI * 2, 0, 2.0]} />
            {hairM}
          </mesh>
        </>
      )
  }
}
