import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BrandSign } from './BrandSign'
import { BRAND_LIME, BRAND_ORANGE } from './brandArt'
import { boardTexture, labelTexture, posterTexture, printTexture, tileTexture, tvTexture } from './brandTextures'
import { RigSet, type RigFocus } from './equipment/RigSet'
import { Dumbbell, Plate } from './equipment/Barbell'
import { PLATES } from './rigs'
import { exerciseById } from '../data/exercises'

/*
 * Bonnetty Fitness floor plan (meters, camera looks toward −Z):
 *   back wall z −5.2: whiteboard · TV · brand sign · SIN EXCUSAS · mirror behind the rack
 *   left: free weights (flat bench, dumbbell rack, adjustable bench) on rubber tiles
 *   center back: deadlift platform with chalk bowl and plate tree
 *   right: pulldown, power rack, dip/pull-up tower, 45° leg press
 *   front left: reception counter + supplement shelf · front right: lockers + water
 */

const WALL = '#17130f'
const HALF_PI = Math.PI / 2

// ---------------------------------------------------------------- small props

function WallFan({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 9
  })
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[HALF_PI, 0, 0]}>
        <torusGeometry args={[0.42, 0.02, 6, 24]} />
        <meshStandardMaterial color="#cfcfcf" metalness={0.6} />
      </mesh>
      <group ref={blades} position={[0, 0, 0.02]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.1, 0.72, 0.01]} />
            <meshStandardMaterial color="#2b2b2b" />
          </mesh>
        ))}
        <mesh rotation={[HALF_PI, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 12]} />
          <meshStandardMaterial color={BRAND_ORANGE} />
        </mesh>
      </group>
    </group>
  )
}

function Sign({
  tex,
  size,
  position,
  rotation = [0, 0, 0],
  glow = false,
}: {
  tex: THREE.Texture
  size: [number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  glow?: boolean
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.02]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial map={tex} toneMapped={!glow} />
      </mesh>
    </group>
  )
}

function WaterBottle({ position, color, rotation }: { position: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.24, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.04, 10]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.11, 0.046]}>
        <planeGeometry args={[0.06, 0.08]} />
        <meshBasicMaterial map={printTexture()} transparent />
      </mesh>
    </group>
  )
}

function Towel({ position, rotation, color = '#f1faee' }: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.32, 0.03, 0.22]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.016, 0.07]}>
        <boxGeometry args={[0.32, 0.002, 0.025]} />
        <meshStandardMaterial color={BRAND_ORANGE} />
      </mesh>
    </group>
  )
}

function GymBag({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, HALF_PI]} castShadow>
        <capsuleGeometry args={[0.14, 0.32, 6, 14]} />
        <meshStandardMaterial color="#1f1f24" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.12, 0.012, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.16, 0.142]}>
        <planeGeometry args={[0.24, 0.07]} />
        <meshBasicMaterial map={labelTexture('BONNETTY', '#1f1f24', BRAND_ORANGE, 160, 48)} />
      </mesh>
    </group>
  )
}

function ChalkBowl({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.8, 10]} />
        <meshStandardMaterial color="#333" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.84, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.14, 0.1, 18, 1, true]} />
        <meshStandardMaterial color="#444" metalness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[-HALF_PI, 0, 0]}>
        <circleGeometry args={[0.18, 18]} />
        <meshStandardMaterial color="#f5f5f5" roughness={1} />
      </mesh>
      <mesh position={[0, 0.9, 0.02]} rotation={[0.3, 0.4, 0]}>
        <boxGeometry args={[0.07, 0.05, 0.05]} />
        <meshStandardMaterial color="#fafafa" roughness={1} />
      </mesh>
    </group>
  )
}

function FoamRoller({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.075, 0.075, 0.45, 16]} />
      <meshStandardMaterial color="#2b9348" roughness={0.9} />
    </mesh>
  )
}

