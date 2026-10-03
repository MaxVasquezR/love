import type { Exercise, Station, StationId } from '../core/types'

export const STATIONS: Record<StationId, Station> = {
  push: {
    id: 'push',
    title: { es: 'Empujar', en: 'Push' },
    muscles: { es: 'Pecho · hombros · tríceps', en: 'Chest · shoulders · triceps' },
    unlockLevel: 1,
  },
  pull: {
    id: 'pull',
    title: { es: 'Jalar', en: 'Pull' },
    muscles: { es: 'Espalda · bíceps', en: 'Back · biceps' },
    unlockLevel: 2,
  },
  legs: {
    id: 'legs',
    title: { es: 'Piernas', en: 'Legs' },
    muscles: { es: 'Cuádriceps · glúteos · femorales', en: 'Quads · glutes · hamstrings' },
    unlockLevel: 3,
  },
}

export const STATION_ORDER: StationId[] = ['push', 'pull', 'legs']

const UNLOCKS = [1, 1, 3, 5, 8, 12]

type Raw = Omit<Exercise, 'station' | 'unlockLevel'>

function build(station: StationId, list: Raw[]): Exercise[] {
  return list.map((e, i) => ({ ...e, station, unlockLevel: UNLOCKS[i] ?? 15 }))
}

export const EXERCISES: Exercise[] = [
  ...build('push', [
    {
      id: 'bench-bar',
      name: { es: 'Press banca', en: 'Bench press' },
      blurb: { es: 'La clásica. Barra, banco y ego bajo control.', en: 'The classic. Bar, bench, ego in check.' },
      minKg: 20, maxKg: 160, step: 5, baseKg: 40, reps: 8,
    },
    {
      id: 'bench-db',
      name: { es: 'Press mancuernas', en: 'Dumbbell press' },
      blurb: { es: 'Más rango, más control.', en: 'More range, more control.' },
      minKg: 10, maxKg: 70, step: 2.5, baseKg: 20, reps: 10,
    },
    {
      id: 'incline',
      name: { es: 'Press inclinado', en: 'Incline press' },
      blurb: { es: 'Pecho alto, ángulo de película.', en: 'Upper chest, movie angle.' },
      minKg: 20, maxKg: 140, step: 5, baseKg: 35, reps: 8,
    },
    {
      id: 'ohp',
      name: { es: 'Press militar', en: 'Overhead press' },
      blurb: { es: 'Hombros al cielo, core firme.', en: 'Shoulders to the sky, tight core.' },
      minKg: 15, maxKg: 100, step: 2.5, baseKg: 25, reps: 8,
    },
    {
      id: 'dips',
      name: { es: 'Fondos lastrados', en: 'Weighted dips' },
      blurb: { es: 'Peso corporal más disco colgado.', en: 'Bodyweight plus a hanging plate.' },
      minKg: 0, maxKg: 60, step: 5, baseKg: 10, reps: 10,
    },
    {
      id: 'fly',
      name: { es: 'Aperturas', en: 'Chest fly' },
      blurb: { es: 'Lento y controlado, se siente todo.', en: 'Slow and controlled, feel it all.' },
      minKg: 5, maxKg: 50, step: 2.5, baseKg: 12.5, reps: 12,
    },
  ]),
  ...build('pull', [
    {
      id: 'bar-row',
      name: { es: 'Remo con barra', en: 'Barbell row' },
      blurb: { es: 'Espalda ancha, codos atrás.', en: 'Wide back, elbows back.' },
      minKg: 20, maxKg: 140, step: 5, baseKg: 40, reps: 8,
    },
    {
      id: 'lat-pulldown',
      name: { es: 'Jalón al pecho', en: 'Lat pulldown' },
      blurb: { es: 'La máquina favorita del lunes.', en: 'Monday favorite machine.' },
      minKg: 20, maxKg: 120, step: 5, baseKg: 35, reps: 10,
    },
    {
      id: 'db-row',
      name: { es: 'Remo mancuerna', en: 'Dumbbell row' },
      blurb: { es: 'Un brazo, toda la concentración.', en: 'One arm, full focus.' },
      minKg: 10, maxKg: 70, step: 2.5, baseKg: 22.5, reps: 10,
    },
    {
      id: 'pullup',
      name: { es: 'Dominadas lastradas', en: 'Weighted pull-ups' },
      blurb: { es: 'Hacia arriba con peso extra.', en: 'Up with extra weight.' },
      minKg: 0, maxKg: 50, step: 5, baseKg: 10, reps: 8,
    },
    {
      id: 'rdl',
      name: { es: 'Peso muerto rumano', en: 'Romanian deadlift' },
      blurb: { es: 'Bisagra perfecta de cadera.', en: 'Perfect hip hinge.' },
      minKg: 20, maxKg: 180, step: 5, baseKg: 50, reps: 8,
    },
    {
      id: 'deadlift',
      name: { es: 'Peso muerto', en: 'Deadlift' },
      blurb: { es: 'Del suelo al cielo. Respira y tira.', en: 'Floor to sky. Breathe and pull.' },
      minKg: 40, maxKg: 260, step: 10, baseKg: 70, reps: 5,
    },
  ]),
  ...build('legs', [
    {
      id: 'squat',
      name: { es: 'Sentadilla', en: 'Back squat' },
      blurb: { es: 'La reina. Profundidad con orgullo.', en: 'The queen. Depth with pride.' },
      minKg: 20, maxKg: 220, step: 5, baseKg: 50, reps: 8,
    },
    {
      id: 'goblet',
      name: { es: 'Sentadilla goblet', en: 'Goblet squat' },
      blurb: { es: 'Kettlebell al pecho, espalda recta.', en: 'Kettlebell to chest, straight back.' },
      minKg: 8, maxKg: 48, step: 4, baseKg: 16, reps: 12,
    },
    {
      id: 'leg-press',
      name: { es: 'Prensa', en: 'Leg press' },
      blurb: { es: 'Carga seria sin miedo.', en: 'Serious load, no fear.' },
      minKg: 40, maxKg: 400, step: 10, baseKg: 90, reps: 10,
    },
    {
      id: 'lunges',
      name: { es: 'Zancadas', en: 'Lunges' },
      blurb: { es: 'Paso a paso hacia el nivel 50.', en: 'Step by step to level 50.' },
      minKg: 0, maxKg: 60, step: 2.5, baseKg: 12.5, reps: 10,
    },
    {
      id: 'front-squat',
      name: { es: 'Sentadilla frontal', en: 'Front squat' },
      blurb: { es: 'Codos arriba, cuádriceps ardiendo.', en: 'Elbows up, quads on fire.' },
      minKg: 20, maxKg: 180, step: 5, baseKg: 40, reps: 6,
    },
    {
      id: 'hack',
      name: { es: 'Hack squat', en: 'Hack squat' },
      blurb: { es: 'Máquina de leyendas.', en: 'Machine of legends.' },
      minKg: 20, maxKg: 240, step: 10, baseKg: 60, reps: 10,
    },
  ]),
]

export function exercisesFor(station: StationId) {
  return EXERCISES.filter((e) => e.station === station)
}

export function exerciseById(id: string) {
  return EXERCISES.find((e) => e.id === id)
}
