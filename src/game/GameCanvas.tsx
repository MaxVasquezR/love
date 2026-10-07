import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Doll, type RepSignal } from './Doll'
import { GymWorld } from './GymWorld'
import { RIGS } from './rigs'
import type { RigFocus } from './equipment/RigSet'
import { COACH_LOOK } from '../data/characters'
import type { CharacterLook, MuscleGroup, Pose, StationId } from '../core/types'

export type SceneId = 'select' | 'hub' | 'training'
export type ActorId = 'player' | 'coach'
export type BubbleAnchors = React.MutableRefObject<Record<ActorId, HTMLDivElement | null>>

type Props = {
  scene: SceneId
  playerLook: CharacterLook
  playerPose: Pose
  coachPose: Pose
  station: StationId | null
  focus: RigFocus | null
  repRef: React.MutableRefObject<RepSignal>
  anchors: BubbleAnchors
  /** Technique demo: the Profe takes the machine, the player watches. */
  demo: CoachDemoState | null
}

export type CoachDemoState = {
  rep: React.MutableRefObject<RepSignal>
  station: StationId
  highlight: readonly MuscleGroup[] | null
}

type Spot = { pos: [number, number, number]; face: number | 'spin' }

function spots(scene: SceneId, focus: RigFocus | null, lifting: boolean, demo: CoachDemoState | null, coachLifting: boolean): Record<ActorId, Spot> {
  if (scene === 'select') {
    return {
      player: { pos: [0, 0, 2.6], face: 'spin' },
      coach: { pos: [2.3, 0, 1.4], face: -0.6 },
    }
  }
  if (demo && focus) {
    const r = RIGS[focus.rig]
    const [x, z] = r.pos
    const px = x + r.coach[0]
    const pz = z + r.coach[1]
    return {
      coach: coachLifting ? { pos: [x, 0, z], face: r.face } : { pos: [x + r.wait[0], 0, z + r.wait[1]], face: 0.2 },
      player: { pos: [px, 0, pz], face: Math.atan2(x - px, z - pz) },
    }
  }
  if (scene === 'training' && focus) {
    const r = RIGS[focus.rig]
    const [x, z] = r.pos
    const cx = x + r.coach[0]
    const cz = z + r.coach[1]
    return {
      player: lifting
        ? { pos: [x, 0, z], face: r.face }
        : { pos: [x + r.wait[0], 0, z + r.wait[1]], face: 0.15 },
      coach: { pos: [cx, 0, cz], face: Math.atan2(x - cx, z - cz) },
    }
  }
  return {
    player: { pos: [-0.8, 0, 1.8], face: 0.35 },
    coach: { pos: [0.95, 0, 1.8], face: -0.35 },
  }
}

const tmp = new THREE.Vector3()

function Actors({ scene, playerLook, playerPose, coachPose, station, focus, repRef, anchors, demo }: Props) {
  const player = useRef<THREE.Group>(null)
  const coach = useRef<THREE.Group>(null)
  const playerPoseRef = useRef<Pose>('idle')
  const coachPoseRef = useRef<Pose>('idle')
  const styleRef = useRef<StationId | null>(null)
  const coachStyle = useRef<StationId | null>(null)
  const idleRep = useRef<RepSignal>({ start: -1e9, quality: 'good' })
  const { camera, size } = useThree()

  styleRef.current = station
  coachStyle.current = demo?.station ?? null

  useFrame((state, delta) => {
    const target = spots(scene, focus, playerPose === 'lift', demo, coachPose === 'lift')
    const speed = 3.6 * delta

    const drive = (
      g: THREE.Group | null,
      spot: Spot,
      poseRef: React.MutableRefObject<Pose>,
      wanted: Pose,
    ) => {
      if (!g) return
      const dx = spot.pos[0] - g.position.x
      const dz = spot.pos[2] - g.position.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0.08) {
        const step = Math.min(1, speed / dist)
        g.position.x += dx * step
        g.position.z += dz * step
        g.rotation.y = Math.atan2(dx, dz)
        poseRef.current = 'walk'
        return
      }
      g.position.x = spot.pos[0]
      g.position.z = spot.pos[2]
      const face = spot.face === 'spin' ? Math.sin(state.clock.elapsedTime * 0.7) * 0.6 : spot.face
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, face, 8, delta)
      poseRef.current = wanted
    }

    drive(player.current, target.player, playerPoseRef, playerPose)
    drive(coach.current, target.coach, coachPoseRef, coachPose)

    const project = (id: ActorId, g: THREE.Group | null, height: number) => {
      const el = anchors.current[id]
      if (!el || !g) return
      tmp.set(g.position.x, height, g.position.z).project(camera)
      const margin = Math.min(95, size.width * 0.25)
      const x = THREE.MathUtils.clamp((tmp.x * 0.5 + 0.5) * size.width, margin, size.width - margin)
      const y = Math.max(110, (-tmp.y * 0.5 + 0.5) * size.height)
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      el.style.visibility = tmp.z < 1 ? 'visible' : 'hidden'
    }
    project('player', player.current, 2.05 * playerLook.height)
    project('coach', coach.current, 2.1 * COACH_LOOK.height)
  })

  const start = spots(scene, focus, playerPose === 'lift', demo, coachPose === 'lift')
  return (
    <>
      <Doll
        ref={player}
        look={playerLook}
        poseRef={playerPoseRef}
        styleRef={styleRef}
        repRef={repRef}
        position={start.player.pos}
        drivesRig={!demo}
      />
      <Doll
        ref={coach}
        look={COACH_LOOK}
        poseRef={coachPoseRef}
        styleRef={coachStyle}
        repRef={demo ? demo.rep : idleRep}
        position={start.coach.pos}
        drivesRig={!!demo}
        highlight={demo?.highlight ?? null}
      />
    </>
  )
}