function YogaMat({ position, color, rotation = 0 }: { position: [number, number, number]; color: string; rotation?: number }) {
  return (
    <mesh position={position} rotation={[-HALF_PI, 0, rotation]} receiveShadow>
      <planeGeometry args={[1.5, 0.6]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

function Kettlebell({ position, color = '#222', kg }: { position: [number, number, number]; color?: string; kg: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.14, 14, 12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.31, 0]} castShadow>
        <torusGeometry args={[0.085, 0.022, 6, 14, Math.PI]} />
        <meshStandardMaterial color="#333" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.15, 0.141]}>
        <circleGeometry args={[0.045, 12]} />
        <meshBasicMaterial map={labelTexture(String(kg), color, '#ffffff', 48, 48)} />
      </mesh>
    </group>
  )
}

/** Pennant string in Peru red and white, sagging between two hooks. */
function Pennants({ from, to, count = 16 }: { from: [number, number, number]; to: [number, number, number]; count?: number }) {
  const flags = useMemo(() => {
    const out: { p: THREE.Vector3; i: number }[] = []
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count
      const p = a.clone().lerp(b, t)
      p.y -= Math.sin(Math.PI * t) * 0.35
      out.push({ p, i })
    }
    return out
  }, [from, to, count])
  const tri = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.13, 0, 0, 0.13, 0, 0, 0, -0.26, 0], 3))
    g.computeVertexNormals()
    return g
  }, [])
  const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from))
  const yaw = Math.atan2(-dir.z, dir.x)
  return (
    <group>
      {flags.map(({ p, i }) => (
        <mesh key={i} geometry={tri} position={p} rotation={[0, yaw, 0]}>
          <meshStandardMaterial color={i % 2 ? '#ffffff' : '#d91023'} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Speaker({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const cone = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (cone.current) cone.current.scale.setScalar(1 + Math.max(0, Math.sin(clock.elapsedTime * 13.6)) * 0.06)
  })
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.62, 0.34]} />
        <meshStandardMaterial color="#121212" roughness={0.7} />
      </mesh>
      <mesh ref={cone} position={[0, -0.08, 0.171]}>
        <circleGeometry args={[0.13, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.19, 0.171]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[0, 0.36, -0.1]}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  )
}

const TV_IDS = ['bench-bar', 'squat', 'bar-row', 'lat-pulldown', 'hip-thrust', 'ohp']

function WallTv({ position }: { position: [number, number, number] }) {
  const tv = useMemo(
    () =>
      tvTexture(
        TV_IDS.map((id) => {
          const ex = exerciseById(id)
          return { title: ex?.name ?? id, line: id === 'squat' ? '5 x 5 · pesado' : '4 x 10 · controlado', cue: ex?.cues[0] ?? '' }
        }),
      ),
    [],
  )
  const last = useRef(-1)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime / 6
    const i = Math.floor(t)
    const prog = Math.round((t - i) * 20) / 20
    const key = i * 100 + prog * 20
    if (key !== last.current) {
      last.current = key
      tv.show(i, prog)
    }
  })
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[1.5, 0.88, 0.05]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} />
      </mesh>
      <mesh>
        <planeGeometry args={[1.42, 0.8]} />
        <meshBasicMaterial map={tv.tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Lockers({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[(i - 2.5) * 0.42, 0, 0]}>
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 1.9, 0.45]} />
            <meshStandardMaterial color={i % 2 ? '#2d3a4a' : '#334255'} metalness={0.35} roughness={0.5} />
          </mesh>
          {[0.5, 1.4].map((y) => (
            <group key={y}>
              {[0, 1, 2].map((k) => (
                <mesh key={k} position={[0, y + 0.25 + k * 0.035, 0.226]}>
                  <boxGeometry args={[0.22, 0.012, 0.004]} />
                  <meshStandardMaterial color="#1a222c" />
                </mesh>
              ))}
              <mesh position={[0.13, y, 0.232]}>
                <boxGeometry args={[0.02, 0.08, 0.015]} />
                <meshStandardMaterial color="#c9c9c9" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, y + 0.06, 0.226]}>
                <planeGeometry args={[0.1, 0.06]} />
                <meshBasicMaterial map={labelTexture(String(i * 2 + (y > 1 ? 1 : 2)), '#e9e9e9', '#111111', 48, 32)} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.2, 0.55]} castShadow>
        <boxGeometry args={[2.3, 0.08, 0.32]} />
        <meshStandardMaterial color="#8a6a46" roughness={0.7} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.1, 0.55]}>
          <boxGeometry args={[0.06, 0.2, 0.28]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      <Towel position={[-0.45, 0.255, 0.55]} rotation={[0, 0.2, 0]} />
      <GymBag position={[0.55, 0.24, 0.55]} rotation={[0, 0, 0]} />
    </group>
  )
}

