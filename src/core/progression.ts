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

/** Suggested working weight for a training goal (`load` = share of capacity, see GOALS). */
export function suggestedKgFor(ex: Exercise, stats: Stats, load: number): number {
  const raw = Math.min(ex.maxKg, capacityKg(ex, stats) * load)
  return clampKg(ex, Math.round(raw / ex.step) * ex.step)
}

export function clampKg(ex: Exercise, kg: number): number {
  return Math.min(ex.maxKg, Math.max(ex.minKg, Number(kg.toFixed(1))))
}

export interface LiftTuning {
  difficulty: number
  /** Bar travel per second (share of the range) with a fresh tank. */
  liftSpeed: number
  /** Reps the athlete has before failure at this weight. */
  repsInTank: number
  /** Sticking-point resistance with a fresh tank (0 = none). */
  stallBase: number
  /** Controlled lowering window (seconds) that makes a rep perfect. */
  tempoMin: number
  tempoMax: number
  maxMisses: number
}

/** `reps` / `load` come from the training goal: at the suggested weight the set ends about 2 reps short of failure. */
export function liftTuning(ex: Exercise, stats: Stats, weight: number, reps = 10, load = 0.75): LiftTuning {
  const difficulty = Math.max(0.2, weight / capacityKg(ex, stats))
  return {
    difficulty,
    liftSpeed: clamp(1.9 - difficulty, 0.45, 1.6),
    repsInTank: clamp(reps + 2.8 + stats.end * 0.06 - (difficulty - load) * reps * 1.6, 1.2, 45),
    stallBase: clamp((difficulty - 0.75) * 2.2, 0, 0.9),
    tempoMin: Math.max(0.5, 0.9 - stats.tec * 0.01),
    tempoMax: 2.6 + stats.tec * 0.04,
    maxMisses: 2,
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
