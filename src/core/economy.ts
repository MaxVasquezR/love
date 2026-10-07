export const MAX_ENERGY = 8
export const ENERGY_REGEN_MS = 4 * 60 * 1000
export const ENERGY_REFILL_COST = 150

export const MIDGAME_COOLDOWN_MS = 3 * 60 * 1000
export const SKIN_TRIAL_MS = 10 * 60 * 1000

export const DAILY_REWARDS = [50, 75, 100, 150, 200, 300, 500]

export const OFFLINE_MIN_MS = 10 * 60 * 1000
export const OFFLINE_MAX_HOURS = 8

export function offlineRatePerHour(level: number) {
  return 10 + level * 4
}

export function offlineCoins(level: number, awayMs: number) {
  const hours = Math.min(OFFLINE_MAX_HOURS, awayMs / 3_600_000)
  return Math.floor(hours * offlineRatePerHour(level))
}

export function regenEnergy(energy: number, updatedAt: number, now: number) {
  if (energy >= MAX_ENERGY) return { energy, updatedAt: now }
  const gained = Math.floor((now - updatedAt) / ENERGY_REGEN_MS)
  if (gained <= 0) return { energy, updatedAt }
  const next = Math.min(MAX_ENERGY, energy + gained)
  return {
    energy: next,
    updatedAt: next >= MAX_ENERGY ? now : updatedAt + gained * ENERGY_REGEN_MS,
  }
}

export function msToNextEnergy(energy: number, updatedAt: number, now: number) {
  if (energy >= MAX_ENERGY) return 0
  return Math.max(0, ENERGY_REGEN_MS - (now - updatedAt))
}

export function todayKey(now = Date.now()) {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function yesterdayKey(now = Date.now()) {
  return todayKey(now - 86_400_000)
}

/** Missed days a broken daily streak can still be saved by watching an ad. */
export const STREAK_SAVE_DAYS = 2

/** True when the streak broke recently enough (1-2 missed days) to be saved with an ad. */
export function streakSavable(daily: { last: string | null; streak: number }, now = Date.now()) {
  if (!daily.last || daily.streak < 2) return false
  for (let missed = 1; missed <= STREAK_SAVE_DAYS; missed++) {
    if (daily.last === todayKey(now - (missed + 1) * 86_400_000)) return true
  }
  return false
}

export function formatMs(ms: number) {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export function isSunday(now = Date.now()) {
  return new Date(now).getDay() === 0
}

export const BOX_MS = 4 * 60 * 60 * 1000
export const BOOST_MS = 15 * 60 * 1000
export const ROUTINE_ENERGY = 2
export const QUIZ_REWARD = 30
export const SHARE_REWARD = 40
export const CHALLENGE_REWARD = 150
/** Extra lucas for beating a rematch (a challenge that came back heavier). */
export const REMATCH_BONUS = 100
/** Paid to whoever sent a challenge when the friend beats it and sends it back. */
export const RECRUIT_REWARD = 200
export const RECRUITS_PER_DAY = 3
export const STR_BOOST = 1.1

export type BoxReward =
  | { kind: 'coins'; n: number }
  | { kind: 'energy'; n: number }
  | { kind: 'pre' }
  | { kind: 'crea' }

export function rollBox(level: number): BoxReward {
  const r = Math.random()
  if (r < 0.5) return { kind: 'coins', n: Math.round((40 + Math.random() * 80) * (1 + level * 0.05)) }
  if (r < 0.7) return { kind: 'energy', n: 3 }
  if (r < 0.85) return { kind: 'pre' }
  return { kind: 'crea' }
}

/** Epley estimate of the one-rep max. */
export function oneRepMax(kg: number, reps: number) {
  return Math.round(kg * (1 + reps / 30) * 2) / 2
}
