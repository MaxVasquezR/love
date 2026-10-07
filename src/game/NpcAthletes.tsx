import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { Doll, type RepSignal } from './Doll'
import { RIGS } from './rigs'
import { CHARACTERS } from '../data/characters'
import { exerciseById } from '../data/exercises'
import { useGame } from '../core/store'
import type { CharacterLook, Pose, RigId, StationId } from '../core/types'

/** Stations other people train at, in order of preference (the one you're using is skipped). */
const NPC_SPOTS: { rig: RigId; exercise: string; station: StationId }[] = [
  { rig: 'tower', exercise: 'dips', station: 'push' },
  { rig: 'dumbbells', exercise: 'goblet', station: 'legs' },
  { rig: 'adjustable', exercise: 'bench-db', station: 'push' },
  { rig: 'platform', exercise: 'rdl', station: 'pull' },
]

const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches

/** Other gym-goers training in the background: timed reps, rest with the towel, next set. */
export function NpcAthletes({ playerLook, busyRig }: { playerLook: CharacterLook; busyRig: RigId | null }) {
  const office = useGame((s) => s.office)
  const looks = useMemo(
    () =>
      Object.values(CHARACTERS)
        .map((c): CharacterLook => ({ ...c.look, muscle: Math.min(0.9, c.muscleBase + c.muscleGrowth * 8) }))
        .filter((l) => l.top !== playerLook.top || l.hair !== playerLook.hair),
    [playerLook],
  )
  if (office || !looks.length) return null
  const slots = NPC_SPOTS.filter((s) => s.rig !== busyRig).slice(0, coarse ? 2 : 3)
  return (
    <>
      {slots.map((s, i) => (
        <Npc key={s.rig} rig={s.rig} exercise={s.exercise} station={s.station} look={looks[i % looks.length]} seed={i} />
      ))}
    </>
  )
}

function Npc({ rig, exercise, station, look, seed }: { rig: RigId; exercise: string; station: StationId; look: CharacterLook; seed: number }) {
  const r = RIGS[rig]
  const g = useRef<THREE.Group>(null)
  const poseRef = useRef<Pose>('rest')
  const styleRef = useRef<StationId | null>(station)
  const repRef = useRef<RepSignal>({
    start: -1e9,
    quality: 'good',
    exerciseId: exercise,
    kg: exerciseById(exercise)?.baseKg ?? 20,
    slow: 2.2,
  })
  const plan = useRef({ reps: 0, setReps: 6, next: 0, restUntil: 0 })

  useLayoutEffect(() => {
    plan.current.restUntil = performance.now() + 1500 + seed * 2800
    const grp = g.current
    if (!grp) return
    grp.rotation.y = r.face
    grp.traverse((o) => {
      o.castShadow = false
    })
  }, [r.face, seed])

  useFrame(() => {
    const now = performance.now()
    const p = plan.current
    if (now < p.restUntil) {
      poseRef.current = 'rest'
      return
    }
    if (poseRef.current === 'rest') {
      poseRef.current = 'lift'
      p.reps = 0
      p.setReps = 5 + Math.floor(Math.random() * 6)
      p.next = now + 900
      if (g.current) g.current.rotation.y = r.face
    }
    if (now >= p.next) {
      repRef.current = { ...repRef.current, start: now, quality: 'good' }
      p.reps += 1
      p.next = now + 1500 + Math.random() * 700
      if (p.reps >= p.setReps) p.restUntil = now + 1600 + 6000 + Math.random() * 6000
    }
  })

  return <Doll ref={g} look={look} poseRef={poseRef} styleRef={styleRef} repRef={repRef} position={[r.pos[0], 0, r.pos[1]]} />
}
