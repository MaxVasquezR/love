import { forwardRef, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterLook, Pose, RepQuality, StationId } from '../core/types'

export interface RepSignal {
  start: number
  quality: RepQuality
}

type Props = {
  look: CharacterLook
  poseRef: React.MutableRefObject<Pose>
  styleRef: React.MutableRefObject<StationId | null>
  repRef?: React.MutableRefObject<RepSignal>
  position: [number, number, number]
}

const REP_SECONDS = 0.6
const damp = THREE.MathUtils.damp

export const Doll = forwardRef<THREE.Group, Props>(function Doll(
  { look, poseRef, styleRef, repRef, position },
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
  const handWeights = useRef<THREE.Group>(null)
  const handWeights2 = useRef<THREE.Group>(null)
  const backBar = useRef<THREE.Group>(null)
  const t = useRef(0)

  const b = look.bulk

  useFrame((_, dt) => {
    t.current += dt
    const time = t.current
    const pose = poseRef.current
    const style = styleRef.current

    let phase = 0
    let shake = 0
    if (repRef) {
      const elapsed = (performance.now() - repRef.current.start) / 1000
      if (elapsed >= 0 && elapsed < REP_SECONDS) {
        const miss = repRef.current.quality === 'miss'
        phase = Math.sin((Math.PI * elapsed) / REP_SECONDS) * (miss ? 0.5 : 1)
        if (miss) shake = Math.sin(time * 70) * 0.06
      }
    }
    const breathe = Math.sin(time * 2.4) * 0.03

    let hipY = 0, hipRotX = 0, torsoRotX = 0, headRotX = 0, headRotY = 0
    let lArmX = 0.15, rArmX = -0.1, lArmZ = 0.12, rArmZ = -0.12
    let lForeX = 0.1, rForeX = 0.1
    let lThighX = 0, rThighX = 0, lCalfX = 0.05, rCalfX = 0.05
    let lFootX = 0, rFootX = 0, sway = 0

    const lifting = pose === 'lift'
    const showHand = lifting && style !== 'legs'
    const showBack = lifting && style === 'legs'
    if (handWeights.current) handWeights.current.visible = showHand
    if (handWeights2.current) handWeights2.current.visible = showHand
    if (backBar.current) backBar.current.visible = showBack

    if (pose === 'walk') {
      const s = Math.sin(time * 12)
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
      headRotY = Math.cos(time * 12) * 0.12
    } else if (lifting && style === 'legs') {
      const depth = phase + 0.05 + breathe * 0.3
      hipY = -depth * 0.72
      hipRotX = depth * 0.42
      torsoRotX = depth * 0.55
      lThighX = rThighX = depth * 1.55
      lCalfX = rCalfX = depth * 1.25
      lFootX = rFootX = -depth * 0.28
      lArmX = rArmX = -2.6
      lArmZ = 0.5
      rArmZ = -0.5
      lForeX = rForeX = 1.9
      headRotX = -depth * 0.2
      sway = shake
    } else if (lifting && style === 'pull') {
      const pull = phase
      hipRotX = 0.72
      torsoRotX = 0.48
      hipY = -0.12 + breathe
      lThighX = 0.22
      rThighX = 0.18
      lCalfX = rCalfX = 0.12
      lArmX = rArmX = 0.15 - pull * 1.75
      lForeX = rForeX = 0.25 + pull * 1.05
      lArmZ = 0.25
      rArmZ = -0.25
      headRotX = 0.22
      sway = shake
    } else if (lifting) {
      const press = phase
      torsoRotX = 0.08 - press * 0.12
      lThighX = rThighX = 0.08
      lArmX = rArmX = -0.75 - press * 1.6
      lForeX = rForeX = 1.5 - press * 1.4
      lArmZ = 0.45 - press * 0.2
      rArmZ = -0.45 + press * 0.2
      hipY = breathe
      headRotX = -0.08
      lCalfX = rCalfX = 0.08 + press * 0.05
      sway = shake
    } else if (pose === 'cheer') {
      hipY = Math.abs(Math.sin(time * 10)) * 0.22
      lArmX = rArmX = -2.55
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
      hipY = breathe
    } else if (pose === 'clap') {
      const c = Math.sin(time * 16)
      lArmX = rArmX = -1.25
      lArmZ = -0.15 + c * 0.35
      rArmZ = 0.15 - c * 0.35
      lForeX = rForeX = 0.6
      hipY = Math.abs(c) * 0.04
      headRotX = -0.1
    } else if (pose === 'point') {
      rArmX = -1.55 + Math.sin(time * 5) * 0.08
      rArmZ = -0.25
      rForeX = 0.1
      lArmZ = 0.65
      lForeX = 1.4
      headRotY = -0.25
      hipY = breathe
    } else {
      hipY = breathe
      torsoRotX = breathe * 1.5
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

    const k = lifting ? 22 : 12
    const rot = (g: THREE.Group | null, axis: 'x' | 'z', v: number) => {
      if (g) g.rotation[axis] = damp(g.rotation[axis], v, k, dt)
    }
    if (hips.current) hips.current.position.y = damp(hips.current.position.y, hipY, k, dt)
    rot(hips.current, 'x', hipRotX)
    rot(hips.current, 'z', sway)
    rot(torso.current, 'x', torsoRotX)
    rot(head.current, 'x', headRotX)
    if (head.current) head.current.rotation.y = damp(head.current.rotation.y, headRotY, k, dt)
    rot(lArm.current, 'x', lArmX)
    rot(lArm.current, 'z', lArmZ)
    rot(rArm.current, 'x', rArmX)
    rot(rArm.current, 'z', rArmZ)
    rot(lFore.current, 'x', lForeX)
    rot(rFore.current, 'x', rForeX)
    rot(lThigh.current, 'x', lThighX)
    rot(rThigh.current, 'x', rThighX)
    rot(lCalf.current, 'x', lCalfX)
    rot(rCalf.current, 'x', rCalfX)
    rot(lFoot.current, 'x', lFootX)
    rot(rFoot.current, 'x', rFootX)
  })

  const mat = (color: string, rough = 0.6) => <meshStandardMaterial color={color} roughness={rough} />

  const leg = (
    side: -1 | 1,
    thigh: React.RefObject<THREE.Group | null>,
    calf: React.RefObject<THREE.Group | null>,
    foot: React.RefObject<THREE.Group | null>,
  ) => (
    <group ref={thigh} position={[0.14 * side * b, -0.05, 0]}>
      <mesh position={[0, -0.28, 0]} castShadow>
        <capsuleGeometry args={[0.1 * b, 0.32, 3, 6]} />
        {mat(look.pants)}
      </mesh>
      <group ref={calf} position={[0, -0.52, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.08 * b, 0.28, 3, 6]} />
          {mat(look.pants)}
        </mesh>
        {look.kneeSleeves && (
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.1 * b, 0.1 * b, 0.16, 10]} />
            {mat('#111111', 0.9)}
          </mesh>
        )}
        <group ref={foot} position={[0, -0.42, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.09, 0.3]} />
            {mat(look.shoes, 0.5)}
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.17, 0.025, 0.31]} />
            {mat('#f8f9fa', 0.8)}
          </mesh>
        </group>
      </group>
    </group>
  )

  const arm = (
    side: -1 | 1,
    upper: React.RefObject<THREE.Group | null>,
    fore: React.RefObject<THREE.Group | null>,
    weights: React.RefObject<THREE.Group | null>,
  ) => (
    <group ref={upper} position={[0.34 * side * b, 0.55, 0]}>
      <mesh position={[0, -0.22, 0]} castShadow>
        <capsuleGeometry args={[0.075 * b, 0.26, 3, 6]} />
        {mat(look.skin, 0.45)}
      </mesh>
      <group ref={fore} position={[0, -0.42, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.065 * b, 0.22, 3, 6]} />
          {mat(look.skin, 0.45)}
        </mesh>
        <mesh position={[0, -0.34, 0]} castShadow>
          <sphereGeometry args={[0.07, 8, 8]} />
          {mat(look.skin, 0.45)}
        </mesh>
        {look.watch && side === -1 && (
          <mesh position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.07, 0.018, 6, 12]} />
            <meshStandardMaterial color="#c8f542" metalness={0.5} />
          </mesh>
        )}
        {look.wristStraps && (
          <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.07, 0.02, 6, 12]} />
            {mat('#e63946')}
          </mesh>
        )}
        <group ref={weights} position={[0, -0.36, 0.02]} visible={false}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 8]} />
            <meshStandardMaterial color="#cfd2d4" metalness={0.7} roughness={0.25} />
          </mesh>
          {[-0.17, 0.17].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.07, 12]} />
              {mat('#1a1a1a', 0.4)}
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )

  return (
    <group ref={ref} position={position} scale={look.scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.48, 14]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} />
      </mesh>

      <group ref={hips} position={[0, 0.95, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42 * b, 0.22, 0.28 * b]} />
          {mat(look.pants, 0.65)}
        </mesh>
        {look.belt && (
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26 * b, 0.05, 6, 18]} />
            {mat('#3d2b1f', 0.8)}
          </mesh>
        )}

        {leg(-1, lThigh, lCalf, lFoot)}
        {leg(1, rThigh, rCalf, rFoot)}

        <group ref={torso} position={[0, 0.2, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <capsuleGeometry args={[0.26 * b, 0.4, 4, 10]} />
            {mat(look.top, 0.5)}
          </mesh>

          {look.whistle && (
            <>
              <mesh position={[0, 0.62, 0.05]} rotation={[0.25, 0, 0]}>
                <torusGeometry args={[0.2 * b, 0.012, 4, 16]} />
                {mat('#e63946')}
              </mesh>
              <mesh position={[0, 0.44, 0.28 * b]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.035, 0.035, 0.1, 8]} />
                <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
              </mesh>
            </>
          )}

          <group ref={backBar} position={[0, 0.72, -0.18]} visible={false}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 1.7, 10]} />
              <meshStandardMaterial color="#cfd2d4" metalness={0.75} roughness={0.2} />
            </mesh>
            {[-0.72, 0.72].map((x) => (
              <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
                {mat(x < 0 ? '#e63946' : '#e63946', 0.4)}
              </mesh>
            ))}
          </group>

          {arm(-1, lArm, lFore, handWeights)}
          {arm(1, rArm, rFore, handWeights2)}

          <group ref={head} position={[0, 0.85, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.3, 16, 16]} />
              {mat(look.skin, 0.4)}
            </mesh>
            <Hair look={look} />
            {look.beard && (
              <mesh position={[0, -0.12, 0.1]} scale={[1, 0.7, 0.9]}>
                <sphereGeometry args={[0.24, 12, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                {mat(look.beard, 0.9)}
              </mesh>
            )}
            {look.cap && (
              <>
                <mesh position={[0, 0.2, 0]}>
                  <sphereGeometry args={[0.31, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  {mat(look.cap)}
                </mesh>
                <mesh position={[0, 0.2, 0.28]} rotation={[0.15, 0, 0]}>
                  <boxGeometry args={[0.38, 0.03, 0.22]} />
                  {mat(look.cap)}
                </mesh>
              </>
            )}
            {look.headphones && (
              <>
                <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]}>
                  <torusGeometry args={[0.31, 0.022, 6, 18, Math.PI]} />
                  {mat('#222222')}
                </mesh>
                {[-0.3, 0.3].map((x) => (
                  <mesh key={x} position={[x, 0.02, 0]}>
                    <sphereGeometry args={[0.08, 10, 10]} />
                    {mat('#ff8fab')}
                  </mesh>
                ))}
              </>
            )}
            {[-0.09, 0.09].map((x) => (
              <mesh key={x} position={[x, 0.04, 0.27]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color="#1a1a1a" />
              </mesh>
            ))}
            {[-0.09, 0.09].map((x) => (
              <mesh key={`b${x}`} position={[x, 0.13, 0.26]} rotation={[0, 0, x < 0 ? 0.15 : -0.15]}>
                <boxGeometry args={[0.09, 0.018, 0.02]} />
                <meshBasicMaterial color={look.hair} />
              </mesh>
            ))}
            <mesh position={[0, -0.04, 0.275]} rotation={[0.3, 0, Math.PI]}>
              <torusGeometry args={[0.065, 0.014, 4, 10, Math.PI]} />
              <meshBasicMaterial color="#9c4a3a" />
            </mesh>
            {[-0.17, 0.17].map((x) => (
              <mesh key={`c${x}`} position={[x, -0.03, 0.22]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color="#f4a5ae" transparent opacity={0.45} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
})

function Hair({ look }: { look: CharacterLook }) {
  const m = <meshStandardMaterial color={look.hair} roughness={0.85} />
  switch (look.hairStyle) {
    case 'buzz':
      return (
        <mesh position={[0, 0.06, -0.01]} scale={[1.03, 0.85, 1.03]}>
          <sphereGeometry args={[0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {m}
        </mesh>
      )
    case 'long':
      return (
        <>
          <mesh position={[0, 0.16, -0.02]}>
            <sphereGeometry args={[0.31, 12, 12]} />
            {m}
          </mesh>
          {[-0.26, 0.26].map((x) => (
            <mesh key={x} position={[x, -0.08, 0]}>
              <capsuleGeometry args={[0.07, 0.34, 3, 6]} />
              {m}
            </mesh>
          ))}
        </>
      )
    case 'ponytail':
      return (
        <>
          <mesh position={[0, 0.15, -0.03]}>
            <sphereGeometry args={[0.31, 12, 12]} />
            {m}
          </mesh>
          <mesh position={[0, 0.02, -0.34]} rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.34, 3, 6]} />
            {m}
          </mesh>
          {look.scrunchie && (
            <mesh position={[0, 0.2, -0.28]} rotation={[0.9, 0, 0]}>
              <torusGeometry args={[0.07, 0.03, 6, 10]} />
              <meshStandardMaterial color={look.scrunchie} />
            </mesh>
          )}
        </>
      )
    case 'bun':
      return (
        <>
          <mesh position={[0, 0.14, -0.03]}>
            <sphereGeometry args={[0.31, 12, 12]} />
            {m}
          </mesh>
          <mesh position={[0, 0.38, -0.12]}>
            <sphereGeometry args={[0.13, 10, 10]} />
            {m}
          </mesh>
        </>
      )
    default:
      return (
        <mesh position={[0, 0.15, -0.03]}>
          <sphereGeometry args={[0.29, 12, 12]} />
          {m}
        </mesh>
      )
  }
}
