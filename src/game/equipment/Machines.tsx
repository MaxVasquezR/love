import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAND_ORANGE } from '../brandArt'
import { labelTexture } from '../brandTextures'
import { platesPerSide, rigLive, type PlateDef } from '../rigs'
import { Barbell, Dumbbell, LatBar, Plate } from './Barbell'

/**
 * Real gym machines, authored in rig space: the athlete stands at the origin facing +Z,
 * so every pad, bar and handle lines up with the joint targets in motions.ts.
 */

export type MachineProps = { kg: number; active: boolean; lifting: boolean }

const STEEL = '#2a2c30'
const PAD = '#151515'
const HALF_PI = Math.PI / 2
const UP = new THREE.Vector3(0, 1, 0)
const tA = new THREE.Vector3()
const tB = new THREE.Vector3()

const Steel = () => <meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.42} />
const Chrome = () => <meshStandardMaterial color="#d4d7da" metalness={0.85} roughness={0.22} />
const Vinyl = () => <meshStandardMaterial color={PAD} roughness={0.78} />
const Accent = () => <meshStandardMaterial color={BRAND_ORANGE} roughness={0.45} />

/** Steel box tube between two points. */
function Tube({ a, b, w = 0.06, chrome = false }: { a: [number, number, number]; b: [number, number, number]; w?: number; chrome?: boolean }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
      len: dir.length(),
    }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      {chrome ? <cylinderGeometry args={[w / 2, w / 2, len, 10]} /> : <boxGeometry args={[w, len, w]} />}
      {chrome ? <Chrome /> : <Steel />}
    </mesh>
  )
}

/** Upholstered pad with an orange piping line along its sides. */
function Pad({ size, position, rotation }: { size: [number, number, number]; position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <Vinyl />
      </mesh>
      <mesh position={[0, size[1] / 2 - 0.012, 0]}>
        <boxGeometry args={[size[0] + 0.004, 0.008, size[2] + 0.004]} />
        <Accent />
      </mesh>
    </group>
  )
}

/** Stretch a unit-height cylinder between two points (cables). */
function stretch(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  m.position.addVectors(a, b).multiplyScalar(0.5)
  const d = tB.subVectors(b, a)
  m.scale.set(1, Math.max(0.001, d.length()), 1)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
}

function Cable({ refObj }: { refObj: React.RefObject<THREE.Mesh | null> }) {
  return (
    <mesh ref={refObj}>
      <cylinderGeometry args={[0.005, 0.005, 1, 6]} />
      <meshStandardMaterial color="#111" roughness={0.5} />
    </mesh>
  )
}

function Pulley({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, HALF_PI]}>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 18]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.05, 0.13, 0.13]} />
        <Steel />
      </mesh>
    </group>
  )
}

/** Plates stacked on a horn pointing along +X from `x0`. */
function HornPlates({ plates, x0 }: { plates: PlateDef[]; x0: number }) {
  let x = x0
  return (
    <>
      {plates.map((p, i) => {
        const px = x + p.width / 2
        x += p.width + 0.002
        return <Plate key={i} plate={p} x={px} />
      })}
    </>
  )
}

// ---------------------------------------------------------------- flat bench

