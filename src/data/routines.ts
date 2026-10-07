import type { Goal } from '../core/types'
import { EXERCISES, STATIONS } from './exercises'
import { L } from '../i18n'
import { ROUTINES_EN } from '../i18n/content.en'

export interface RoutineStep {
  exerciseId: string
  sets: number
  goal: Goal
}

export interface RoutineDef {
  id: string
  name: string
  kind: 'rutina' | 'circuito'
  blurb: string
  unlockLevel: number
  bonus: number
  /** Rest in game seconds between sets. */
  rest: number
  steps: RoutineStep[]
}

export const ROUTINES: RoutineDef[] = [
  {
    id: 'push-day',
    name: 'Día de Empuje',
    kind: 'rutina',
    blurb: 'Pecho, hombro y tríceps al estilo PPL.',
    unlockLevel: 1,
    bonus: 120,
    rest: 10,
    steps: [
      { exerciseId: 'bench-bar', sets: 2, goal: 'hipertrofia' },
      { exerciseId: 'bench-db', sets: 2, goal: 'hipertrofia' },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body básico',
    kind: 'rutina',
    blurb: 'Lo esencial para empezar: empuje, jalón y pierna.',
    unlockLevel: 3,
    bonus: 180,
    rest: 10,
    steps: [
      { exerciseId: 'bench-bar', sets: 1, goal: 'fuerza' },
      { exerciseId: 'bar-row', sets: 1, goal: 'fuerza' },
      { exerciseId: 'squat', sets: 1, goal: 'fuerza' },
    ],
  },
  {
    id: 'pull-day',
    name: 'Día de Jalón',
    kind: 'rutina',
    blurb: 'Espalda en V y bíceps de acero.',
    unlockLevel: 4,
    bonus: 160,
    rest: 10,
    steps: [
      { exerciseId: 'lat-pulldown', sets: 2, goal: 'hipertrofia' },
      { exerciseId: 'bar-row', sets: 2, goal: 'hipertrofia' },
    ],
  },
  {
    id: 'hiit',
    name: 'Circuito HIIT',
    kind: 'circuito',
    blurb: 'Sin pausa: 3 ejercicios seguidos con descanso mínimo.',
    unlockLevel: 3,
    bonus: 200,
    rest: 4,
    steps: [
      { exerciseId: 'goblet', sets: 1, goal: 'resistencia' },
      { exerciseId: 'bench-db', sets: 1, goal: 'resistencia' },
      { exerciseId: 'db-row', sets: 1, goal: 'resistencia' },
    ],
  },
  {
    id: 'leg-day',
    name: 'Día de Pierna',
    kind: 'rutina',
    blurb: 'Nadie se salta el día de pierna en Bonnetty.',
    unlockLevel: 5,
    bonus: 220,
    rest: 12,
    steps: [
      { exerciseId: 'squat', sets: 2, goal: 'fuerza' },
      { exerciseId: 'leg-press', sets: 1, goal: 'hipertrofia' },
      { exerciseId: 'lunges', sets: 1, goal: 'resistencia' },
    ],
  },
  {
    id: 'glute',
    name: 'Circuito Glúteo Kiara',
    kind: 'circuito',
    blurb: 'El favorito de la zona de glúteos.',
    unlockLevel: 12,
    bonus: 300,
    rest: 4,
    steps: [
      { exerciseId: 'hip-thrust', sets: 1, goal: 'hipertrofia' },
      { exerciseId: 'rdl', sets: 1, goal: 'hipertrofia' },
      { exerciseId: 'lunges', sets: 1, goal: 'resistencia' },
    ],
  },
]

function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    return ((h >>> 0) % 10000) / 10000
  }
}

/** Daily "Rutina Bonnetty": 3 unlocked exercises from different stations, double bonus once a day. */
export function dailyRoutine(dateKey: string, level: number): RoutineDef {
  const rand = seeded(`bonnetty-${dateKey}`)
  const goals: Goal[] = ['fuerza', 'hipertrofia', 'resistencia']
  const steps: RoutineStep[] = []
  for (const station of ['push', 'pull', 'legs'] as const) {
    if (STATIONS[station].unlockLevel > level) continue
    const pool = EXERCISES.filter((e) => e.station === station && e.unlockLevel <= level)
    if (!pool.length) continue
    const ex = pool[Math.floor(rand() * pool.length)]
    steps.push({ exerciseId: ex.id, sets: 1, goal: goals[Math.floor(rand() * goals.length)] })
  }
  return {
    id: 'daily',
    name: L('Rutina Bonnetty del día', ROUTINES_EN.daily.name),
    kind: 'rutina',
    blurb: L('Cambia cada día. Bonus doble la primera vez.', ROUTINES_EN.daily.blurb),
    unlockLevel: 1,
    bonus: 250 + level * 10,
    rest: 8,
    steps,
  }
}

export function routineLocked(r: RoutineDef, level: number) {
  if (level < r.unlockLevel) return true
  return r.steps.some((s) => {
    const ex = EXERCISES.find((e) => e.id === s.exerciseId)
    return !ex || ex.unlockLevel > level || STATIONS[ex.station].unlockLevel > level
  })
}
