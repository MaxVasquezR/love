import type { StationId } from '../types'

export const STATION_POS: Record<StationId, [number, number, number]> = {
  push: [-4.5, 0, -1.4],
  pull: [0, 0, -2.4],
  legs: [4.5, 0, -1.4],
}

export const WAIT_POS: Record<'max' | 'ana', [number, number, number]> = {
  max: [-1.4, 0, 2.6],
  ana: [1.4, 0, 2.6],
}

type MachineProps = {
  position: [number, number, number]
  color: string
  active?: boolean
}

function Plate({
  position,
  radius = 0.22,
  color = '#222',
}: {
  position: [number, number, number]
  radius?: number
  color?: string
}) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[radius, radius, 0.06, 16]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
    </mesh>
  )
}

function Dumbbell({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
        <meshStandardMaterial color="#cfd2d4" metalness={0.7} />
      </mesh>
      <Plate position={[0, 0.22, 0]} radius={0.12} color="#1a1a1a" />
      <Plate position={[0, -0.22, 0]} radius={0.12} color="#1a1a1a" />
    </group>
  )
}

function Kettlebell({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#222" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <torusGeometry args={[0.1, 0.03, 6, 12]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
    </group>
  )
}

function WaterBottle({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.28, 10]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.06, 8]} />
        <meshStandardMaterial color="#eee" />
      </mesh>
    </group>
  )
}