export function FlatBench({ kg, lifting }: MachineProps) {
  return (
    <group>
      <Pad size={[0.29, 0.08, 1.2]} position={[0, 0.4, -0.27]} />
      <Tube a={[0, 0.36, 0.25]} b={[0, 0.36, -0.42]} w={0.07} />
      <Tube a={[0, 0, 0.25]} b={[0, 0.36, 0.25]} w={0.06} />
      <Tube a={[-0.24, 0.03, 0.25]} b={[0.24, 0.03, 0.25]} w={0.06} />
      {/* uprights with J-hooks */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Tube a={[s * 0.55, 0, -0.42]} b={[s * 0.55, 1.18, -0.42]} w={0.07} />
          <Tube a={[s * 0.55, 0.03, -0.75]} b={[s * 0.55, 0.03, -0.1]} w={0.07} />
          <mesh position={[s * 0.55, 1.06, -0.37]}>
            <boxGeometry args={[0.08, 0.05, 0.08]} />
            <Accent />
          </mesh>
          <group position={[s * 0.59, 0.32, -0.6]}>
            <mesh rotation={[0, 0, HALF_PI]}>
              <cylinderGeometry args={[0.025, 0.025, 0.25, 10]} />
              <Chrome />
            </mesh>
          </group>
        </group>
      ))}
      <Tube a={[-0.55, 0.03, -0.42]} b={[0.55, 0.03, -0.42]} w={0.07} />
      <Tube a={[-0.55, 0.38, -0.42]} b={[0, 0.36, -0.42]} w={0.05} />
      <Tube a={[0.55, 0.38, -0.42]} b={[0, 0.36, -0.42]} w={0.05} />
      {/* stored plates on the side horns */}
      <group position={[0.6, 0.32, -0.6]}>
        <HornPlates plates={platesPerSide(60, 20)} x0={0} />
      </group>
      {!lifting && (
        <group position={[0, 1.09, -0.37]}>
          <Barbell kg={kg} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------- adjustable bench

export function AdjustableBench({ kg, active, lifting }: MachineProps) {
  const back = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = back.current
    if (!g) return
    const want = active ? rigLive.incline : 0
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, want, 6, dt)
  })
  return (
    <group>
      <Pad size={[0.3, 0.08, 0.36]} position={[0, 0.4, 0.37]} />
      <group ref={back} position={[0, 0.4, 0.2]}>
        <Pad size={[0.3, 0.08, 0.86]} position={[0, 0, -0.44]} />
        <Tube a={[0, -0.06, -0.05]} b={[0, -0.06, -0.8]} w={0.05} />
      </group>
      {/* frame, ladder and wheels */}
      <Tube a={[0, 0.04, 0.6]} b={[0, 0.04, -0.75]} w={0.08} />
      <Tube a={[0, 0.04, 0.45]} b={[0, 0.35, 0.35]} w={0.06} />
      <Tube a={[0, 0.04, 0.05]} b={[0, 0.35, 0.2]} w={0.06} />
      <Tube a={[-0.25, 0.03, 0.6]} b={[0.25, 0.03, 0.6]} w={0.06} />
      <Tube a={[-0.25, 0.03, -0.75]} b={[0.25, 0.03, -0.75]} w={0.06} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.27, 0.05, 0.62]} rotation={[0, 0, HALF_PI]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 14]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.1, -0.15 - i * 0.12]}>
          <boxGeometry args={[0.1, 0.02, 0.03]} />
          <Accent />
        </mesh>
      ))}
      {!lifting &&
        [-1, 1].map((s) => (
          <group key={s} position={[s * 0.36, 0.09, 0.45]} rotation={[0, HALF_PI, 0]}>
            <Dumbbell kg={kg} />
          </group>
        ))}
    </group>
  )
}

// ---------------------------------------------------------------- dumbbell rack

const RACK_KG = [
  [2.5, 5, 7.5, 10, 12.5],
  [15, 17.5, 20, 22.5, 25],
]

