import { labelTexture } from '../brandTextures'
import { platesPerSide, type PlateDef } from '../rigs'

const CHROME = <meshStandardMaterial color="#d4d7da" metalness={0.85} roughness={0.22} />
const HALF_PI = Math.PI / 2

export function Plate({ plate, x }: { plate: PlateDef; x: number }) {
  return (
    <group position={[x, 0, 0]} rotation={[0, 0, HALF_PI]}>
      <mesh castShadow>
        <cylinderGeometry args={[plate.radius, plate.radius, plate.width, 28]} />
        <meshStandardMaterial color={plate.color} roughness={0.55} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, plate.width + 0.006, 16]} />
        {CHROME}
      </mesh>
      {plate.radius > 0.2 && (
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[plate.radius - 0.012, 0.006, 4, 32]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}

/** Olympic bar (2.2 m, 20 kg) with real IWF plates for `kg` total. Axis along X. */
export function Barbell({ kg, bar = 20 }: { kg: number; bar?: number }) {
  const plates = platesPerSide(kg, bar)
  const stacks: { p: PlateDef; x: number }[] = []
  let x = 0.71
  for (const p of plates) {
    stacks.push({ p, x: x + p.width / 2 })
    x += p.width + 0.002
  }
  return (
    <group>
      <mesh rotation={[0, 0, HALF_PI]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 1.31, 10]} />
        {CHROME}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} scale={[s, 1, 1]}>
          <mesh position={[0.672, 0, 0]} rotation={[0, 0, HALF_PI]}>
            <cylinderGeometry args={[0.032, 0.032, 0.035, 14]} />
            {CHROME}
          </mesh>
          <mesh position={[0.9, 0, 0]} rotation={[0, 0, HALF_PI]}>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 12]} />
            {CHROME}
          </mesh>
          {stacks.map(({ p, x: px }, i) => (
            <Plate key={i} plate={p} x={px} />
          ))}
          {plates.length > 0 && (
            <mesh position={[x + 0.015, 0, 0]} rotation={[0, 0, HALF_PI]}>
              <cylinderGeometry args={[0.038, 0.038, 0.03, 12]} />
              <meshStandardMaterial color="#ff6b35" roughness={0.4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/** Hex dumbbell; axis along X. Heads grow with the weight and carry a kg sticker. */
export function Dumbbell({ kg, label = true }: { kg: number; label?: boolean }) {
  const r = 0.045 + Math.min(50, kg) * 0.0014
  const w = 0.055 + Math.min(50, kg) * 0.0014
  return (
    <group>
      <mesh rotation={[0, 0, HALF_PI]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.16, 8]} />
        {CHROME}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (0.08 + w / 2), 0, 0]}>
          <mesh rotation={[0, 0, HALF_PI]} castShadow>
            <cylinderGeometry args={[r, r, w, 6]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.6} />
          </mesh>
          {label && (
            <mesh position={[s * (w / 2 + 0.001), 0, 0]} rotation={[0, s * HALF_PI, 0]}>
              <circleGeometry args={[r * 0.62, 6]} />
              <meshBasicMaterial map={labelTexture(String(kg), '#1c1c1c', '#ffffff', 64, 64)} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/** Wide lat-pulldown bar with angled grips; axis along X. */
export function LatBar() {
  return (
    <group>
      <mesh rotation={[0, 0, HALF_PI]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.7, 10]} />
        {CHROME}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.35, 0, 0]} rotation={[0, 0, s * -0.35]}>
          <mesh position={[s * 0.2, 0, 0]} rotation={[0, 0, HALF_PI]}>
            <cylinderGeometry args={[0.016, 0.016, 0.42, 10]} />
            {CHROME}
          </mesh>
          <mesh position={[s * 0.24, 0, 0]} rotation={[0, 0, HALF_PI]}>
            <cylinderGeometry args={[0.021, 0.021, 0.22, 10]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
