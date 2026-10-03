import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  CharacterId,
  CharacterLook,
  EquipmentId,
  Lang,
  Lifetime,
  MissionState,
  SessionResult,
  SkinId,
} from './types'
import { applyXp, statsFor } from './progression'
import {
  DAILY_REWARDS,
  ENERGY_REFILL_COST,
  MAX_ENERGY,
  SKIN_TRIAL_MS,
  regenEnergy,
  todayKey,
  yesterdayKey,
} from './economy'
import { CHARACTERS, CHARACTER_ORDER, SKINS, skinKey } from '../data/characters'
import { EQUIPMENT } from '../data/equipment'
import { advanceMission, generateMissions } from '../data/missions'
import { ACHIEVEMENTS } from '../data/achievements'
import { gameStorage } from './storage'

interface CharacterProgress {
  level: number
  xp: number
  skin: SkinId
}

interface GameData {
  lang: Lang
  selected: CharacterId | null
  unlocked: CharacterId[]
  progress: Record<CharacterId, CharacterProgress>
  coins: number
  energy: number
  energyAt: number
  equipment: EquipmentId[]
  skins: string[]
  skinTrial: { key: string; until: number } | null
  daily: { last: string | null; streak: number }
  missions: { date: string; list: MissionState[] }
  achievements: string[]
  lifetime: Lifetime
  lastSeen: number
  lastMidgame: number
}

export interface SessionOutcome {
  levelsGained: number
  newLevel: number
  unlockedNow: CharacterId[]
}

interface GameActions {
  setLang(lang: Lang): void
  selectCharacter(id: CharacterId): void
  buyCharacter(id: CharacterId): boolean
  syncEnergy(now?: number): void
  spendEnergy(): boolean
  refillEnergy(): void
  buyRefill(): boolean
  buyEquipment(id: EquipmentId): boolean
  buySkin(id: CharacterId, skin: SkinId): boolean
  setSkin(id: CharacterId, skin: SkinId): void
  startSkinTrial(id: CharacterId, skin: SkinId): void
  recordSession(r: SessionResult): SessionOutcome
  addCoins(n: number): void
  claimDaily(): number | null
  ensureMissions(): void
  claimMission(id: string): void
  claimAchievement(id: string): void
  touch(): void
  noteMidgame(): void
  noteAdWatched(): void
  resetAll(): void
}

export type GameStore = GameData & GameActions

const startProgress = (): Record<CharacterId, CharacterProgress> => ({
  max: { level: 1, xp: 0, skin: 'classic' },
  ana: { level: 1, xp: 0, skin: 'classic' },
  leo: { level: 1, xp: 0, skin: 'classic' },
  sofi: { level: 1, xp: 0, skin: 'classic' },
})

const initialData = (): GameData => ({
  lang: navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en',
  selected: null,
  unlocked: ['max', 'ana'],
  progress: startProgress(),
  coins: 100,
  energy: MAX_ENERGY,
  energyAt: Date.now(),
  equipment: [],
  skins: CHARACTER_ORDER.map((c) => skinKey(c, 'classic')),
  skinTrial: null,
  daily: { last: null, streak: 0 },
  missions: { date: todayKey(), list: generateMissions(todayKey()) },
  achievements: [],
  lifetime: {
    sessions: 0,
    reps: 0,
    perfectReps: 0,
    kg: 0,
    coinsEarned: 0,
    bestCombo: 0,
    bestStreak: 0,
    adsWatched: 0,
  },
  lastSeen: Date.now(),
  lastMidgame: 0,
})

export function bestLevel(s: Pick<GameData, 'progress' | 'unlocked'>) {
  return Math.max(...s.unlocked.map((id) => s.progress[id].level))
}

