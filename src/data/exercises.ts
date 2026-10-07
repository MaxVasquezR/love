import type { Exercise, Goal, RigId, Station, StationId } from '../core/types'

export const STATIONS: Record<StationId, Station> = {
  push: { id: 'push', title: 'Empuje', muscles: 'Pecho · hombros · tríceps', unlockLevel: 1 },
  pull: { id: 'pull', title: 'Jalón', muscles: 'Espalda · bíceps · femorales', unlockLevel: 2 },
  legs: { id: 'legs', title: 'Pierna', muscles: 'Cuádriceps · glúteos · femorales', unlockLevel: 3 },
}

export const STATION_ORDER: StationId[] = ['push', 'pull', 'legs']

/** Machine shown when a station is picked but no exercise yet. */
export const STATION_RIG: Record<StationId, RigId> = { push: 'bench', pull: 'cable', legs: 'rack' }

export interface GoalDef {
  label: string
  sets: number
  reps: number
  /** Share of the athlete's capacity suggested for this goal. */
  load: number
  xpMult: number
  restSec: number
  restReal: string
  why: string
}

export const GOALS: Record<Goal, GoalDef> = {
  fuerza: {
    label: 'Fuerza',
    sets: 3,
    reps: 5,
    load: 0.92,
    xpMult: 1.25,
    restSec: 15,
    restReal: '2 a 3 minutos',
    why: 'Pocas reps con carga alta: entrena al sistema nervioso a mover más kilos.',
  },
  hipertrofia: {
    label: 'Hipertrofia',
    sets: 3,
    reps: 10,
    load: 0.75,
    xpMult: 1,
    restSec: 12,
    restReal: '60 a 90 segundos',
    why: '8 a 12 reps cerca del fallo: el rango clásico para ganar masa muscular.',
  },
  resistencia: {
    label: 'Resistencia',
    sets: 2,
    reps: 15,
    load: 0.55,
    xpMult: 0.9,
    restSec: 8,
    restReal: '30 a 45 segundos',
    why: 'Muchas reps con poco peso: mejora la resistencia muscular y el bombeo.',
  },
}

export const GOAL_ORDER: Goal[] = ['fuerza', 'hipertrofia', 'resistencia']

const UNLOCKS = [1, 1, 3, 5, 8, 12]

type Raw = Omit<Exercise, 'station' | 'unlockLevel'>

function build(station: StationId, list: Raw[]): Exercise[] {
  return list.map((e, i) => ({ ...e, station, unlockLevel: UNLOCKS[i] ?? 15 }))
}

