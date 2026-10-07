import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { signTexture } from './brandTextures'
import { BRAND_ORANGE } from './brandArt'

type Props = {
  position: [number, number, number]
  width?: number
}

/** Neon "BONNETTY FITNESS" sign with the muscleman logo; flickers now and then like a real tube sign. */
export function BrandSign({ position, width = 3.4 }: Props) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const flicker = useRef({ until: 0, next: 3 })
  const height = width * 0.75

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const f = flicker.current
    if (t > f.next) {
      f.until = t + 0.08 + Math.random() * 0.25
      f.next = t + 4 + Math.random() * 7
    }
    const on = t > f.until || Math.sin(t * 90) > 0.3
    const glow = on ? 1 : 0.35
    if (mat.current) mat.current.color.setScalar(glow)
    if (light.current) light.current.intensity = 7 * glow
  })

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[width * 1.08, height * 1.06, 0.05]} />
        <meshStandardMaterial color="#0c0a08" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={mat} map={signTexture()} transparent toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0, 0.8]} color={BRAND_ORANGE} intensity={7} distance={6} />
    </group>
  )
}