function WaterDispenser({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.38, 1.0, 0.38]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 0.2]}>
        <boxGeometry args={[0.2, 0.12, 0.04]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {[-0.05, 0.05].map((x, i) => (
        <mesh key={x} position={[x, 0.76, 0.225]}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color={i ? '#e63946' : '#457b9d'} />
        </mesh>
      ))}
      <mesh position={[0, 1.22, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.42, 16]} />
        <meshStandardMaterial color="#6ec6ff" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.88, 0.24]}>
        <planeGeometry args={[0.3, 0.1]} />
        <meshBasicMaterial map={labelTexture('HIDRÁTATE', '#e8e8e8', '#1d6fa3', 160, 48)} />
      </mesh>
    </group>
  )
}

/** Reception / shake bar with the brand print. */
function Counter({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.1, 0.7]} />
        <meshStandardMaterial color="#141210" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.3, 0.05, 0.8]} />
        <meshStandardMaterial color={BRAND_ORANGE} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.58, 0.352]}>
        <planeGeometry args={[1.3, 0.65]} />
        <meshBasicMaterial map={printTexture()} transparent toneMapped={false} />
      </mesh>
      {[-0.7, -0.45].map((x, i) => (
        <group key={x} position={[x, 1.15, 0.1]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.24, 12]} />
            <meshStandardMaterial color={i ? BRAND_LIME : '#f1faee'} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.02, 0.28, 0]} rotation={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />
            <meshStandardMaterial color="#e63946" />
          </mesh>
        </group>
      ))}
      <group position={[0.55, 1.15, 0.05]}>
        {[0, 1, 2].map((k) => (
          <Towel key={k} position={[0, 0.016 + k * 0.032, 0]} color={k === 1 ? '#ffd6a5' : '#f1faee'} />
        ))}
      </group>
      <mesh position={[0, 1.38, 0.2]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial map={labelTexture('BATIDOS S/ 12', '#111', BRAND_LIME, 256, 96)} />
      </mesh>
    </group>
  )
}

const TUBS: { name: string; color: string; lid: string; price: string }[] = [
  { name: 'WHEY', color: '#1d3557', lid: '#e63946', price: 'S/ 189' },
  { name: 'CREATINA', color: '#f1faee', lid: '#457b9d', price: 'S/ 99' },
  { name: 'PRE', color: '#2b2d42', lid: '#c8f542', price: 'S/ 119' },
  { name: 'BCAA', color: '#ffb703', lid: '#111111', price: 'S/ 89' },
]

