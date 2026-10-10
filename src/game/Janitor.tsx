import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { Doll, type RepSignal } from './Doll'
import { MOP_SWING } from './motions'
import { useGame } from '../core/store'
import type { CharacterLook, Pose, StationId } from '../core/types'

const LOOK: CharacterLook = {
  build: 'female',
  skin: '#b07a52',
  hair: '#4a4a4a',
  hairStyle: 'bun',
  top: '#3d7ea6',
  topStyle: 'tee',
  bottom: '#2f3e46',
  bottomStyle: 'joggers',
  shoes: '#2b2b2b',
  shoeStripe: '#3d7ea6',
  socks: '#2b2b2b',
  height: 0.9,
  muscle: 0.12,
  scrunchie: '#e9c46a',
}

/** Aisle between the machines and the front of the gym, walked back and forth. */
const FROM = -4.2
const TO = 3.6
const Z = 0.35
const SPEED = 0.28
const TURN_SECONDS = 1.2

/** The cleaning lady: mops the aisle back and forth with her bucket, all day long. */
export function Janitor() {
  const office = useGame((s) => s.office)
  if (office) return null
  return <JanitorBody />
}

function JanitorBody() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const mop = useRef<THREE.Group>(null)
  const poseRef = useRef<Pose>('mop')
  const styleRef = useRef<StationId | null>(null)
  const repRef = useRef<RepSignal>({ start: -1e9, quality: 'good' })
  const st = useRef({ t: 0, x: FROM, dir: 1, turnUntil: 0 })

  useLayoutEffect(() => {
    body.current?.traverse((o) => {
      o.castShadow = false
    })
  }, [])

  useFrame((_, dt) => {
    const s = st.current
    s.t += dt
    const turning = s.t < s.turnUntil
    if (!turning) {
      s.x += s.dir * SPEED * dt
      if (s.x > TO || s.x < FROM) {
        s.x = Math.min(TO, Math.max(FROM, s.x))
        s.dir = -s.dir
        s.turnUntil = s.t + TURN_SECONDS
      }
    }
    const face = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2
    if (root.current) {
      root.current.position.set(s.x, 0, Z)
      const r = root.current.rotation
      r.y += (face - r.y) * Math.min(1, dt * 3)
    }
    if (mop.current) mop.current.rotation.y = Math.sin(s.t * MOP_SWING) * 0.45
  })

  return (
    <group ref={root} position={[FROM, 0, Z]}>
      <group ref={body}>
        <Doll look={LOOK} poseRef={poseRef} styleRef={styleRef} repRef={repRef} position={[0, 0, 0]} />
      </group>
      {/* Mop: pivots at the hands and sweeps the head across the floor. */}
      <group ref={mop} position={[0, 0.88, 0.32]}>
        <mesh position={[0, -0.42, 0.24]} rotation={[0.52, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 1.0, 6]} />
          <meshStandardMaterial color="#c9a26b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.84, 0.47]}>
          <boxGeometry args={[0.36, 0.05, 0.1]} />
          <meshStandardMaterial color="#d9d4c7" roughness={1} />
        </mesh>
      </group>
      <group position={[-0.55, 0, 0.45]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.17, 0.14, 0.3, 12]} />
          <meshStandardMaterial color="#f4c430" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 12]} />
          <meshStandardMaterial color="#7fa7b8" roughness={0.1} metalness={0.2} />
        </mesh>
      </group>
    </group>
  )
}