export function DumbbellRack({ kg, lifting }: MachineProps) {
  return (
    <group position={[0, 0, -0.9]}>
      {RACK_KG.map((row, r) => {
        const y = r === 0 ? 0.88 : 0.5
        const z = r === 0 ? -0.08 : 0.12
        return (
          <group key={r}>
            <mesh position={[0, y - 0.07, z]} rotation={[0.25, 0, 0]} castShadow>
              <boxGeometry args={[2.3, 0.04, 0.32]} />
              <Steel />
            </mesh>
            {row.map((w, i) => {
              const x = -0.92 + i * 0.46
              const taken = lifting && Math.abs(w - kg) < 0.01
              return (
                <group key={w} position={[x, y, z]}>
                  {!taken &&
                    [-0.09, 0.09].map((dx) => (
                      <group key={dx} position={[dx, 0, 0]} rotation={[0.25, HALF_PI, 0]}>
                        <Dumbbell kg={w} />
                      </group>
                    ))}
                  <mesh position={[0, -0.075, 0.19]} rotation={[0.25, 0, 0]}>
                    <planeGeometry args={[0.2, 0.06]} />
                    <meshBasicMaterial map={labelTexture(`${w} kg`, BRAND_ORANGE, '#111111', 128, 40)} toneMapped={false} />
                  </mesh>
                </group>
              )
            })}
          </group>
        )
      })}
      {[-1.18, 1.18].map((x) => (
        <group key={x}>
          <Tube a={[x, 0, 0.3]} b={[x, 0.85, -0.05]} w={0.07} />
          <Tube a={[x, 0.02, -0.25]} b={[x, 0.02, 0.35]} w={0.07} />
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- deadlift platform

export function Platform({ kg, lifting }: MachineProps) {
  return (
    <group>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.03, 2.0]} />
        <meshStandardMaterial color="#b0844f" roughness={0.75} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.7, 0.015, 0]} receiveShadow>
          <boxGeometry args={[0.4, 0.03, 2.0]} />
          <meshStandardMaterial color="#121212" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.032, 0.65]} rotation={[-HALF_PI, 0, 0]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial map={labelTexture('BONNETTY', '#b0844f', '#2a1a0a', 256, 64)} transparent opacity={0.8} />
      </mesh>
      {/* low bench for hip thrusts */}
      <Pad size={[1.1, 0.1, 0.3]} position={[0, 0.37, -0.68]} />
      {[-0.45, 0.45].map((x) => (
        <Tube key={x} a={[x, 0.03, -0.68]} b={[x, 0.32, -0.68]} w={0.06} />
      ))}
      {!lifting && (
        <group position={[0, 0.225, 0.08]}>
          <Barbell kg={kg} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------- lat pulldown

const STACK = 14
const STACK_STEP = 0.036

export function LatPulldown({ kg, active, lifting }: MachineProps) {
  const root = useRef<THREE.Group>(null)
  const moving = useRef<THREE.Group>(null)
  const restBar = useRef<THREE.Group>(null)
  const cableFront = useRef<THREE.Mesh>(null)
  const cableTop = useRef<THREE.Mesh>(null)
  const cableBack = useRef<THREE.Mesh>(null)
  const pin = Math.max(1, Math.min(STACK, Math.round(kg / 5)))
  const travel = useRef(0)

  useFrame((_, dt) => {
    const want = active && lifting ? rigLive.pulldown : 0
    travel.current = THREE.MathUtils.damp(travel.current, want, 14, dt)
    const lift = travel.current * 0.42
    if (moving.current) moving.current.position.y = lift
    if (restBar.current) restBar.current.visible = !(active && lifting)
    const g = root.current
    const front = tA.set(0, 2.25, 0.1)
    if (cableFront.current && g) {
      const end = new THREE.Vector3()
      if (active && lifting) {
        end.copy(rigLive.hands)
        g.worldToLocal(end)
      } else end.set(0, 1.78, 0.1)
      stretch(cableFront.current, front.clone(), end)
    }
    if (cableTop.current) stretch(cableTop.current, new THREE.Vector3(0, 2.33, 0.1), new THREE.Vector3(0, 2.33, -0.62))
    if (cableBack.current) {
      const top = 0.15 + STACK * STACK_STEP + 0.12 + lift
      stretch(cableBack.current, new THREE.Vector3(0, 2.25, -0.62), new THREE.Vector3(0, top, -0.62))
    }
  })

  const plateBox = (i: number, key: string | number) => (
    <group key={key} position={[0, 0.15 + i * STACK_STEP, -0.62]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, STACK_STEP - 0.004, 0.16]} />
        <meshStandardMaterial color="#1b1b1b" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 0, 0.081]}>
        <planeGeometry args={[0.07, 0.026]} />
        <meshBasicMaterial map={labelTexture(String((STACK - i) * 5), '#1b1b1b', '#f2f2f2', 64, 24)} />
      </mesh>
    </group>
  )

  return (
    <group ref={root}>
      <Pad size={[0.42, 0.08, 0.38]} position={[0, 0.43, 0.02]} />
      <Tube a={[0, 0.03, 0.02]} b={[0, 0.39, 0.02]} w={0.07} />
      <Tube a={[0, 0.03, 0.02]} b={[0, 0.03, -0.62]} w={0.08} />
      {/* thigh rollers */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.13, 0.73, 0.35]} rotation={[0, 0, HALF_PI]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 14]} />
          <Vinyl />
        </mesh>
      ))}
      <Tube a={[0, 0.43, 0.15]} b={[0, 0.73, 0.35]} w={0.05} />
      <Tube a={[-0.04, 0.73, 0.35]} b={[0.04, 0.73, 0.35]} w={0.05} />
      {/* column, guide rods, top beam */}
      <Tube a={[0, 0.03, -0.85]} b={[0, 2.4, -0.85]} w={0.1} />
      <Tube a={[-0.3, 0.03, -0.62]} b={[0.3, 0.03, -0.62]} w={0.08} />
      {[-0.13, 0.13].map((x) => (
        <Tube key={x} a={[x, 0.05, -0.62]} b={[x, 2.2, -0.62]} w={0.018} chrome />
      ))}
      <Tube a={[0, 2.4, -0.88]} b={[0, 2.4, 0.15]} w={0.09} />
      <Tube a={[-0.25, 0.03, -0.85]} b={[0.25, 0.03, -0.85]} w={0.08} />
      <Pulley position={[0, 2.3, 0.1]} />
      <Pulley position={[0, 2.3, -0.62]} />
      {/* weight stack: plates above the pin ride up with the cable */}
      {Array.from({ length: STACK - pin }, (_, i) => plateBox(i, i))}
      <group ref={moving}>
        {Array.from({ length: pin }, (_, k) => plateBox(STACK - pin + k, `m${k}`))}
        <mesh position={[0.05, 0.15 + (STACK - pin) * STACK_STEP, -0.52]} rotation={[HALF_PI, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
          <Accent />
        </mesh>
        <mesh position={[0.05, 0.15 + (STACK - pin) * STACK_STEP, -0.48]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <Accent />
        </mesh>
        <mesh position={[0, 0.15 + STACK * STACK_STEP + 0.05, -0.62]}>
          <boxGeometry args={[0.3, 0.06, 0.1]} />
          <Steel />
        </mesh>
      </group>
      <mesh position={[0, 1.2, -0.95]}>
        <planeGeometry args={[0.5, 0.18]} />
        <meshBasicMaterial map={labelTexture('JALÓN', STEEL, BRAND_ORANGE, 256, 80)} side={THREE.DoubleSide} />
      </mesh>
      <Cable refObj={cableFront} />
      <Cable refObj={cableTop} />
      <Cable refObj={cableBack} />
      <group ref={restBar} position={[0, 1.78, 0.1]}>
        <LatBar />
      </group>
    </group>
  )
}

// ---------------------------------------------------------------- 45° leg press

const RAIL = new THREE.Vector2(Math.SQRT1_2, Math.SQRT1_2)

export function LegPress45({ kg, active, lifting }: MachineProps) {
  const sled = useRef<THREE.Group>(null)
  const dist = useRef(0.8)
  const plates = useMemo(() => platesPerSide(kg, 0), [kg])
  useFrame((_, dt) => {
    const want = active && lifting ? rigLive.legpress : 0.8
    dist.current = THREE.MathUtils.damp(dist.current, want, 14, dt)
    const g = sled.current
    if (!g) return
    const d = dist.current + 0.07
    g.position.set(0, 0.45 + RAIL.y * d, 0.06 + RAIL.x * d)
  })
  const backTilt = HALF_PI - 0.85
  return (
    <group>
      {/* seat and reclined back */}
      <Pad size={[0.45, 0.07, 0.34]} position={[0, 0.36, 0.08]} rotation={[-0.25, 0, 0]} />
      <group position={[0, 0.38, -0.086]} rotation={[backTilt, 0, 0]}>
        <Pad size={[0.45, 0.07, 0.75]} position={[0, -0.035, -0.37]} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.3, 0.02, -0.05]} rotation={[HALF_PI, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.28, 8]} />
            <Vinyl />
          </mesh>
        ))}
      </group>
      <Tube a={[0, 0.03, 0.15]} b={[0, 0.32, 0.08]} w={0.07} />
      <Tube a={[0, 0.03, -0.55]} b={[0, 0.66, -0.55]} w={0.07} />
      {/* base and 45° rails */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Tube a={[s * 0.32, 0.03, -0.7]} b={[s * 0.32, 0.03, 1.75]} w={0.09} />
          <Tube a={[s * 0.32, 0.3, 0.35]} b={[s * 0.32, 1.65, 1.7]} w={0.08} />
          <Tube a={[s * 0.32, 0.03, 1.7]} b={[s * 0.32, 1.65, 1.7]} w={0.08} />
          <mesh position={[s * 0.32, 0.52, 0.57]} rotation={[-Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.1, 0.06, 0.06]} />
            <Accent />
          </mesh>
        </group>
      ))}
      <Tube a={[-0.32, 0.03, -0.7]} b={[0.32, 0.03, -0.7]} w={0.08} />
      <Tube a={[-0.32, 1.65, 1.7]} b={[0.32, 1.65, 1.7]} w={0.08} />
      {/* sled with footplate and loaded horns */}
      <group ref={sled} rotation={[-Math.PI / 4, 0, 0]}>
        <mesh position={[0, 0.1, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.62, 0.035]} />
          <meshStandardMaterial color="#3a3d42" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, -0.0]}>
          <planeGeometry args={[0.66, 0.56]} />
          <meshStandardMaterial color="#202020" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.1, 0.12]} castShadow>
          <boxGeometry args={[0.7, 0.4, 0.16]} />
          <Steel />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} scale={[s, 1, 1]} position={[0, 0.0, 0.16]}>
            <mesh position={[0.52, 0, 0]} rotation={[0, 0, HALF_PI]}>
              <cylinderGeometry args={[0.025, 0.025, 0.34, 10]} />
              <Chrome />
            </mesh>
            <HornPlates plates={plates} x0={0.4} />
          </group>
        ))}
      </group>
      <mesh position={[0.4, 1.0, 1.72]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.5, 0.16]} />
        <meshBasicMaterial map={labelTexture('PRENSA 45°', STEEL, BRAND_ORANGE, 256, 80)} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- pull-up / dip tower

