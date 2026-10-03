import type { CharacterId, EquipmentId, Exercise, RepQuality, Stats } from './types'
import { CHARACTERS } from '../data/characters'
import { EQUIPMENT } from '../data/equipment'

export const MAX_LEVEL = 50

/** XP needed to go from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5))
}

export function applyXp(level: number, xp: number, gained: number) {
  let lvl = level
  let cur = xp + gained
  let levelsGained = 0
  while (lvl < MAX_LEVEL && cur >= xpForLevel(lvl)) {
    cur -= xpForLevel(lvl)
    lvl += 1
    levelsGained += 1
  }
  if (lvl >= MAX_LEVEL) cur = 0
  return { level: lvl, xp: cur, levelsGained }
}

export function statsFor(
  characterId: CharacterId,
  level: number,
  equipment: EquipmentId[],
): Stats {
  const c = CHARACTERS[characterId]
  const stats: Stats = {
    str: c.base.str + c.growth.str * (level - 1),
    end: c.base.end + c.growth.end * (level - 1),
    tec: c.base.tec + c.growth.tec * (level - 1),
  }
  for (const id of equipment) {
    const bonus = EQUIPMENT[id].bonus
    stats.str += bonus.str ?? 0
    stats.end += bonus.end ?? 0
    stats.tec += bonus.tec ?? 0
  }
  return {
    str: Math.round(stats.str),
    end: Math.round(stats.end),
    tec: Math.round(stats.tec),
  }
}

/** Weight the character can move comfortably for this exercise. */
export function capacityKg(ex: Exercise, stats: Stats): number {
  return Math.max(ex.minKg + ex.step, ex.baseKg * (0.6 + stats.str / 25))
}

export function suggestedKg(ex: Exercise, stats: Stats): number {
  const raw = Math.min(ex.maxKg, capacityKg(ex, stats) * 0.8)
  const stepped = Math.round(raw / ex.step) * ex.step
  return clampKg(ex, stepped)
}

export function clampKg(ex: Exercise, kg: number): number {
  return Math.min(ex.maxKg, Math.max(ex.minKg, Number(kg.toFixed(1))))
}

export interface LiftTuning {
  difficulty: number
  zoneWidth: number
  perfectWidth: number
  speed: number
  maxMisses: number
}

export function liftTuning(ex: Exercise, stats: Stats, weight: number): LiftTuning {
  const difficulty = Math.max(0.2, weight / capacityKg(ex, stats))
  const zoneWidth = clamp(34 - (difficulty - 0.5) * 30 + stats.tec * 0.4 - 4, 6, 40)
  const speed = clamp(1.2 + difficulty * 0.9 - stats.end * 0.02, 0.9, 3.2)
  return {
    difficulty,
    zoneWidth,
    perfectWidth: Math.max(2.5, zoneWidth * 0.22),
    speed,
    maxMisses: 3,
  }
}

export function repXp(weight: number, difficulty: number, quality: RepQuality, combo: number) {
  if (quality === 'miss') return 0
  const base = 2 + Math.pow(Math.max(weight, 10), 0.7) * Math.min(difficulty, 1.6)
  const q = quality === 'perfect' ? 1.5 : 1
  const comboMult = 1 + Math.min(combo, 5) * 0.1
  return Math.round(base * q * comboMult)
}

export function sessionCoins(xp: number, perfectReps: number) {
  return Math.round(xp * 0.4 + perfectReps * 3)
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
