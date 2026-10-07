import * as THREE from 'three'
import type { RigId } from '../core/types'

export interface RigDef {
  id: RigId
  name: string
  /** Floor position of the athlete while lifting (rig origin). */
  pos: [number, number]
  /** Rotation around Y: the athlete faces local +Z. */
  face: number
  /** Where the athlete stands between sets, as a world offset from `pos`. */
  wait: [number, number]
  /** Coach spot, as a world offset from `pos`. */
  coach: [number, number]
  /** Camera framing: height of the look-at point and distance multiplier. */
  lookY: number
  dist: number
}

export const RIGS: Record<RigId, RigDef> = {
  bench: { id: 'bench', name: 'Banco plano', pos: [-6.3, -0.6], face: Math.PI / 2, wait: [0.3, 0.95], coach: [-1.05, 0.05], lookY: 0.85, dist: 1 },
  adjustable: { id: 'adjustable', name: 'Banco ajustable', pos: [-2.0, -2.3], face: Math.PI / 2, wait: [0.3, 0.95], coach: [-1.0, 0.3], lookY: 0.85, dist: 1 },
  dumbbells: { id: 'dumbbells', name: 'Mancuernas', pos: [-4.4, -2.75], face: 0, wait: [0, 0.2], coach: [-1.1, 0.5], lookY: 1.0, dist: 1 },
  platform: { id: 'platform', name: 'Plataforma', pos: [0.1, -2.2], face: 0, wait: [0, 0.75], coach: [-1.2, 0.5], lookY: 0.95, dist: 1 },
  cable: { id: 'cable', name: 'Polea alta', pos: [2.5, -3.2], face: 0, wait: [0, 0.85], coach: [-1.1, 0.6], lookY: 1.15, dist: 1.05 },
  rack: { id: 'rack', name: 'Rack de potencia', pos: [4.6, -2.6], face: 0, wait: [0, 1.0], coach: [-1.3, 0.6], lookY: 1.1, dist: 1.05 },
  legpress: { id: 'legpress', name: 'Prensa 45°', pos: [6.3, 0.9], face: -Math.PI / 2, wait: [0.1, 1.0], coach: [-0.9, -0.95], lookY: 0.8, dist: 1.05 },
  tower: { id: 'tower', name: 'Barras y paralelas', pos: [6.8, -3.1], face: -0.5, wait: [-0.5, 0.9], coach: [0.95, 0.5], lookY: 1.45, dist: 1.15 },
}

export { STATION_RIG } from '../data/exercises'

/** Live data the player's body writes every frame so machines move with it. */
export const rigLive = {
  /** Pulldown handle travel: 0 arms up, 1 bar at chest. */
  pulldown: 0,
  /** Leg press: distance from hip to platform (m). */
  legpress: 0.8,
  /** Adjustable bench back angle (rad, 0 = flat). */
  incline: 0,
  /** World-space hand midpoint for cables. */
  hands: new THREE.Vector3(0, 2, 0),
}

// ---------- plates ----------
export interface PlateDef {
  kg: number
  color: string
  radius: number
  width: number
}

/** IWF bumper colors: 25 red, 20 blue, 15 yellow, 10 green, 5 white; change plates are smaller. */
export const PLATES: PlateDef[] = [
  { kg: 25, color: '#d62828', radius: 0.225, width: 0.068 },
  { kg: 20, color: '#1f4fd8', radius: 0.225, width: 0.058 },
  { kg: 15, color: '#f2c40f', radius: 0.225, width: 0.048 },
  { kg: 10, color: '#1f9d4c', radius: 0.225, width: 0.04 },
  { kg: 5, color: '#f3f3f3', radius: 0.16, width: 0.03 },
  { kg: 2.5, color: '#d62828', radius: 0.11, width: 0.022 },
  { kg: 1.25, color: '#c9c9c9', radius: 0.09, width: 0.018 },
]

/** Plates on each sleeve for a total (bar included), heaviest first. */
export function platesPerSide(total: number, bar = 20): PlateDef[] {
  let side = Math.max(0, (total - bar) / 2)
  const out: PlateDef[] = []
  for (const p of PLATES) {
    while (side >= p.kg - 1e-6 && out.length < 9) {
      out.push(p)
      side -= p.kg
    }
  }
  return out
}

/** Rotate a world offset by a rig's facing so local offsets can be authored once. */
export function rigToWorld(rig: RigDef, local: [number, number]): [number, number] {
  const c = Math.cos(rig.face)
  const s = Math.sin(rig.face)
  return [rig.pos[0] + local[0] * c + local[1] * s, rig.pos[1] - local[0] * s + local[1] * c]
}