export function DipPullTower(_: MachineProps) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Tube a={[s * 0.5, 0, -0.38]} b={[s * 0.5, 2.38, -0.38]} w={0.08} />
          <Tube a={[s * 0.5, 0.03, -0.8]} b={[s * 0.5, 0.03, 0.35]} w={0.08} />
          <Tube a={[s * 0.5, 0.03, -0.75]} b={[s * 0.5, 1.0, -0.4]} w={0.05} />
          <Tube a={[s * 0.5, 2.3, -0.38]} b={[s * 0.5, 2.3, 0.02]} w={0.07} />
          {/* dip handles */}
          <Tube a={[s * 0.5, 1.22, -0.36]} b={[s * 0.27, 1.22, -0.25]} w={0.05} />
          <Tube a={[s * 0.27, 1.25, -0.25]} b={[s * 0.27, 1.25, 0.22]} w={0.04} chrome />
          <mesh position={[s * 0.27, 1.25, 0.1]} rotation={[HALF_PI, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.2, 10]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <Tube a={[-0.6, 2.25, 0.02]} b={[0.6, 2.25, 0.02]} w={0.032} chrome />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.36, 2.25, 0.02]} rotation={[0, 0, HALF_PI]}>
          <cylinderGeometry args={[0.022, 0.022, 0.16, 10]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
      <Tube a={[-0.5, 2.38, -0.38]} b={[0.5, 2.38, -0.38]} w={0.07} />
      <Pad size={[0.36, 0.5, 0.06]} position={[0, 1.55, -0.36]} />
      <mesh position={[0, 2.0, -0.33]}>
        <planeGeometry args={[0.6, 0.16]} />
        <meshBasicMaterial map={labelTexture('BARRAS', STEEL, BRAND_ORANGE, 256, 70)} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- power rack

export function PowerRack({ kg, lifting }: MachineProps) {
  return (
    <group>
      <mesh position={[0, 0.012, 0.1]} receiveShadow>
        <boxGeometry args={[1.5, 0.024, 1.3]} />
        <meshStandardMaterial color="#141414" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          {[-0.32, 0.5].map((z) => (
            <group key={z}>
              <Tube a={[s * 0.62, 0, z]} b={[s * 0.62, 2.3, z]} w={0.075} />
              {/* hole pattern */}
              {Array.from({ length: 14 }, (_, i) => (
                <mesh key={i} position={[s * 0.62 - s * 0.0385, 0.5 + i * 0.1, z]} rotation={[0, s * HALF_PI, 0]}>
                  <circleGeometry args={[0.011, 8]} />
                  <meshBasicMaterial color="#0a0a0a" />
                </mesh>
              ))}
            </group>
          ))}
          <Tube a={[s * 0.62, 0.04, -0.32]} b={[s * 0.62, 0.04, 0.5]} w={0.075} />
          <Tube a={[s * 0.62, 2.3, -0.32]} b={[s * 0.62, 2.3, 0.5]} w={0.075} />
          {/* safety arms */}
          <Tube a={[s * 0.62, 0.62, -0.42]} b={[s * 0.62, 0.62, 0.62]} w={0.05} />
          {/* J-hooks on the rear uprights */}
          <group position={[s * 0.6, 1.36, -0.24]}>
            <mesh>
              <boxGeometry args={[0.07, 0.04, 0.12]} />
              <Accent />
            </mesh>
            <mesh position={[0, 0.04, 0.05]}>
              <boxGeometry args={[0.07, 0.06, 0.02]} />
              <Accent />
            </mesh>
          </group>
          {/* plate storage horns */}
          <group position={[s * 0.66, 0.4, -0.32]} scale={[s, 1, 1]}>
            <mesh position={[0.13, 0, 0]} rotation={[0, 0, HALF_PI]}>
              <cylinderGeometry args={[0.025, 0.025, 0.26, 10]} />
              <Chrome />
            </mesh>
            <HornPlates plates={platesPerSide(s < 0 ? 60 : 50, 20)} x0={0.03} />
          </group>
        </group>
      ))}
      <Tube a={[-0.62, 2.3, 0.5]} b={[0.62, 2.3, 0.5]} w={0.05} chrome />
      <Tube a={[-0.62, 2.3, -0.32]} b={[0.62, 2.3, -0.32]} w={0.075} />
      <Tube a={[-0.62, 0.04, -0.32]} b={[0.62, 0.04, -0.32]} w={0.075} />
      <mesh position={[0, 2.12, -0.28]}>
        <planeGeometry args={[0.7, 0.18]} />
        <meshBasicMaterial map={labelTexture('RACK', STEEL, BRAND_ORANGE, 256, 70)} />
      </mesh>
      {!lifting && (
        <group position={[0, 1.42, -0.22]}>
          <Barbell kg={kg} />
        </group>
      )}
    </group>
  )
}
