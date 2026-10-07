import type { MissionState, MissionTemplateId, SessionResult, StationId } from '../core/types'
import { STATIONS, STATION_ORDER } from './exercises'
import { getLang } from '../i18n'
import { MISSIONS_EN } from '../i18n/content.en'

interface Template {
  id: MissionTemplateId
  targets: number[]
  reward: (target: number) => number
  text: (target: number, station?: StationId) => string
}

const TEMPLATES: Template[] = [
  { id: 'reps', targets: [25, 40, 60], reward: (t) => 40 + t * 2, text: (t) => `Haz ${t} reps buenas` },
  { id: 'perfect', targets: [6, 10, 15], reward: (t) => 50 + t * 7, text: (t) => `Clava ${t} reps perfectas` },
  {
    id: 'station',
    targets: [2, 3],
    reward: (t) => 60 + t * 25,
    text: (t, s) => `Completa ${t} bloques de ${s ? STATIONS[s].title : ''}`,
  },
  { id: 'kg', targets: [2000, 4000, 7000], reward: (t) => 50 + Math.round(t / 50), text: (t) => `Mueve ${t.toLocaleString('es-PE')} kg en total` },
  { id: 'sessions', targets: [3, 4], reward: (t) => 50 + t * 20, text: (t) => `Entrena ${t} veces` },
  { id: 'combo', targets: [6, 8], reward: (t) => 60 + t * 12, text: (t) => `Haz un combo de ${t}` },
  { id: 'quiz', targets: [1, 2], reward: (t) => 60 + t * 30, text: (t) => `Responde bien ${t} ${t > 1 ? 'preguntas' : 'pregunta'} de la Profe` },
  { id: 'routine', targets: [1], reward: () => 180, text: () => 'Completa una rutina o circuito' },
  { id: 'pr', targets: [1], reward: () => 150, text: () => 'Rompe un récord personal' },
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

function makeMission(tpl: Template, rand: () => number, idPrefix: string): MissionState {
  const target = tpl.targets[Math.floor(rand() * tpl.targets.length)]
  const station = tpl.id === 'station' ? STATION_ORDER[Math.floor(rand() * STATION_ORDER.length)] : undefined
  return {
    id: `${idPrefix}-${tpl.id}`,
    template: tpl.id,
    target,
    progress: 0,
    station,
    reward: tpl.reward(target),
    claimed: false,
  }
}

export function generateMissions(dateKey: string): MissionState[] {
  const rand = seeded(dateKey)
  const pool = [...TEMPLATES]
  const picked: MissionState[] = []
  for (let i = 0; i < 3; i++) {
    const tpl = pool.splice(Math.floor(rand() * pool.length), 1)[0]
    picked.push(makeMission(tpl, rand, dateKey))
  }
  return picked
}

/** Replaces a mission with a different template not already in the list. */
export function rerollMission(list: MissionState[], id: string): MissionState[] {
  const used = new Set(list.map((m) => m.template))
  const pool = TEMPLATES.filter((t) => !used.has(t.id))
  if (!pool.length) return list
  const tpl = pool[Math.floor(Math.random() * pool.length)]
  const fresh = makeMission(tpl, Math.random, `${id}-r${Date.now() % 100000}`)
  return list.map((m) => (m.id === id ? fresh : m))
}

export function missionText(m: MissionState) {
  if (getLang() === 'en') return MISSIONS_EN[m.template](m.target, m.station ? STATIONS[m.station].title : '')
  const tpl = TEMPLATES.find((t) => t.id === m.template)
  return tpl ? tpl.text(m.target, m.station) : ''
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
    case 'routine':
      add = r.routine && !r.failed ? 1 : 0
      break
    case 'pr':
      add = r.newPr ? 1 : 0
      break
  }
  return { ...m, progress: Math.min(m.target, m.progress + add) }
}

export function advanceQuizMissions(list: MissionState[]): MissionState[] {
  return list.map((m) =>
    m.template === 'quiz' && !m.claimed ? { ...m, progress: Math.min(m.target, m.progress + 1) } : m,
  )
}
