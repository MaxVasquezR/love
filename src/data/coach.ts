import type { Lang } from '../core/types'

export type CoachMoment =
  | 'welcome'
  | 'tip'
  | 'pickStation'
  | 'preLift'
  | 'perfect'
  | 'good'
  | 'miss'
  | 'combo'
  | 'failed'
  | 'done'
  | 'levelUp'
  | 'noEnergy'
  | 'missionReady'
  | 'shop'

type Lines = Record<CoachMoment, string[]>

const COACH: Record<Lang, Lines> = {
  es: {
    welcome: ['¡Llegaste! Hoy se entrena, {name}.', 'Bienvenido de vuelta, {name}. ¿Listo para sudar?', 'El hierro te extrañó, {name}.'],
    tip: [
      'Toca en la zona verde. El centro brillante es perfecto.',
      'Más peso da más XP, pero la zona se achica.',
      'Las misiones diarias pagan bien. Revísalas.',
      'El equipo de la tienda sube tus stats para siempre.',
      'Los combos multiplican tu XP. No los rompas.',
      'Vuelve mañana: la racha diaria crece cada día.',
    ],
    pickStation: ['¿Qué toca hoy? Elige estación.', 'Pecho, espalda o pierna. Tú mandas.'],
    preLift: ['Respira, aprieta el core... ¡arriba!', 'Elige un peso que puedas controlar.', 'Concentración total.'],
    perfect: ['¡PERFECTA!', '¡Eso es técnica!', '¡Limpísima!', '¡De manual!'],
    good: ['¡Buena!', 'Sigue así.', 'Bien, otra.', 'Eso es.'],
    miss: ['Tranquilo, la siguiente.', 'Ojo con el ritmo.', 'Controla la bajada.'],
    combo: ['¡Combo x{n}! ¡No pares!', '¡Estás en racha, x{n}!'],
    failed: ['Fallo muscular. Eso también es progreso.', 'Baja un poco el peso y vuelve.'],
    done: ['¡Serie completa! Así se construye un campeón.', '¡Gran trabajo! Mira esa XP.'],
    levelUp: ['¡SUBISTE DE NIVEL! Más fuerte que ayer.', '¡Nuevo nivel! Energía recargada.'],
    noEnergy: ['Sin energía. Descansa un poco o recárgala.', 'Hasta los campeones descansan.'],
    missionReady: ['¡Tienes una misión lista para cobrar!'],
    shop: ['El buen equipo hace al buen atleta.', 'Ese cinturón te quedaría increíble.'],
  },
  en: {
    welcome: ['You made it! Time to train, {name}.', 'Welcome back, {name}. Ready to sweat?', 'The iron missed you, {name}.'],
    tip: [
      'Tap in the green zone. The bright center is perfect.',
      'More weight gives more XP, but the zone shrinks.',
      'Daily missions pay well. Check them out.',
      'Shop gear boosts your stats forever.',
      'Combos multiply your XP. Keep them alive.',
      'Come back tomorrow: your daily streak grows.',
    ],
    pickStation: ['What is it today? Pick a station.', 'Chest, back or legs. Your call.'],
    preLift: ['Breathe, brace... up!', 'Pick a weight you can control.', 'Full focus.'],
    perfect: ['PERFECT!', 'That is technique!', 'Super clean!', 'Textbook!'],
    good: ['Good!', 'Keep going.', 'Nice, another.', 'That is it.'],
    miss: ['Easy, next one.', 'Watch the rhythm.', 'Control the descent.'],
    combo: ['Combo x{n}! Do not stop!', 'You are on fire, x{n}!'],
    failed: ['Muscle failure. That is progress too.', 'Drop the weight a bit and come back.'],
    done: ['Set complete! That is how champions are built.', 'Great work! Look at that XP.'],
    levelUp: ['LEVEL UP! Stronger than yesterday.', 'New level! Energy refilled.'],
    noEnergy: ['Out of energy. Rest a bit or refill.', 'Even champions rest.'],
    missionReady: ['You have a mission ready to claim!'],
    shop: ['Good gear makes a good athlete.', 'That belt would look great on you.'],
  },
}

const PLAYER: Record<Lang, Partial<Record<CoachMoment, string[]>>> = {
  es: {
    perfect: ['¡Vamos!', '¡Sí!', '¡Fácil!'],
    miss: ['Uff...', '¡Pesa!', 'Ay...'],
    done: ['¡Lo logré!', '¡Toma!'],
    levelUp: ['¡Más fuerte!', '¡Nivel nuevo!'],
    welcome: ['¡Hola coach!', '¡A darle!'],
  },
  en: {
    perfect: ['Let us go!', 'Yes!', 'Easy!'],
    miss: ['Oof...', 'Heavy!', 'Ugh...'],
    done: ['Nailed it!', 'Boom!'],
    levelUp: ['Stronger!', 'New level!'],
    welcome: ['Hey coach!', 'Let us do this!'],
  },
}

function pick(list: string[] | undefined) {
  if (!list?.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

export function coachLine(lang: Lang, moment: CoachMoment, vars: Record<string, string | number> = {}) {
  const line = pick(COACH[lang][moment]) ?? ''
  return line.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

export function playerLine(lang: Lang, moment: CoachMoment) {
  return pick(PLAYER[lang][moment])
}
