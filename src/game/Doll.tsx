import { forwardRef, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DollPose, OutfitId, PlayerId, StationId } from '../types'

type Props = {
  player: PlayerId
  outfit: OutfitId
  poseRef: React.MutableRefObject<DollPose>
  liftStyleRef: React.MutableRefObject<StationId | null>
  position: [number, number, number]
}

const OUTFITS: Record<
  OutfitId,
  { max: string; ana: string; pantsMax: string; pantsAna: string }
> = {
  classic: {
    max: '#2d6a4f',
    ana: '#e85d75',
    pantsMax: '#1b4332',
    pantsAna: '#22223b',
  },
  street: {
    max: '#1d3557',
    ana: '#9b5de5',
    pantsMax: '#212529',
    pantsAna: '#240046',
  },
  date: {
    max: '#457b9d',
    ana: '#f4a261',
    pantsMax: '#264653',
    pantsAna: '#6d597a',
  },
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

export const Doll = forwardRef<THREE.Group, Props>(function Doll(
  { player, outfit, poseRef, liftStyleRef, position },
  ref,
) {
  const hips = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const lArm = useRef<THREE.Group>(null)
  const rArm = useRef<THREE.Group>(null)
  const lFore = useRef<THREE.Group>(null)
  const rFore = useRef<THREE.Group>(null)
  const lThigh = useRef<THREE.Group>(null)
  const rThigh = useRef<THREE.Group>(null)
  const lCalf = useRef<THREE.Group>(null)
  const rCalf = useRef<THREE.Group>(null)
  const lFoot = useRef<THREE.Group>(null)
  const rFoot = useRef<THREE.Group>(null)
  const t = useRef(0)

  const isMax = player === 'max'
  const hair = isMax ? '#b8956c' : '#f2d04b'
  const top = isMax ? OUTFITS[outfit].max : OUTFITS[outfit].ana
  const pants = isMax ? OUTFITS[outfit].pantsMax : OUTFITS[outfit].pantsAna
  const skin = '#f0c9a8'
  const scale = isMax ? 1.05 : 0.98

  useFrame((_, dt) => {
    t.current += dt
    const pose = poseRef.current
    const style = liftStyleRef.current
    const time = t.current

    // targets
    let hipY = 0
    let hipRotX = 0
    let torsoRotX = 0
    let headRotX = 0
    let headRotY = 0
    let lArmX = 0.15
    let rArmX = -0.1
    let lArmZ = 0.12
    let rArmZ = -0.12
    let lForeX = 0.1
    let rForeX = 0.1
    let lThighX = 0
    let rThighX = 0
    let lCalfX = 0.05
    let rCalfX = 0.05
    let lFootX = 0
    let rFootX = 0
    let sway = 0

    if (pose === 'walk') {
      const s = Math.sin(time * 12)
      const c = Math.cos(time * 12)
      hipY = Math.abs(s) * 0.14
      sway = s * 0.12
      lThighX = s * 1.05
      rThighX = -s * 1.05
      lCalfX = Math.max(0.08, -s * 0.95)
      rCalfX = Math.max(0.08, s * 0.95)
      lFootX = s > 0.1 ? -0.35 : 0.2
      rFootX = s < -0.1 ? -0.35 : 0.2
      lArmX = -s * 1.15
      rArmX = s * 1.15
      lForeX = 0.45
      rForeX = 0.45
      torsoRotX = -0.12
      headRotY = c * 0.12
    } else if (pose === 'lift' && style === 'legs') {
      // deep squat with pause feel
      const raw = Math.sin(time * 3.6)
      const depth = Math.pow((raw + 1) * 0.5, 1.15)
      hipY = -depth * 0.72
      hipRotX = depth * 0.42
      torsoRotX = depth * 0.55
      lThighX = depth * 1.55
      rThighX = depth * 1.55
      lCalfX = depth * 1.25
      rCalfX = depth * 1.25
      lFootX = -depth * 0.28
      rFootX = -depth * 0.28
      lArmX = -0.55 - depth * 0.35
      rArmX = -0.55 - depth * 0.35
      lArmZ = 0.45
      rArmZ = -0.45
      lForeX = 0.55
      rForeX = 0.55
      headRotX = -depth * 0.2
      sway = Math.sin(time * 7) * 0.02 * depth
    } else if (pose === 'lift' && style === 'pull') {
      const cycle = (Math.sin(time * 4.4) + 1) * 0.5
      hipRotX = 0.72
      torsoRotX = 0.48
      hipY = -0.12
      lThighX = 0.22
      rThighX = 0.18
      lCalfX = 0.12
      rCalfX = 0.12
      const pull = cycle
      lArmX = 0.15 - pull * 1.75
      rArmX = 0.15 - pull * 1.75
      lForeX = 0.25 + pull * 1.05
      rForeX = 0.25 + pull * 1.05
      lArmZ = 0.25
      rArmZ = -0.25
      headRotX = 0.22
      sway = Math.sin(time * 4.4) * 0.06
    } else if (pose === 'lift' && style === 'push') {
      const cycle = (Math.sin(time * 4.6) + 1) * 0.5
      const press = Math.pow(cycle, 0.9)
      torsoRotX = 0.08 - press * 0.12
      lThighX = 0.08
      rThighX = 0.08
      // chest press path: elbows out then lockout
      lArmX = -0.55 - press * 1.35
      rArmX = -0.55 - press * 1.35
      lForeX = 1.35 - press * 1.15
      rForeX = 1.35 - press * 1.15
      lArmZ = 0.45 - press * 0.15
      rArmZ = -0.45 + press * 0.15
      hipY = Math.sin(time * 4.6) * 0.045
      headRotX = -0.08
      // slight leg drive
      lCalfX = 0.08 + press * 0.05
      rCalfX = 0.08 + press * 0.05
    } else if (pose === 'cheer') {
      hipY = Math.abs(Math.sin(time * 10)) * 0.22
      lArmX = -2.55
      rArmX = -2.55
      lArmZ = 0.55
      rArmZ = -0.55
      lForeX = 0.15 + Math.sin(time * 14) * 0.2
      rForeX = 0.15 + Math.cos(time * 14) * 0.2
      lThighX = Math.sin(time * 10) * 0.35
      rThighX = -Math.sin(time * 10) * 0.35
      headRotY = Math.sin(time * 7) * 0.3
    } else if (pose === 'wave') {
      lArmX = -2.25
      lForeX = Math.sin(time * 14) * 0.65
      rArmX = 0.25
      rForeX = 0.2
      headRotY = 0.35
      hipY = Math.sin(time * 3.2) * 0.03
      torsoRotX = Math.sin(time * 3.2) * 0.04
    } else {
      // lively idle: weight shift, look around, bounce
      const b = Math.sin(time * 2.4)
      hipY = b * 0.035
      torsoRotX = b * 0.045
      lArmX = 0.25 + Math.sin(time * 1.9) * 0.12
      rArmX = -0.2 + Math.cos(time * 2.1) * 0.12
      lArmZ = 0.18
      rArmZ = -0.18
      lForeX = 0.25
      rForeX = 0.2
      headRotY = Math.sin(time * 1.15) * 0.22
      headRotX = Math.sin(time * 0.9) * 0.06
      lThighX = Math.sin(time * 1.5) * 0.1
      rThighX = -Math.sin(time * 1.5) * 0.1
      sway = Math.sin(time * 1.5) * 0.04
    }

    const k = 12
    if (hips.current) {
      hips.current.position.y = damp(hips.current.position.y, hipY, k, dt)
      hips.current.rotation.x = damp(hips.current.rotation.x, hipRotX, k, dt)
      hips.current.rotation.z = damp(hips.current.rotation.z, sway, k, dt)
    }
    if (torso.current)
      torso.current.rotation.x = damp(torso.current.rotation.x, torsoRotX, k, dt)
    if (head.current) {
      head.current.rotation.x = damp(head.current.rotation.x, headRotX, k, dt)
      head.current.rotation.y = damp(head.current.rotation.y, headRotY, k, dt)
    }
    if (lArm.current) {
      lArm.current.rotation.x = damp(lArm.current.rotation.x, lArmX, k, dt)
      lArm.current.rotation.z = damp(lArm.current.rotation.z, lArmZ, k, dt)
    }
    if (rArm.current) {
      rArm.current.rotation.x = damp(rArm.current.rotation.x, rArmX, k, dt)
      rArm.current.rotation.z = damp(rArm.current.rotation.z, rArmZ, k, dt)
    }
    if (lFore.current)
      lFore.current.rotation.x = damp(lFore.current.rotation.x, lForeX, k, dt)
    if (rFore.current)
      rFore.current.rotation.x = damp(rFore.current.rotation.x, rForeX, k, dt)
    if (lThigh.current)
      lThigh.current.rotation.x = damp(lThigh.current.rotation.x, lThighX, k, dt)
    if (rThigh.current)
      rThigh.current.rotation.x = damp(rThigh.current.rotation.x, rThighX, k, dt)
    if (lCalf.current)
      lCalf.current.rotation.x = damp(lCalf.current.rotation.x, lCalfX, k, dt)
    if (rCalf.current)
      rCalf.current.rotation.x = damp(rCalf.current.rotation.x, rCalfX, k, dt)
    if (lFoot.current)
      lFoot.current.rotation.x = damp(lFoot.current.rotation.x, lFootX, k, dt)
    if (rFoot.current)
      rFoot.current.rotation.x = damp(rFoot.current.rotation.x, rFootX, k, dt)
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.48, 12]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} />
      </mesh>

      <group ref={hips} position={[0, 0.95, 0]}>
        {/* pelvis */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.22, 0.28]} />
          <meshStandardMaterial color={pants} roughness={0.65} />
        </mesh>

        {/* left leg */}
        <group ref={lThigh} position={[-0.14, -0.05, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.32, 3, 6]} />
            <meshStandardMaterial color={pants} />
          </mesh>
          <group ref={lCalf} position={[0, -0.52, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.08, 0.28, 3, 6]} />
              <meshStandardMaterial color={pants} />
            </mesh>
            <group ref={lFoot} position={[0, -0.42, 0.04]}>
              <mesh castShadow>
                <boxGeometry args={[0.16, 0.09, 0.3]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          </group>
        </group>

        {/* right leg */}
        <group ref={rThigh} position={[0.14, -0.05, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.32, 3, 6]} />
            <meshStandardMaterial color={pants} />
          </mesh>
          <group ref={rCalf} position={[0, -0.52, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.08, 0.28, 3, 6]} />
              <meshStandardMaterial color={pants} />
            </mesh>
            <group ref={rFoot} position={[0, -0.42, 0.04]}>
              <mesh castShadow>
                <boxGeometry args={[0.16, 0.09, 0.3]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          </group>
        </group>

        {/* torso */}
        <group ref={torso} position={[0, 0.2, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <capsuleGeometry args={[0.26, 0.4, 4, 8]} />
            <meshStandardMaterial color={top} roughness={0.5} />
          </mesh>

          {/* arms */}
          <group ref={lArm} position={[-0.34, 0.55, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.26, 3, 6]} />
              <meshStandardMaterial color={skin} />
            </mesh>
            <group ref={lFore} position={[0, -0.42, 0]}>
              <mesh position={[0, -0.18, 0]} castShadow>
                <capsuleGeometry args={[0.065, 0.22, 3, 6]} />
                <meshStandardMaterial color={skin} />
              </mesh>
              <mesh position={[0, -0.34, 0]} castShadow>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial color={skin} />
              </mesh>
            </group>
          </group>

          <group ref={rArm} position={[0.34, 0.55, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.26, 3, 6]} />
              <meshStandardMaterial color={skin} />
            </mesh>
            <group ref={rFore} position={[0, -0.42, 0]}>
              <mesh position={[0, -0.18, 0]} castShadow>
                <capsuleGeometry args={[0.065, 0.22, 3, 6]} />
                <meshStandardMaterial color={skin} />
              </mesh>
              <mesh position={[0, -0.34, 0]} castShadow>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial color={skin} />
              </mesh>
            </group>
          </group>

          {/* head */}
          <group ref={head} position={[0, 0.85, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.3, 12, 12]} />
              <meshStandardMaterial color={skin} roughness={0.4} />
            </mesh>
            {isMax ? (
              <mesh position={[0, 0.16, -0.02]} castShadow>
                <sphereGeometry args={[0.28, 10, 10]} />
                <meshStandardMaterial color={hair} roughness={0.85} />
              </mesh>
            ) : (
              <>
                <mesh position={[0, 0.18, -0.02]} castShadow>
                  <sphereGeometry args={[0.3, 10, 10]} />
                  <meshStandardMaterial color={hair} roughness={0.8} />
                </mesh>
                <mesh position={[-0.26, -0.05, 0.02]} castShadow>
                  <capsuleGeometry args={[0.06, 0.28, 3, 5]} />
                  <meshStandardMaterial color={hair} />
                </mesh>
                <mesh position={[0.26, -0.05, 0.02]} castShadow>
                  <capsuleGeometry args={[0.06, 0.28, 3, 5]} />
                  <meshStandardMaterial color={hair} />
                </mesh>
                <mesh position={[0, 0.3, -0.02]}>
                  <torusGeometry args={[0.07, 0.025, 5, 8]} />
                  <meshStandardMaterial color="#ff8fab" />
                </mesh>
              </>
            )}
            <mesh position={[-0.09, 0.04, 0.26]}>
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.09, 0.04, 0.26]}>
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, -0.06, 0.27]} rotation={[0.3, 0, 0]}>
              <torusGeometry args={[0.06, 0.012, 4, 8, Math.PI]} />
              <meshBasicMaterial color="#c97b63" />
            </mesh>
            {!isMax && (
              <>
                <mesh position={[0, 0.02, 0]} rotation={[0.2, 0, 0]}>
                  <torusGeometry args={[0.28, 0.025, 6, 16]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[-0.28, 0.02, 0]}>
                  <sphereGeometry args={[0.07, 8, 8]} />
                  <meshStandardMaterial color="#ff8fab" />
                </mesh>
                <mesh position={[0.28, 0.02, 0]}>
                  <sphereGeometry args={[0.07, 8, 8]} />
                  <meshStandardMaterial color="#ff8fab" />
                </mesh>
              </>
            )}
          </group>

          {isMax && (
            <mesh position={[0.34, 0.45, 0.02]}>
              <torusGeometry args={[0.055, 0.014, 6, 10]} />
              <meshStandardMaterial color="#c8f542" metalness={0.6} />
            </mesh>
          )}
        </group>

        {isMax && (
          <mesh position={[0, 0.02, 0.02]}>
            <torusGeometry args={[0.3, 0.035, 6, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        )}
      </group>
    </group>
  )
})