function freeUnlocks(s: GameData, best: number): CharacterId[] {
  return CHARACTER_ORDER.filter((id) => {
    const u = CHARACTERS[id].unlock
    return !s.unlocked.includes(id) && !('free' in u) && best >= u.level
  })
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setLang: (lang) => set({ lang }),

      selectCharacter: (id) => {
        if (get().unlocked.includes(id)) set({ selected: id })
      },

      buyCharacter: (id) => {
        const s = get()
        const u = CHARACTERS[id].unlock
        if (s.unlocked.includes(id) || 'free' in u || s.coins < u.coins) return false
        set({ coins: s.coins - u.coins, unlocked: [...s.unlocked, id] })
        return true
      },

      syncEnergy: (now = Date.now()) => {
        const s = get()
        const r = regenEnergy(s.energy, s.energyAt, now)
        if (r.energy !== s.energy || r.updatedAt !== s.energyAt) {
          set({ energy: r.energy, energyAt: r.updatedAt })
        }
      },

      spendEnergy: () => {
        get().syncEnergy()
        const s = get()
        if (s.energy <= 0) return false
        set({
          energy: s.energy - 1,
          energyAt: s.energy >= MAX_ENERGY ? Date.now() : s.energyAt,
        })
        return true
      },

      refillEnergy: () => set({ energy: MAX_ENERGY, energyAt: Date.now() }),

      buyRefill: () => {
        const s = get()
        if (s.coins < ENERGY_REFILL_COST) return false
        set({ coins: s.coins - ENERGY_REFILL_COST, energy: MAX_ENERGY, energyAt: Date.now() })
        return true
      },

      buyEquipment: (id) => {
        const s = get()
        const def = EQUIPMENT[id]
        if (s.equipment.includes(id) || s.coins < def.price) return false
        if (bestLevel(s) < def.level) return false
        set({ coins: s.coins - def.price, equipment: [...s.equipment, id] })
        return true
      },

      buySkin: (id, skin) => {
        const s = get()
        const key = skinKey(id, skin)
        const price = SKINS[skin].price
        if (s.skins.includes(key) || s.coins < price) return false
        set({
          coins: s.coins - price,
          skins: [...s.skins, key],
          progress: { ...s.progress, [id]: { ...s.progress[id], skin } },
        })
        return true
      },

      setSkin: (id, skin) => {
        const s = get()
        if (!s.skins.includes(skinKey(id, skin))) return
        set({ progress: { ...s.progress, [id]: { ...s.progress[id], skin } } })
      },

      startSkinTrial: (id, skin) =>
        set({ skinTrial: { key: skinKey(id, skin), until: Date.now() + SKIN_TRIAL_MS } }),

      recordSession: (r) => {
        const s = get()
        const prog = s.progress[r.characterId]
        const lv = applyXp(prog.level, prog.xp, r.xp)
        const progress = {
          ...s.progress,
          [r.characterId]: { ...prog, level: lv.level, xp: lv.xp },
        }
        const kg = Math.max(r.weight, 10) * r.goodReps
        const lifetime: Lifetime = {
          ...s.lifetime,
          sessions: s.lifetime.sessions + 1,
          reps: s.lifetime.reps + r.goodReps,
          perfectReps: s.lifetime.perfectReps + r.perfectReps,
          kg: s.lifetime.kg + kg,
          coinsEarned: s.lifetime.coinsEarned + r.coins,
          bestCombo: Math.max(s.lifetime.bestCombo, r.maxCombo),
        }
        const missions = {
          ...s.missions,
          list: s.missions.list.map((m) => advanceMission(m, r)),
        }
        const next: GameData = {
          ...s,
          progress,
          lifetime,
          missions,
          coins: s.coins + r.coins,
        }
        const unlockedNow = freeUnlocks(next, bestLevel(next))
        set({
          progress,
          lifetime,
          missions,
          coins: next.coins,
          unlocked: [...s.unlocked, ...unlockedNow],
          ...(lv.levelsGained > 0 ? { energy: MAX_ENERGY, energyAt: Date.now() } : {}),
        })
        return { levelsGained: lv.levelsGained, newLevel: lv.level, unlockedNow }
      },

      addCoins: (n) =>
        set((s) => ({
          coins: s.coins + n,
          lifetime: { ...s.lifetime, coinsEarned: s.lifetime.coinsEarned + n },
        })),

      claimDaily: () => {
        const s = get()
        const today = todayKey()
        if (s.daily.last === today) return null
        const streak = s.daily.last === yesterdayKey() ? s.daily.streak + 1 : 1
        const reward = DAILY_REWARDS[(streak - 1) % DAILY_REWARDS.length]
        const isWeekBonus = streak % DAILY_REWARDS.length === 0
        set({
          daily: { last: today, streak },
          coins: s.coins + reward,
          lifetime: {
            ...s.lifetime,
            coinsEarned: s.lifetime.coinsEarned + reward,
            bestStreak: Math.max(s.lifetime.bestStreak, streak),
          },
          ...(isWeekBonus ? { energy: MAX_ENERGY, energyAt: Date.now() } : {}),
        })
        return reward
      },

      ensureMissions: () => {
        const today = todayKey()
        if (get().missions.date !== today) {
          set({ missions: { date: today, list: generateMissions(today) } })
        }
      },

      claimMission: (id) => {
        const s = get()
        const m = s.missions.list.find((x) => x.id === id)
        if (!m || m.claimed || m.progress < m.target) return
        set({
          coins: s.coins + m.reward,
          lifetime: { ...s.lifetime, coinsEarned: s.lifetime.coinsEarned + m.reward },
          missions: {
            ...s.missions,
            list: s.missions.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
          },
        })
      },

      claimAchievement: (id) => {
        const s = get()
        const a = ACHIEVEMENTS.find((x) => x.id === id)
        if (!a || s.achievements.includes(id)) return
        const value = a.value({
          lifetime: s.lifetime,
          bestLevel: bestLevel(s),
          unlockedCount: s.unlocked.length,
        })
        if (value < a.target) return
        set({
          coins: s.coins + a.reward,
          achievements: [...s.achievements, id],
          lifetime: { ...s.lifetime, coinsEarned: s.lifetime.coinsEarned + a.reward },
        })
      },

      touch: () => set({ lastSeen: Date.now() }),
      noteMidgame: () => set({ lastMidgame: Date.now() }),
      noteAdWatched: () =>
        set((s) => ({ lifetime: { ...s.lifetime, adsWatched: s.lifetime.adsWatched + 1 } })),

      resetAll: () => set(initialData()),
    }),
    {
      name: 'gym-coach-save',
      version: 1,
      storage: createJSONStorage(() => gameStorage),
      skipHydration: true,
      partialize: (s) => {
        const data: Partial<GameStore> = { ...s }
        for (const k of Object.keys(data) as (keyof GameStore)[]) {
          if (typeof data[k] === 'function') delete data[k]
        }
        return data as GameData
      },
    },
  ),
)

export function activeSkin(s: GameData, id: CharacterId): SkinId {
  if (s.skinTrial && s.skinTrial.until > Date.now()) {
    const [cid, skin] = s.skinTrial.key.split(':')
    if (cid === id) return skin as SkinId
  }
  return s.progress[id].skin
}

/** Final look with the equipped skin and visible gear (belt, sleeves, straps, shoes). */
export function lookFor(s: GameData, id: CharacterId): CharacterLook {
  const def = CHARACTERS[id]
  const skin = def.skins[activeSkin(s, id)]
  const eq = s.equipment
  return {
    ...def.look,
    top: skin.top,
    pants: skin.pants,
    belt: def.look.belt || eq.includes('belt'),
    kneeSleeves: def.look.kneeSleeves || eq.includes('knees'),
    wristStraps: eq.includes('straps'),
    shoes: eq.includes('shoes') ? '#e63946' : def.look.shoes,
  }
}

export function currentStats(s: GameData, id: CharacterId) {
  return statsFor(id, s.progress[id].level, s.equipment)
}