function YogaMat({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0.2]}
      receiveShadow
    >
      <planeGeometry args={[1.4, 0.55]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

function BenchMachine({ position, color, active }: MachineProps) {
  return (
    <group position={position}>
      {/* pad */}
      <mesh position={[0, 0.42, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.75, 0.12, 1.5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.1]} castShadow>
        <boxGeometry args={[0.7, 0.08, 1.4]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      {/* uprights */}
      <mesh position={[-0.55, 0.95, -0.45]} castShadow>
        <boxGeometry args={[0.1, 1.1, 0.1]} />
        <meshStandardMaterial color="#555" metalness={0.4} />
      </mesh>
      <mesh position={[0.55, 0.95, -0.45]} castShadow>
        <boxGeometry args={[0.1, 1.1, 0.1]} />
        <meshStandardMaterial color="#555" metalness={0.4} />
      </mesh>
      {/* barbell */}
      <mesh position={[0, 1.15, -0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 2.1, 10]} />
        <meshStandardMaterial color="#cfd2d4" metalness={0.75} roughness={0.2} />
      </mesh>
      <Plate position={[-0.85, 1.15, -0.45]} radius={0.28} color="#111" />
      <Plate position={[-0.72, 1.15, -0.45]} radius={0.22} color="#e63946" />
      <Plate position={[0.85, 1.15, -0.45]} radius={0.28} color="#111" />
      <Plate position={[0.72, 1.15, -0.45]} radius={0.22} color="#e63946" />
      {active && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="#ff6b4a" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  )
}

function CableMachine({ position, color, active }: MachineProps) {
  return (
    <group position={position}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.35, 2.3, 0.55]} />
        <meshStandardMaterial color="#333" metalness={0.35} roughness={0.45} />
      </mesh>
      {/* weight stack */}
      {[-0.35, -0.22, -0.09, 0.04, 0.17].map((_, i) => (
        <mesh key={i} position={[0.35, 0.55 + i * 0.13, 0.2]} castShadow>
          <boxGeometry args={[0.35, 0.11, 0.28]} />
          <meshStandardMaterial color={i === 2 ? color : '#1f1f1f'} />
        </mesh>
      ))}
      <mesh position={[0, 0.75, 0.45]} castShadow>
        <boxGeometry args={[0.75, 0.12, 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 1.9, 0.4]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
        <meshStandardMaterial color="#bbb" metalness={0.65} />
      </mesh>
      {/* lat bar */}
      <mesh position={[0, 1.55, 0.55]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        <meshStandardMaterial color="#ddd" metalness={0.7} />
      </mesh>
      {active && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="#c8f542" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  )
}

function SquatRack({ position, color, active }: MachineProps) {
  return (
    <group position={position}>
      <mesh position={[-0.6, 1.2, 0]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.45} />
      </mesh>
      <mesh position={[0.6, 1.2, 0]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.45} />
      </mesh>
      <mesh position={[-0.6, 1.2, -0.55]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.45} />
      </mesh>
      <mesh position={[0.6, 1.2, -0.55]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.45} />
      </mesh>
      {/* safety bars */}
      <mesh position={[0, 0.7, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#888" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.35, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.55, 10]} />
        <meshStandardMaterial color="#cfd2d4" metalness={0.75} />
      </mesh>
      <Plate position={[-0.7, 1.35, -0.15]} radius={0.26} color="#111" />
      <Plate position={[0.7, 1.35, -0.15]} radius={0.26} color="#111" />
      <mesh position={[0, 0.12, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.1, 0.9]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {active && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="#ff8fab" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  )
}

type GymProps = {
  activeStation?: StationId | null
  activeStations?: StationId[]
}

export function GymWorld({
  activeStation = null,
  activeStations = [],
}: GymProps) {
  const active = new Set(
    activeStations.length
      ? activeStations
      : activeStation
        ? [activeStation]
        : [],
  )

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#2a221c" roughness={0.95} />
      </mesh>

      {/* rubber floor lanes */}
      {[-3, 0, 3].map((z) => (
        <mesh
          key={z}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.015, z]}
          receiveShadow
        >
          <planeGeometry args={[16, 1.8]} />
          <meshStandardMaterial color="#231c17" roughness={1} />
        </mesh>
      ))}

      <mesh position={[0, 2.4, -5.2]} receiveShadow>
        <boxGeometry args={[20, 5, 0.35]} />
        <meshStandardMaterial color="#17130f" roughness={0.9} />
      </mesh>

      {/* mirror wall */}
      <mesh position={[0, 2.3, -5]} >
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial
          color="#a8c0d8"
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* neon vibe strip */}
      <mesh position={[0, 4.4, -5]}>
        <boxGeometry args={[10, 0.08, 0.08]} />
        <meshStandardMaterial color="#ff6b4a" emissive="#ff6b4a" emissiveIntensity={0.8} />
      </mesh>

      {[-7.5, 7.5].map((x) => (
        <group key={x} position={[x, 0, -1.5]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.3, 2.6, 0.3]} />
            <meshStandardMaterial color="#3a3a3a" />
          </mesh>
          {[0.5, 1.0, 1.5, 2.0].map((y) => (
            <mesh
              key={y}
              position={[0, y, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.045, 0.045, 1.35, 8]} />
              <meshStandardMaterial color="#aaa" metalness={0.65} />
            </mesh>
          ))}
        </group>
      ))}

      <BenchMachine
        position={STATION_POS.push}
        color="#ff6b4a"
        active={active.has('push')}
      />
      <CableMachine
        position={STATION_POS.pull}
        color="#c8f542"
        active={active.has('pull')}
      />
      <SquatRack
        position={STATION_POS.legs}
        color="#ff8fab"
        active={active.has('legs')}
      />

      {/* accessories scattered like a real gym */}
      <Dumbbell position={[-2.2, 0.12, 1.2]} rotation={[0, 0.4, Math.PI / 2]} />
      <Dumbbell position={[-2.5, 0.12, 1.35]} rotation={[0, -0.2, Math.PI / 2]} />
      <Dumbbell position={[2.4, 0.12, 1.1]} rotation={[0, 0.6, Math.PI / 2]} />
      <Kettlebell position={[3.2, 0, 2.1]} />
      <Kettlebell position={[3.5, 0, 2.3]} />
      <Kettlebell position={[-3.4, 0, 2.0]} />
      <WaterBottle position={[-1.0, 0.14, 2.9]} color="#7ec8e3" />
      <WaterBottle position={[1.15, 0.14, 2.95]} color="#ff8fab" />
      <YogaMat position={[0, 0.03, 3.4]} color="#2d6a4f" />
      <YogaMat position={[-5.5, 0.03, 2.2]} color="#457b9d" />

      {/* plate tree */}
      <group position={[6.5, 0, 1.5]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
          <meshStandardMaterial color="#666" metalness={0.5} />
        </mesh>
        {[0.35, 0.55, 0.75, 0.95].map((y, i) => (
          <Plate
            key={y}
            position={[0, y, 0]}
            radius={0.2 + i * 0.03}
            color={i % 2 ? '#111' : '#e63946'}
          />
        ))}
      </group>

      {/* medicine ball */}
      <mesh position={[-6.2, 0.22, 1.8]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#264653" roughness={0.8} />
      </mesh>

      {/* towel on bench area */}
      <mesh position={[-3.2, 0.08, 0.6]} rotation={[-Math.PI / 2, 0, 0.5]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial color="#f1faee" />
      </mesh>
    </group>
  )
}