export const EXERCISES: Exercise[] = [
  ...build('push', [
    {
      id: 'bench-bar',
      rig: 'bench',
      groups: ['chest', 'shoulders', 'triceps'],
      name: 'Press de banca',
      blurb: 'El clásico de todos los lunes. Barra, banco y ego bajo control.',
      muscles: 'Pectoral mayor, deltoides anterior y tríceps',
      cues: [
        'Escápulas juntas y hacia abajo, pecho arriba.',
        'Baja la barra a la altura del esternón, codos a unos 45°.',
        'Pies firmes en el piso y empuja en línea recta.',
      ],
      mistakes: ['Rebotar la barra en el pecho.', 'Levantar los glúteos del banco.', 'Abrir los codos a 90°.'],
      minKg: 20, maxKg: 160, step: 5, baseKg: 40,
    },
    {
      id: 'bench-db',
      rig: 'adjustable',
      groups: ['chest', 'shoulders', 'triceps'],
      name: 'Press con mancuernas',
      blurb: 'Más rango de movimiento y cada brazo trabaja por su cuenta.',
      muscles: 'Pectoral, deltoides anterior y tríceps',
      cues: [
        'Baja hasta sentir el estiramiento del pecho.',
        'Junta las mancuernas arriba sin chocarlas.',
        'Muñecas rectas, sobre los codos.',
      ],
      mistakes: ['Bajar a medias.', 'Dejar caer las mancuernas sin control.'],
      minKg: 10, maxKg: 70, step: 2.5, baseKg: 20,
    },
    {
      id: 'incline',
      rig: 'adjustable',
      groups: ['chest', 'shoulders'],
      name: 'Press inclinado',
      blurb: 'Pecho alto para que el polo te quede pintado.',
      muscles: 'Pectoral superior (clavicular) y deltoides',
      cues: ['Banco entre 30° y 45°.', 'Baja la barra hacia la parte alta del pecho.', 'Mantén la espalda pegada.'],
      mistakes: ['Inclinar demasiado el banco: se vuelve hombro.', 'Arquear de más la espalda.'],
      minKg: 20, maxKg: 140, step: 5, baseKg: 35,
    },
    {
      id: 'ohp',
      rig: 'rack',
      groups: ['shoulders', 'triceps', 'abs'],
      name: 'Press militar',
      blurb: 'Hombros redondos como pelota de vóley.',
      muscles: 'Deltoides anterior y medio, tríceps y core',
      cues: ['Aprieta glúteos y abdomen.', 'La barra sube pegada a la cara.', 'Mete la cabeza "por la ventana" al final.'],
      mistakes: ['Echarse hacia atrás arqueando la lumbar.', 'Usar impulso de piernas.'],
      minKg: 15, maxKg: 100, step: 2.5, baseKg: 25,
    },
    {
      id: 'dips',
      rig: 'tower',
      groups: ['triceps', 'chest', 'shoulders'],
      name: 'Fondos lastrados',
      blurb: 'Peso corporal más disco colgado del cinturón.',
      muscles: 'Tríceps, pectoral inferior y deltoides anterior',
      cues: ['Baja hasta que el brazo quede paralelo al piso.', 'Codos hacia atrás, no hacia afuera.', 'Sube sin bloquear de golpe.'],
      mistakes: ['Bajar demasiado y forzar el hombro.', 'Balancearse.'],
      minKg: 0, maxKg: 60, step: 5, baseKg: 10,
    },
    {
      id: 'fly',
      rig: 'adjustable',
      groups: ['chest'],
      name: 'Aperturas',
      blurb: 'Lento y controlado. Aquí se siente todo.',
      muscles: 'Pectoral mayor',
      cues: ['Codos ligeramente flexionados todo el tiempo.', 'Abre como si abrazaras un árbol.', 'Controla la bajada en 2 segundos.'],
      mistakes: ['Usar demasiado peso y convertirlo en press.', 'Estirar los brazos por completo.'],
      minKg: 5, maxKg: 50, step: 2.5, baseKg: 12.5,
    },
  ]),
  ...build('pull', [
    {
      id: 'bar-row',
      rig: 'platform',
      groups: ['back', 'biceps', 'forearms'],
      name: 'Remo con barra',
      blurb: 'Espalda ancha, codos hacia atrás.',
      muscles: 'Dorsal ancho, romboides, trapecio medio y bíceps',
      cues: ['Torso inclinado unos 45°, espalda neutra.', 'Lleva la barra al ombligo.', 'Aprieta las escápulas arriba.'],
      mistakes: ['Encorvar la espalda.', 'Tirar con los brazos y no con la espalda.'],
      minKg: 20, maxKg: 140, step: 5, baseKg: 40,
    },
    {
      id: 'lat-pulldown',
      rig: 'cable',
      groups: ['back', 'biceps'],
      name: 'Jalón al pecho',
      blurb: 'La máquina que todos quieren a las 7 p. m.',
      muscles: 'Dorsal ancho, redondo mayor y bíceps',
      cues: ['Pecho arriba e inclínate un poquito atrás.', 'Baja la barra a la parte alta del pecho.', 'Piensa en llevar los codos al bolsillo.'],
      mistakes: ['Jalar detrás de la nuca.', 'Balancear el cuerpo para bajar el peso.'],
      minKg: 20, maxKg: 120, step: 5, baseKg: 35,
    },
    {
      id: 'db-row',
      rig: 'dumbbells',
      groups: ['back', 'biceps'],
      name: 'Remo con mancuerna',
      blurb: 'Un brazo, toda la concentración.',
      muscles: 'Dorsal ancho, romboides y bíceps',
      cues: ['Apoya mano y rodilla en el banco.', 'Lleva la mancuerna hacia la cadera.', 'No gires el torso.'],
      mistakes: ['Rotar el tronco para subir.', 'Subir el hombro hacia la oreja.'],
      minKg: 10, maxKg: 70, step: 2.5, baseKg: 22.5,
    },
    {
      id: 'pullup',
      rig: 'tower',
      groups: ['back', 'biceps', 'forearms'],
      name: 'Dominadas lastradas',
      blurb: 'El examen final de la espalda.',
      muscles: 'Dorsal ancho, bíceps y core',
      cues: ['Empieza colgado con los brazos estirados.', 'Saca pecho y sube hasta pasar el mentón.', 'Baja controlado.'],
      mistakes: ['Hacer medio rango.', 'Patalear para ayudarte.'],
      minKg: 0, maxKg: 50, step: 5, baseKg: 10,
    },
    {
      id: 'rdl',
      rig: 'platform',
      groups: ['hamstrings', 'glutes', 'back'],
      name: 'Peso muerto rumano',
      blurb: 'La bisagra de cadera perfecta.',
      muscles: 'Femorales, glúteos y erectores espinales',
      cues: ['Rodillas apenas flexionadas.', 'Lleva la cadera atrás como cerrando una puerta con el poto.', 'La barra roza los muslos.'],
      mistakes: ['Redondear la espalda.', 'Convertirlo en sentadilla.'],
      minKg: 20, maxKg: 180, step: 5, baseKg: 50,
    },
    {
      id: 'deadlift',
      rig: 'platform',
      groups: ['glutes', 'hamstrings', 'back', 'forearms'],
      name: 'Peso muerto',
      blurb: 'Del piso al cielo. Respira, aprieta y jala.',
      muscles: 'Cadena posterior completa: glúteos, femorales, espalda y trapecios',
      cues: ['Barra sobre la mitad del pie.', 'Respira profundo y aprieta el core antes de jalar.', 'Empuja el piso con las piernas.'],
      mistakes: ['Espalda redonda.', 'Alejar la barra del cuerpo.', 'Hiperextender arriba.'],
      minKg: 40, maxKg: 260, step: 10, baseKg: 70,
    },
  ]),
  ...build('legs', [
    {
      id: 'squat',
      rig: 'rack',
      groups: ['quads', 'glutes', 'abs'],
      name: 'Sentadilla',
      blurb: 'La reina de los ejercicios. Profundidad con orgullo.',
      muscles: 'Cuádriceps, glúteos, aductores y core',
      cues: ['Pies al ancho de hombros, puntas un poco afuera.', 'Rodillas en la dirección de los pies.', 'Baja hasta que la cadera pase la rodilla.'],
      mistakes: ['Rodillas hacia adentro.', 'Levantar los talones.', 'Bajar a medias por ego.'],
      minKg: 20, maxKg: 220, step: 5, baseKg: 50,
    },
    {
      id: 'goblet',
      rig: 'dumbbells',
      groups: ['quads', 'glutes', 'abs'],
      name: 'Sentadilla goblet',
      blurb: 'Kettlebell al pecho, espalda recta.',
      muscles: 'Cuádriceps, glúteos y core',
      cues: ['Sujeta la pesa pegada al pecho.', 'Codos por dentro de las rodillas al bajar.', 'Torso lo más vertical posible.'],
      mistakes: ['Inclinarse hacia adelante.', 'Despegar los talones.'],
      minKg: 8, maxKg: 48, step: 4, baseKg: 16,
    },
    {
      id: 'leg-press',
      rig: 'legpress',
      groups: ['quads', 'glutes'],
      name: 'Prensa',
      blurb: 'Carga seria sin miedo.',
      muscles: 'Cuádriceps y glúteos',
      cues: ['Espalda baja pegada al respaldo.', 'Baja hasta 90° de rodilla.', 'Empuja con todo el pie.'],
      mistakes: ['Bloquear las rodillas arriba.', 'Despegar la cadera del asiento.'],
      minKg: 40, maxKg: 400, step: 10, baseKg: 90,
    },
    {
      id: 'lunges',
      rig: 'dumbbells',
      groups: ['quads', 'glutes', 'hamstrings'],
      name: 'Zancadas',
      blurb: 'Paso a paso hacia el nivel 50.',
      muscles: 'Cuádriceps, glúteos y estabilizadores',
      cues: ['Paso largo y baja vertical.', 'La rodilla de atrás casi toca el piso.', 'Torso recto.'],
      mistakes: ['Paso muy corto.', 'Rodilla de adelante hacia adentro.'],
      minKg: 0, maxKg: 60, step: 2.5, baseKg: 12.5,
    },
    {
      id: 'front-squat',
      rig: 'rack',
      groups: ['quads', 'abs', 'back'],
      name: 'Sentadilla frontal',
      blurb: 'Codos arriba y cuádriceps ardiendo.',
      muscles: 'Cuádriceps, core y espalda alta',
      cues: ['Barra sobre los hombros, codos bien altos.', 'Torso vertical.', 'Baja profundo con control.'],
      mistakes: ['Dejar caer los codos.', 'Redondear la espalda alta.'],
      minKg: 20, maxKg: 180, step: 5, baseKg: 40,
    },
    {
      id: 'hip-thrust',
      rig: 'platform',
      groups: ['glutes', 'hamstrings'],
      name: 'Hip thrust',
      blurb: 'El favorito de la zona de glúteos.',
      muscles: 'Glúteo mayor y femorales',
      cues: ['Espalda alta apoyada en el banco.', 'Barra sobre la cadera con almohadilla.', 'Aprieta glúteos arriba 1 segundo.'],
      mistakes: ['Arquear la lumbar en vez de extender la cadera.', 'Pies muy lejos o muy cerca.'],
      minKg: 20, maxKg: 240, step: 10, baseKg: 60,
    },
  ]),
]

export function exercisesFor(station: StationId) {
  return EXERCISES.filter((e) => e.station === station)
}

export function exerciseById(id: string) {
  return EXERCISES.find((e) => e.id === id)
}

export function exerciseName(id: string) {
  return exerciseById(id)?.name ?? id
}
