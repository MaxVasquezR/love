import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Doll } from './Doll'
import { GymWorld, STATION_POS, WAIT_POS } from './GymWorld'
import type {
  DollPose,
  OutfitId,
  PlayerId,
  StationId,
} from '../types'

export type SceneMode = 'lobby' | 'walk' | 'lift' | 'celebrate' | 'idle'

export type ActorPlan = {
  stationId: StationId | null
  pose: DollPose
}

type Props = {
  mode: SceneMode
  outfits: Record<PlayerId, OutfitId>
  plans: Record<PlayerId, ActorPlan>
  onArrived?: () => void
  onBubblePositions?: (
    pos: Record<PlayerId, { x: number; y: number; visible: boolean }>,
  ) => void
}

function approach(
  group: THREE.Group,
  target: [number, number, number],
  speed: number,
) {
  const dx = target[0] - group.position.x
  const dz = target[2] - group.position.z
  const dist = Math.hypot(dx, dz)
  if (dist < 0.07) {
    group.position.x = target[0]
    group.position.z = target[2]
    return 0
  }
  const step = Math.min(1, speed / dist)
  group.position.x += dx * step
  group.position.z += dz * step
  group.rotation.y = Math.atan2(dx, dz)
  return dist
}

function Actors({
  mode,
  outfits,
  plans,
  onArrived,
  onBubblePositions,
}: Omit<Props, 'bubbles'>) {
  const maxRef = useRef<THREE.Group>(null)
  const anaRef = useRef<THREE.Group>(null)
  const poseMax = useRef<DollPose>('idle')
  const poseAna = useRef<DollPose>('idle')
  const styleMax = useRef<StationId | null>(null)
  const styleAna = useRef<StationId | null>(null)
  const arrived = useRef({ max: false, ana: false })
  const firedArrive = useRef(false)
  const onArrivedRef = useRef(onArrived)
  const onBubblesRef = useRef(onBubblePositions)
  onArrivedRef.current = onArrived
  onBubblesRef.current = onBubblePositions
  const { camera, size } = useThree()

  useEffect(() => {
    arrived.current = { max: false, ana: false }
    firedArrive.current = false
  }, [mode, plans.max.stationId, plans.ana.stationId])

  useFrame((_, delta) => {
    const speed = 3.4 * delta
    const refs = { max: maxRef, ana: anaRef }
    const poses = { max: poseMax, ana: poseAna }
    const styles = { max: styleMax, ana: styleAna }

    ;(['max', 'ana'] as PlayerId[]).forEach((p) => {
      const plan = plans[p]
      styles[p].current = plan.stationId
      const g = refs[p].current
      if (!g) return

      if (mode === 'lobby' || mode === 'idle' || !plan.stationId) {
        const dist = approach(g, WAIT_POS[p], speed)
        poses[p].current = dist > 0.12 ? 'walk' : plan.pose === 'wave' ? 'wave' : 'idle'
        return
      }

      const base = STATION_POS[plan.stationId]
      // stand in front of machine, slightly offset so both visible
      const side = p === 'max' ? -0.15 : 0.15
      const target: [number, number, number] = [
        base[0] + side,
        0,
        base[2] + 0.95,
      ]

      if (mode === 'walk') {
        const dist = approach(g, target, speed)
        poses[p].current = dist > 0.12 ? 'walk' : 'idle'
        if (dist <= 0.08) arrived.current[p] = true
        if (
          arrived.current.max &&
          arrived.current.ana &&
          !firedArrive.current
        ) {
          firedArrive.current = true
          onArrivedRef.current?.()
        }
      } else if (mode === 'lift') {
        approach(g, target, speed * 1.2)
        g.rotation.y = Math.PI
        poses[p].current = 'lift'
      } else if (mode === 'celebrate') {
        approach(g, target, speed)
        poses[p].current = 'cheer'
      } else {
        poses[p].current = plan.pose
      }
    })

    // project head positions for speech bubbles
    if (onBubblesRef.current) {
      const out: Record<PlayerId, { x: number; y: number; visible: boolean }> = {
        max: { x: 0, y: 0, visible: false },
        ana: { x: 0, y: 0, visible: false },
      }
      ;(['max', 'ana'] as PlayerId[]).forEach((p) => {
        const g = refs[p].current
        if (!g) return
        const v = new THREE.Vector3(
          g.position.x,
          g.position.y + 2.35,
          g.position.z,
        )
        v.project(camera)
        const x = (v.x * 0.5 + 0.5) * size.width
        const y = (-v.y * 0.5 + 0.5) * size.height
        out[p] = {
          x,
          y,
          visible: v.z < 1,
        }
      })
      onBubblesRef.current(out)
    }
  })

  return (
    <>
      <Doll
        ref={maxRef}
        player="max"
        outfit={outfits.max}
        poseRef={poseMax}
        liftStyleRef={styleMax}
        position={WAIT_POS.max}
      />
      <Doll
        ref={anaRef}
        player="ana"
        outfit={outfits.ana}
        poseRef={poseAna}
        liftStyleRef={styleAna}
        position={WAIT_POS.ana}
      />
    </>
  )
}

function CameraRig({
  mode,
  focusStations,
}: {
  mode: SceneMode
  focusStations: StationId[]
}) {
  useFrame((state) => {
    let lookX = 0
    if (focusStations.length) {
      lookX =
        focusStations.reduce((a, id) => a + STATION_POS[id][0], 0) /
        focusStations.length
    }
    const desired =
      mode === 'lobby'
        ? new THREE.Vector3(0, 5.6, 8.2)
        : new THREE.Vector3(lookX * 0.4, 6.2, 8.6)
    const look =
      mode === 'lobby'
        ? new THREE.Vector3(0, 1.35, 0.2)
        : new THREE.Vector3(lookX, 1.35, -0.9)
    state.camera.position.lerp(desired, 0.045)
    state.camera.lookAt(look)
  })
  return null
}

export function GameCanvas({
  mode,
  outfits,
  plans,
  onArrived,
  onBubblePositions,
}: Props) {
  const focusStations = useMemo(() => {
    const ids: StationId[] = []
    if (plans.max.stationId) ids.push(plans.max.stationId)
    if (plans.ana.stationId) ids.push(plans.ana.stationId)
    return ids
  }, [plans])

  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [0, 6.4, 9], fov: 42, near: 0.1, far: 50 }}
      gl={{ antialias: true, powerPreference: 'low-power', alpha: false }}
    >
      <color attach="background" args={['#1a1511']} />
      <fog attach="fog" args={['#1a1511', 14, 32]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow
        position={[5, 11, 5]}
        intensity={1.25}
        shadow-mapSize={[512, 512]}
      />
      <hemisphereLight args={['#ffe8d6', '#2a221c', 0.4]} />
      <CameraRig mode={mode} focusStations={focusStations} />
      <GymWorld
        activeStation={null}
        activeStations={focusStations}
      />
      <Actors
        mode={mode}
        outfits={outfits}
        plans={plans}
        onArrived={onArrived}
        onBubblePositions={onBubblePositions}
      />
    </Canvas>
  )
}
