import type { PlayerId, StationId } from '../types'

export const CHAT: Record<string, string[]> = {
  lobby: [
    '¿Lista para romperla?',
    'Hoy sumamos juntos ♥',
    'Domingo descansamos… hoy no',
    'Te veo fuerte hoy',
  ],
  walk: [
    'Yo voy a esa máquina',
    'Nos vemos en el centro',
    '¡Ocupo esta!',
    'Tú allá, yo acá',
  ],
  lift: [
    '¡Vamos, amor!',
    'Respira… y sube',
    'Esa forma está perfecta',
    'Últimas reps',
    'Te estoy mirando ♥',
    '¡Qué peso!',
    'Core firme',
    'Casi… casi…',
  ],
  cheer: [
    '¡Eso!',
    'PR de pareja',
    'Batido después',
    'Orgullosa de ti',
    'Orgulloso de ti',
  ],
  between: [
    'Cambiamos de máquina',
    '¿Otra ronda?',
    'Me duele rico',
    'Tú brillaste',
  ],
}

export function lineFor(
  phase: keyof typeof CHAT,
  player: PlayerId,
  station?: StationId,
): string {
  const pool = [...CHAT[phase]]
  if (station === 'legs') pool.push('¡Sentadilla profunda!')
  if (station === 'push') pool.push('Pecho al cielo')
  if (station === 'pull') pool.push('Espalda ancha')
  if (player === 'ana' && phase === 'cheer') return 'Orgullosa de ti ♥'
  if (player === 'max' && phase === 'cheer') return 'Orgulloso de ti ♥'
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Rounds: always different machines, like a real gym floor */
export const ROUNDS: { max: StationId; ana: StationId }[] = [
  { max: 'push', ana: 'pull' },
  { max: 'legs', ana: 'push' },
  { max: 'pull', ana: 'legs' },
]