function SupplementShelf({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.0, -0.17]} castShadow>
        <boxGeometry args={[1.6, 2.0, 0.04]} />
        <meshStandardMaterial color="#20190f" />
      </mesh>
      {[0.35, 0.85, 1.35].map((y, r) => (
        <group key={y} position={[0, y, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.03, 0.36]} />
            <meshStandardMaterial color="#8a6a46" roughness={0.6} />
          </mesh>
          {TUBS.map((_, i) => {
            const tub = TUBS[(i + r) % TUBS.length]
            return (
              <group key={i} position={[-0.6 + i * 0.4, 0.015, 0]}>
                <mesh position={[0, 0.14, 0]} castShadow>
                  <cylinderGeometry args={[0.1, 0.1, 0.28, 16]} />
                  <meshStandardMaterial color={tub.color} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.29, 0]}>
                  <cylinderGeometry args={[0.102, 0.102, 0.03, 16]} />
                  <meshStandardMaterial color={tub.lid} />
                </mesh>
                <mesh position={[0, 0.14, 0.101]}>
                  <planeGeometry args={[0.14, 0.1]} />
                  <meshBasicMaterial map={labelTexture(tub.name, tub.lid, tub.color === '#f1faee' ? '#111' : '#fff', 128, 64)} />
                </mesh>
                <mesh position={[0, 0.0, 0.185]} rotation={[-0.3, 0, 0]}>
                  <planeGeometry args={[0.16, 0.05]} />
                  <meshBasicMaterial map={labelTexture(tub.price, '#fff8e1', '#c1121f', 128, 40)} />
                </mesh>
              </group>
            )
          })}
        </group>
      ))}
      <mesh position={[0, 1.85, 0]}>
        <planeGeometry args={[1.4, 0.26]} />
        <meshBasicMaterial map={labelTexture('SUPLEMENTOS', '#111', BRAND_ORANGE, 384, 72)} toneMapped={false} />
      </mesh>
    </group>
  )
}

function PlateTree({ position }: { position: [number, number, number] }) {
  const stack = [PLATES[0], PLATES[1], PLATES[2], PLATES[3]]
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 10]} />
        <meshStandardMaterial color="#2a2c30" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.7]} />
        <meshStandardMaterial color="#2a2c30" metalness={0.5} />
      </mesh>
      {stack.map((p, i) => {
        const side = i % 2 ? 1 : -1
        const y = 0.3 + Math.floor(i / 2) * 0.5
        return (
          <group key={i} position={[0, y, 0]} scale={[side, 1, 1]}>
            <mesh position={[0.12, 0, 0]} rotation={[0, 0, HALF_PI]}>
              <cylinderGeometry args={[0.022, 0.022, 0.22, 8]} />
              <meshStandardMaterial color="#d4d7da" metalness={0.85} roughness={0.22} />
            </mesh>
            <Plate plate={p} x={0.06 + p.width / 2} />
            <Plate plate={p} x={0.06 + p.width * 1.5 + 0.004} />
          </group>
        )
      })}
    </group>
  )
}

function CeilingLights() {
  return (
    <>
      {[-5, 0, 5].map((x) =>
        [-2.6, 1.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 4.75, z]}>
            <boxGeometry args={[2.2, 0.06, 0.18]} />
            <meshStandardMaterial color="#fff6e8" emissive="#fff1d6" emissiveIntensity={1.2} />
          </mesh>
        )),
      )}
    </>
  )
}

// ---------------------------------------------------------------- the gym

type GymProps = {
  focus: RigFocus | null
  lifting: boolean
}

