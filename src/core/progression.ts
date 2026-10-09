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
  /** Slowest the weight lets itself be lowered (range per second): heavier pulls down harder. */
  eccCreep: number
  /** Strength difference between arms that has to be corrected (share of speed). */
  wobble: number
  maxMisses: number
  /** 0..1 hidden help: high for new players and light weights. */
  assist: number
  /** How fast the bar levels itself (per second); 0 = the player has to level it. */
  sync: number
  tiltWarn: number
  tiltFail: number
  /** Descent speed that counts as letting the weight fall. */
  slamSpeed: number
  /** Letting go at the top just lowers the bar instead of dumping it. */
  gentle: boolean
  /** Profe spots per set. */
  assists: number
}

export type LiftStage = 'novice' | 'mid' | 'pro'

/** Which rules are on: novices only feel the bar, mids level it, pros also brake the descent. */
export function liftStage(level: number, sessions: number): LiftStage {
  if (sessions < 3 || level <= 3) return 'novice'
  return level <= 9 ? 'mid' : 'pro'
}

/** Hidden help 0..1 from the player's experience; going over the suggested weight takes it away. */
export function liftAssist(level: number, sessions: number, difficulty: number, load = 0.75): number {
  const stage = liftStage(level, sessions)
  const base =
    stage === 'novice' ? 0.9 : stage === 'mid' ? clamp(0.62 - (level - 4) * 0.04, 0.4, 0.62) : clamp(0.35 - (level - 10) * 0.05, 0, 0.35)
  const a = clamp(base + (load - difficulty) * 0.6, 0, 1)
  return stage === 'novice' ? Math.max(0.7, a) : Math.min(0.69, a)
}

/** `reps` / `load` come from the training goal: at the suggested weight the set ends about 2 reps short of failure. */
export function liftTuning(ex: Exercise, stats: Stats, weight: number, reps = 10, load = 0.75, assist = 0): LiftTuning {
  const difficulty = Math.max(0.2, weight / capacityKg(ex, stats))
  const a = clamp(assist, 0, 1)
  const tempoMin = Math.max(0.5, 0.9 - stats.tec * 0.01)
  return {
    difficulty,
    liftSpeed: clamp(1.9 - difficulty, 0.45, 1.6) * (1 + a * 0.25),
    repsInTank: clamp(reps + 3.2 + stats.end * 0.06 - (difficulty - load) * reps * 1.6, 1.2, 45) + a * 4,
    stallBase: clamp((difficulty - 0.75) * 2.2, 0, 0.9) * (1 - a * 0.7),
    tempoMin: tempoMin * (1 - a * 0.5),
    tempoMax: 2.6 + stats.tec * 0.04 + a,
    eccCreep: clamp(0.25 + difficulty * 0.45, 0.3, 0.95) * (1 - a * 0.2),
    wobble: clamp(0.05 + (difficulty - 0.5) * 0.3, 0.03, 0.35) * (1 - a * 0.7),
    maxMisses: 2,
    assist: a,
    sync: a * 6,
    tiltWarn: a >= 0.7 ? 9 : 0.1 + a * 0.1,
    tiltFail: a >= 0.7 ? 9 : 0.22 + a * 0.3,
    slamSpeed: a >= 0.4 ? 9 : 2 + a * 2,
    gentle: a >= 0.4,
    assists: a >= 0.7 ? 99 : a >= 0.3 ? 2 : 1,
  }
}

export function repXp(weight: number, difficulty: number, quality: RepQuality, combo: number) {
  if (quality === 'miss') return 0
  const base = 2 + Math.pow(Math.max(weight, 10), 0.7) * Math.min(difficulty, 1.6)
  const q = quality === 'perfect' ? 1.5 : quality === 'dirty' ? 0.5 : quality === 'assisted' ? 0.4 : 1
  const comboMult = 1 + Math.min(combo, 5) * 0.1
  return Math.round(base * q * comboMult)
}

export function sessionCoins(xp: number, perfectReps: number) {
  return Math.round(xp * 0.4 + perfectReps * 3)
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
