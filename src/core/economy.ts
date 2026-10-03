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

export function formatMs(ms: number) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