export function GymWorld({ focus, lifting }: GymProps) {
  const tilesL = useMemo(() => {
    const t = tileTexture().clone()
    t.repeat.set(7, 6)
    t.needsUpdate = true
    return t
  }, [])
  const tilesR = useMemo(() => {
    const t = tileTexture().clone()
    t.repeat.set(7, 6)
    t.needsUpdate = true
    return t
  }, [])

  const sinExcusas = posterTexture(
    'sin-excusas',
    [
      { t: 'SIN', c: BRAND_ORANGE, s: 64 },
      { t: 'EXCUSAS', c: '#ffffff', s: 78 },
    ],
    '#111111',
    512,
    256,
  )
  const discos = posterTexture(
    'discos',
    [
      { t: 'VUELVE LOS DISCOS', c: '#111', s: 46 },
      { t: 'A SU LUGAR', c: '#c1121f', s: 54 },
      { t: '— la gerencia', c: '#555', s: 26, italic: true },
    ],
    '#ffd60a',
    512,
    256,
    '#111',
  )
  const horario = posterTexture(
    'horario',
    [
      { t: 'HORARIO', c: BRAND_ORANGE, s: 44 },
      { t: 'L–S 5am – 11pm', c: '#ffffff', s: 46 },
      { t: 'DOM 7am – 1pm', c: '#c8f542', s: 40 },
    ],
    '#141414',
    512,
    256,
    BRAND_ORANGE,
  )
  const toalla = posterTexture(
    'toalla',
    [
      { t: 'USA TU TOALLA', c: '#ffffff', s: 46 },
      { t: 'y limpia la máquina', c: '#c8f542', s: 32 },
    ],
    '#1d3557',
    512,
    200,
  )
  const pr = posterTexture(
    'pr-wall',
    [
      { t: 'MURO DE RÉCORDS', c: BRAND_ORANGE, s: 40 },
      { t: 'Sentadilla · 180 kg', c: '#fff', s: 30 },
      { t: 'Banca · 130 kg', c: '#fff', s: 30 },
      { t: 'Muerto · 220 kg', c: '#fff', s: 30 },
    ],
    '#101010',
    512,
    320,
    '#c8f542',
  )

  return (
    <group>
      {/* floor: polished concrete, rubber tiles in the weight zones */}
      <mesh rotation={[-HALF_PI, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#2a221c" roughness={0.95} />
      </mesh>
      <mesh rotation={[-HALF_PI, 0, 0]} position={[-4.9, 0.006, -2.1]} receiveShadow>
        <planeGeometry args={[7.4, 5.8]} />
        <meshStandardMaterial map={tilesL} roughness={1} />
      </mesh>
      <mesh rotation={[-HALF_PI, 0, 0]} position={[4.9, 0.006, -1.9]} receiveShadow>
        <planeGeometry args={[7, 6]} />
        <meshStandardMaterial map={tilesR} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 1.0]} rotation={[-HALF_PI, 0, 0]}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshBasicMaterial map={printTexture()} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* walls */}
      <mesh position={[0, 2.5, -5.2]} receiveShadow>
        <boxGeometry args={[20, 5, 0.35]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      {[-9, 9].map((x) => (
        <mesh key={x} position={[x, 2.5, 0]} receiveShadow>
          <boxGeometry args={[0.3, 5, 16]} />
          <meshStandardMaterial color={WALL} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.6, -5.01]}>
        <boxGeometry args={[20, 0.08, 0.02]} />
        <meshStandardMaterial color={BRAND_ORANGE} emissive={BRAND_ORANGE} emissiveIntensity={0.4} />
      </mesh>
      <CeilingLights />

      {/* back wall: board · TV · brand · motivation · mirror */}
      <BrandSign position={[0, 3.15, -5.0]} width={3.4} />
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 3.15, -4.98]}>
          <boxGeometry args={[0.06, 2.8, 0.06]} />
          <meshStandardMaterial color={BRAND_LIME} emissive={BRAND_LIME} emissiveIntensity={0.9} />
        </mesh>
      ))}
      <group position={[-5.4, 2.3, -5.0]}>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[2.05, 1.58, 0.04]} />
          <meshStandardMaterial color="#9a9a9a" metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.95, 1.46]} />
          <meshBasicMaterial map={boardTexture()} toneMapped={false} />
        </mesh>
      </group>
      <WallTv position={[-3.0, 2.7, -4.99]} />
      <Sign tex={discos} size={[1.3, 0.65]} position={[-1.6, 1.35, -5.0]} />
      <Sign tex={sinExcusas} size={[1.7, 0.85]} position={[3.2, 3.75, -5.0]} glow />
      <Sign tex={horario} size={[1.2, 0.6]} position={[-7.6, 2.4, -5.0]} />
      <Sign tex={pr} size={[1.2, 0.75]} position={[7.4, 2.6, -5.0]} />
      <group position={[4.8, 1.6, -5.0]}>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[3.0, 2.3, 0.04]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[2.9, 2.2]} />
          <meshStandardMaterial color="#a8c0d8" metalness={0.95} roughness={0.08} transparent opacity={0.45} />
        </mesh>
      </group>
      <Speaker position={[-7.8, 4.0, -4.82]} rotation={[0.2, 0.4, 0]} />
      <Speaker position={[7.8, 4.0, -4.82]} rotation={[0.2, -0.4, 0]} />
      <Pennants from={[-7.5, 4.55, -4.9]} to={[7.5, 4.55, -4.9]} count={22} />
      <Pennants from={[-8.7, 4.5, -4.5]} to={[-8.7, 4.5, 3.5]} count={14} />

      {/* side walls */}
      <WallFan position={[-8.8, 3.6, -1.5]} rotation={[0.3, HALF_PI, 0]} />
      <WallFan position={[8.8, 3.6, -1.5]} rotation={[0.3, -HALF_PI, 0]} />
      <Sign tex={toalla} size={[1.2, 0.47]} position={[-8.83, 2.2, -2.4]} rotation={[0, HALF_PI, 0]} />

      {/* machines */}
      <RigSet focus={focus} lifting={lifting} />

      {/* free-weights details */}
      <Towel position={[-6.55, 0.455, -0.45]} rotation={[0, 0.3, 0]} />
      <WaterBottle position={[-5.6, 0, 0.15]} color="#e63946" />
      <GymBag position={[-2.0, 0, -1.1]} rotation={[0, 0.5, 0]} />
      <WaterBottle position={[-1.55, 0, -1.25]} color="#457b9d" />
      {[8, 12, 16, 20, 24].map((kg, i) => (
        <Kettlebell key={kg} kg={kg} position={[-7.6 + i * 0.4, 0, -4.6]} color={['#3a86ff', '#2b9348', '#ffbe0b', '#e85d04', '#d00000'][i]} />
      ))}
      <group position={[-7.9, 0.07, -2.4]} rotation={[0, 0.5, 0]}>
        <Dumbbell kg={10} />
      </group>
      <mesh position={[-7.9, 0.22, 1.8]} castShadow>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color="#264653" roughness={0.8} />
      </mesh>

      {/* platform zone */}
      <ChalkBowl position={[-1.25, 0, -3.6]} />
      <PlateTree position={[1.3, 0, -4.5]} />
      <WaterBottle position={[1.25, 0, -1.4]} color="#2b2d42" />

      {/* rack / machines zone */}
      <Towel position={[3.4, 0.02, -1.6]} rotation={[0, -0.6, 0]} color="#ffd6a5" />
      <WaterBottle position={[3.55, 0, -1.9]} color="#c8f542" />
      <WaterBottle position={[5.2, 0, 1.9]} color="#ff8fab" rotation={[HALF_PI, 0, 0.6]} />

      {/* stretching corner */}
      <YogaMat position={[2.3, 0.012, 3.0]} color={BRAND_ORANGE} rotation={0.15} />
      <YogaMat position={[2.5, 0.013, 3.8]} color="#3f5a1a" rotation={-0.1} />
      <FoamRoller position={[3.3, 0.075, 3.0]} rotation={[0, 0.3, HALF_PI]} />

      {/* front left: reception + supplements */}
      <Counter position={[-6.4, 0, 3.4]} rotation={[0, 0.45, 0]} />
      <SupplementShelf position={[-8.6, 0, 1.4]} rotation={[0, HALF_PI, 0]} />

      {/* front right: lockers + water */}
      <Lockers position={[8.55, 0, 3.4]} rotation={[0, -HALF_PI, 0]} />
      <WaterDispenser position={[8.5, 0, 0.9]} rotation={[0, -HALF_PI, 0]} />
    </group>
  )
}