function CameraRig({ scene, focus }: { scene: SceneId; focus: RigFocus | null }) {
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  useFrame((state) => {
    const aspect = state.size.width / Math.max(1, state.size.height)
    // Portrait phones: pull the camera back so both actors fit above the dock.
    const zoom = aspect < 1 ? THREE.MathUtils.clamp(0.95 / aspect, 1, 1.85) : 1
    if (scene === 'select') {
      // Close-up on the athlete; on wide screens the coach fits beside them.
      const x = aspect < 1 ? 0 : 0.9
      pos.current.set(x, aspect < 1 ? 1.25 : 1.35, aspect < 1 ? 7.0 : 7.6)
      look.current.set(x, aspect < 1 ? 0.5 : 0.6, 2.6)
    } else if (scene === 'training' && focus) {
      const r = RIGS[focus.rig]
      const [x, z] = r.pos
      // Three-quarter view so hinges and squat depth read, not just a flat front.
      const side = x > 5.5 ? -1 : 1
      pos.current.set(x + side * 1.7 * r.dist, 2.15, z + 4.2 * r.dist)
      look.current.set(x + 0.1, r.lookY, z + 0.2)
    } else if (aspect >= 1) {
      // Lower, more frontal view so the whole neon sign fits above the actors.
      pos.current.set(0, 2.0, 7.6)
      look.current.set(0, 1.3, 1.4)
    } else {
      pos.current.set(0, 3.4, 7.6)
      look.current.set(0, 1.45, 1.4)
    }
    if (zoom > 1 && scene !== 'select') {
      pos.current.sub(look.current).multiplyScalar(zoom).add(look.current)
      // Shift the framing down so actors sit in the upper-middle, clear of the bottom dock.
      look.current.y -= 0.35 * (zoom - 1)
    }
    state.camera.position.lerp(pos.current, 0.05)
    state.camera.lookAt(look.current)
  })
  return null
}

export function GameCanvas(props: Props) {
  return (
    <Canvas
      className="game-canvas"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.4, 7.6], fov: 45, near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: 'low-power' }}
    >
      <color attach="background" args={['#241c16']} />
      <fog attach="fog" args={['#241c16', 16, 38]} />
      <ambientLight intensity={0.85} />
      <directionalLight castShadow position={[5, 11, 6]} intensity={1.6} shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={['#fff1e0', '#3a2e24', 0.7]} />
      <pointLight position={[0, 4.5, 2.5]} intensity={18} distance={14} color="#ffd9b0" />
      <CameraRig scene={props.demo ? 'training' : props.scene} focus={props.scene === 'training' || props.demo ? props.focus : null} />
      <GymWorld
        focus={props.scene === 'training' || props.demo ? props.focus : null}
        lifting={props.demo ? props.coachPose === 'lift' : props.playerPose === 'lift'}
      />
      <Actors {...props} />
    </Canvas>
  )
}
