import type { GameStore } from './store'
import { bestLevel } from './store'
import { todayKey } from './economy'
import { ACHIEVEMENTS } from '../data/achievements'

export function claimableMissions(s: GameStore) {
  return s.missions.list.filter((m) => !m.claimed && m.progress >= m.target).length
}

export function achievementValue(s: GameStore, id: string) {
  const a = ACHIEVEMENTS.find((x) => x.id === id)!
  return a.value({ lifetime: s.lifetime, bestLevel: bestLevel(s), unlockedCount: s.unlocked.length })
}

export function claimableAchievements(s: GameStore) {
  return ACHIEVEMENTS.filter(
    (a) => !s.achievements.includes(a.id) && achievementValue(s, a.id) >= a.target,
  ).length
}

export function dailyAvailable(s: GameStore) {
  return s.daily.last !== todayKey()
}
