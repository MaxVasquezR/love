import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Doll, type RepSignal } from './Doll'
import { GymWorld, STATION_POS } from './GymWorld'
import { COACH_LOOK } from '../data/characters'
import type { CharacterLook, Pose, StationId } from '../core/types'

export type SceneId = 'select' | 'hub' | 'training'
export type ActorId = 'player' | 'coach'
export type BubbleAnchors = React.MutableRefObject<Record<ActorId, HTMLDivElement | null>>

type Props = {
  scene: SceneId
  playerLook: CharacterLook
  playerPose: Pose
  coachPose: Pose
  station: StationId | null
  repRef: React.MutableRefObject<RepSignal>
  anchors: BubbleAnchors
}

type Spot = { pos: [number, number, number]; face: number | 'spin' }

function spots(scene: SceneId, station: StationId | null): Record<ActorId, Spot> {
  if (scene === 'select') {
    return {
      player: { pos: [0, 0, 2.6], face: 'spin' },
      coach: { pos: [2.3, 0, 1.4], face: -0.6 },
    }
  }
  if (scene === 'training' && station) {
    const [x, , z] = STATION_POS[station]
    return {
      player: { pos: [x, 0, z + 1.05], face: 0 },
      coach: { pos: [x + 1.45, 0, z + 1.5], face: -0.9 },
    }
  }
  return {
    player: { pos: [-0.8, 0, 1.8], face: 0.35 },
    coach: { pos: [0.95, 0, 1.8], face: -0.35 },
  }
}

const tmp = new THREE.Vector3()

function Actors({ scene, playerLook, playerPose, coachPose, station, repRef, anchors }: Props) {
  const player = useRef<THREE.Group>(null)
  const coach = useRef<THREE.Group>(null)
  const playerPoseRef = useRef<Pose>('idle')
  const coachPoseRef = useRef<Pose>('idle')
  const styleRef = useRef<StationId | null>(null)
  const coachStyle = useRef<StationId | null>(null)
  const idleRep = useRef<RepSignal>({ start: -1e9, quality: 'good' })
  const { camera, size } = useThree()

  styleRef.current = station

  useFrame((state, delta) => {
    const target = spots(scene, station)
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
    project('player', player.current, 2.45 * playerLook.scale)
    project('coach', coach.current, 2.55 * COACH_LOOK.scale)
  })

  const start = spots(scene, station)
  return (
    <>
      <Doll
        ref={player}
        look={playerLook}
        poseRef={playerPoseRef}
        styleRef={styleRef}
        repRef={repRef}
        position={start.player.pos}
      />
      <Doll
        ref={coach}
        look={COACH_LOOK}
        poseRef={coachPoseRef}
        styleRef={coachStyle}
        repRef={idleRep}
        position={start.coach.pos}
      />
    </>
  )
}

function CameraRig({ scene, station }: { scene: SceneId; station: StationId | null }) {
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  useFrame((state) => {
    const aspect = state.size.width / Math.max(1, state.size.height)
    // Portrait phones: pull the camera back so both actors fit above the dock.
    const zoom = aspect < 1 ? THREE.MathUtils.clamp(0.95 / aspect, 1, 1.85) : 1
    if (scene === 'select') {
      pos.current.set(0.4, 2.3, 6.4)
      look.current.set(0.4, 1.25, 2.4)
    } else if (scene === 'training' && station) {
      const [x, , z] = STATION_POS[station]
      pos.current.set(x * 0.75 + 0.6, 3.3, z + 6.2)
      look.current.set(x + 0.6, 1.15, z + 1.2)
    } else {
      pos.current.set(0, 3.4, 7.6)
      look.current.set(0, 1.25, 1.4)
    }
    if (zoom > 1) {
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
      <CameraRig scene={props.scene} station={props.station} />
      <GymWorld activeStations={props.station ? [props.station] : []} />
      <Actors {...props} />
    </Canvas>
  )
}
