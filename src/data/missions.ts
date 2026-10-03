import type { Lang, MissionState, MissionTemplateId, SessionResult, StationId } from '../core/types'
import { STATIONS, STATION_ORDER } from './exercises'

interface Template {
  id: MissionTemplateId
  targets: number[]
  reward: (target: number) => number
  text: (target: number, lang: Lang, station?: StationId) => string
}

const TEMPLATES: Template[] = [
  {
    id: 'reps',
    targets: [20, 30, 40],
    reward: (t) => 40 + t * 2,
    text: (t, l) => (l === 'es' ? `Haz ${t} reps buenas` : `Do ${t} good reps`),
  },
  {
    id: 'perfect',
    targets: [5, 8, 12],
    reward: (t) => 50 + t * 8,
    text: (t, l) => (l === 'es' ? `Logra ${t} reps perfectas` : `Land ${t} perfect reps`),
  },
  {
    id: 'station',
    targets: [2, 3],
    reward: (t) => 60 + t * 25,
    text: (t, l, s) => {
      const name = s ? STATIONS[s].title[l] : ''
      return l === 'es' ? `Completa ${t} series de ${name}` : `Finish ${t} ${name} sets`
    },
  },
  {
    id: 'kg',
    targets: [1500, 3000, 5000],
    reward: (t) => 50 + Math.round(t / 40),
    text: (t, l) => (l === 'es' ? `Mueve ${t} kg en total` : `Move ${t} kg in total`),
  },
  {
    id: 'sessions',
    targets: [3, 4],
    reward: (t) => 50 + t * 20,
    text: (t, l) => (l === 'es' ? `Entrena ${t} veces` : `Train ${t} times`),
  },
  {
    id: 'combo',
    targets: [5, 7],
    reward: (t) => 60 + t * 12,
    text: (t, l) => (l === 'es' ? `Haz un combo de ${t}` : `Hit a ${t} combo`),
  },
]

function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 10000) / 10000
  }
}

export function generateMissions(dateKey: string): MissionState[] {
  const rand = seeded(dateKey)
  const pool = [...TEMPLATES]
  const picked: MissionState[] = []
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rand() * pool.length)
    const tpl = pool.splice(idx, 1)[0]
    const target = tpl.targets[Math.floor(rand() * tpl.targets.length)]
    const station =
      tpl.id === 'station' ? STATION_ORDER[Math.floor(rand() * STATION_ORDER.length)] : undefined
    picked.push({
      id: `${dateKey}-${tpl.id}`,
      template: tpl.id,
      target,
      progress: 0,
      station,
      reward: tpl.reward(target),
      claimed: false,
    })
  }
  return picked
}

export function missionText(m: MissionState, lang: Lang) {
  const tpl = TEMPLATES.find((t) => t.id === m.template)!
  return tpl.text(m.target, lang, m.station)
}

export function advanceMission(m: MissionState, r: SessionResult): MissionState {
  if (m.claimed) return m
  let add = 0
  switch (m.template) {
    case 'reps':
      add = r.goodReps
      break
    case 'perfect':
      add = r.perfectReps
      break
    case 'station':
      add = r.station === m.station && !r.failed ? 1 : 0
      break
    case 'kg':
      add = Math.max(r.weight, 10) * r.goodReps
      break
    case 'sessions':
      add = 1
      break
    case 'combo':
      return { ...m, progress: Math.min(m.target, Math.max(m.progress, r.maxCombo)) }
  }
  return { ...m, progress: Math.min(m.target, m.progress + add) }
}
