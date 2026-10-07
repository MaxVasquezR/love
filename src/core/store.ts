import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Challenge,
  CharacterId,
  CharacterLook,
  EquipmentId,
  Lifetime,
  MissionState,
  OutfitId,
  SessionResult,
} from './types'
import { applyXp, statsFor } from './progression'
import {
  BOOST_MS,
  BOX_MS,
  CHALLENGE_REWARD,
  DAILY_REWARDS,
  RECRUITS_PER_DAY,
  RECRUIT_REWARD,
  REMATCH_BONUS,
  ENERGY_REFILL_COST,
  MAX_ENERGY,
  QUIZ_REWARD,
  SHARE_REWARD,
  SKIN_TRIAL_MS,
  STR_BOOST,
  regenEnergy,
  rollBox,
  streakSavable,
  todayKey,
  yesterdayKey,
  type BoxReward,
} from './economy'
import { CHARACTERS, CHARACTER_ORDER, OUTFITS, outfitKey } from '../data/characters'
import { EQUIPMENT } from '../data/equipment'
import { advanceMission, advanceQuizMissions, generateMissions, rerollMission } from '../data/missions'
import { ACHIEVEMENTS } from '../data/achievements'
import { gameStorage } from './storage'
import { LESSON_PERFECT_BONUS, LESSON_REWARD } from '../data/lessons'

interface CharacterProgress {
  level: number
  xp: number
  outfit: OutfitId
}

interface GameData {
  selected: CharacterId | null
  unlocked: CharacterId[]
  progress: Record<CharacterId, CharacterProgress>
  coins: number
  energy: number
  energyAt: number
  equipment: EquipmentId[]
  outfits: string[]
  outfitTrial: { key: string; until: number } | null
  daily: { last: string | null; streak: number }
  missions: { date: string; list: MissionState[] }
  achievements: string[]
  lifetime: Lifetime
  lastSeen: number
  lastMidgame: number
  prs: Record<string, number>
  boosts: { xp2Until: number; strUntil: number }
  boxAt: number
  quiz: { seen: string[]; sessionsSince: number }
  sound: boolean
  voice: boolean
  /** The athlete reads their own lines out loud too. */
  playerVoice: boolean
  /** First drag-the-bar tutorial already shown. */
  seenLiftTutorial: boolean
  /** 0..1 background music and effects volume. */
  musicVol: number
  sfxVol: number
  /** Quieter audio and the boss key (Esc / two-finger tap) for playing at work. */
  office: boolean
  /** Escuela del Profe: best quiz score (0..3) per lesson. */
  lessons: Record<string, number>
  /** "Fui al gym hoy" honor-system check-ins. */
  realStreak: { last: string | null; streak: number; best: number; total: number }
  challenge: Challenge | null
  routineDaily: string | null
  shareDay: string | null
  lowWeight: number
  /** Player's own name for challenge links ("Juan te reta"); empty uses the athlete's name. */
  nick: string
  /** Friends who beat your challenge and sent it back (recruit rewards). */
  recruits: { names: string[]; day: string | null; today: number }
  /** Spanish by default; English only when picked in Settings. */
  lang: 'es' | 'en'
}

export interface SessionOutcome {
  levelsGained: number
  newLevel: number
  unlockedNow: CharacterId[]
  challengeWon: number
  /** The friend's challenge that was just beaten (for the rematch). */
  challenge: Challenge | null
}

interface GameActions {
  selectCharacter(id: CharacterId): void
  buyCharacter(id: CharacterId): boolean
  syncEnergy(now?: number): void
  spendEnergy(n?: number): boolean
  refillEnergy(): void
  buyRefill(): boolean
  buyEquipment(id: EquipmentId): boolean
  buyOutfit(id: CharacterId, outfit: OutfitId): boolean
  setOutfit(id: CharacterId, outfit: OutfitId): void
  startOutfitTrial(id: CharacterId, outfit: OutfitId): void
  recordSession(r: SessionResult): SessionOutcome
  addCoins(n: number): void
  /** `save` keeps a recently broken streak alive (after a rewarded ad). */
  claimDaily(save?: boolean): number | null
  ensureMissions(): void
  claimMission(id: string): void
  rerollMission(id: string): void
  claimAchievement(id: string): void
  answerQuiz(id: string, right: boolean): number
  openBox(free: boolean): BoxReward | null
  activatePreWorkout(): void
  setSound(on: boolean): void
  setVoice(on: boolean): void
  setPlayerVoice(on: boolean): void
  markLiftTutorial(): void
  setAudio(p: Partial<Pick<GameData, 'musicVol' | 'sfxVol' | 'office'>>): void
  /** Records a lesson quiz; returns the lucas earned (only the first time / first perfect). */
  completeLesson(id: string, score: number): number
  /** Real gym check-in for today; returns lucas earned or null if already done. */
  checkInGym(): number | null
  setChallenge(c: Challenge | null): void
  markRoutineDaily(): void
  noteShare(): number
  /** Rewards the sender of a challenge once per friend; returns lucas earned. */
  noteRecruit(from: string): number
  setNick(nick: string): void
  setLang(lang: GameData['lang']): void
  setLowWeight(n: number): void
  touch(): void
  noteMidgame(): void
  noteAdWatched(): void
  resetAll(): void
}

export type GameStore = GameData & GameActions

const startProgress = (): Record<CharacterId, CharacterProgress> =>
  Object.fromEntries(CHARACTER_ORDER.map((id) => [id, { level: 1, xp: 0, outfit: 'base' }])) as Record<
    CharacterId,
    CharacterProgress
  >

const emptyLifetime = (): Lifetime => ({
  sessions: 0,
  reps: 0,
  perfectReps: 0,
  kg: 0,
  coinsEarned: 0,
  bestCombo: 0,
  bestStreak: 0,
  adsWatched: 0,
  prs: 0,
  quizRight: 0,
  routines: 0,
  shares: 0,
})

const initialData = (): GameData => ({
  selected: null,
  unlocked: ['max', 'ana'],
  progress: startProgress(),
  coins: 100,
  energy: MAX_ENERGY,
  energyAt: Date.now(),
  equipment: [],
  outfits: CHARACTER_ORDER.map((c) => outfitKey(c, 'base')),
  outfitTrial: null,
  daily: { last: null, streak: 0 },
  missions: { date: todayKey(), list: generateMissions(todayKey()) },
  achievements: [],
  lifetime: emptyLifetime(),
  lastSeen: Date.now(),
  lastMidgame: 0,
  prs: {},
  boosts: { xp2Until: 0, strUntil: 0 },
  boxAt: 0,
  quiz: { seen: [], sessionsSince: 0 },
  sound: true,
  voice: true,
  playerVoice: true,
  seenLiftTutorial: false,
  musicVol: 0.6,
  sfxVol: 0.9,
  office: false,
  lessons: {},
  realStreak: { last: null, streak: 0, best: 0, total: 0 },
  challenge: null,
  routineDaily: null,
  shareDay: null,
  lowWeight: 0,
  nick: '',
  recruits: { names: [], day: null, today: 0 },
  lang: 'es',
})

export function bestLevel(s: Pick<GameData, 'progress' | 'unlocked'>) {
  return Math.max(...s.unlocked.map((id) => s.progress[id]?.level ?? 1))
}

function freeUnlocks(s: GameData, best: number): CharacterId[] {
  return CHARACTER_ORDER.filter((id) => {
    const u = CHARACTERS[id].unlock
    return !s.unlocked.includes(id) && !('free' in u) && best >= u.level
  })
}

const earn = (s: GameData, n: number) => ({
  coins: s.coins + n,
  lifetime: { ...s.lifetime, coinsEarned: s.lifetime.coinsEarned + n },
})

/** Brings a v1 save (Max/Ana/Leo/Sofi with color skins) to the Lima version. */
function migrateV1(p: Record<string, unknown>): GameData {
  const base = initialData()
  const mapId = (id: string) => (id === 'leo' ? 'bruno' : id === 'sofi' ? 'kiara' : id) as CharacterId
  const oldProgress = (p.progress ?? {}) as Record<string, { level?: number; xp?: number }>
  const progress = { ...base.progress }
  for (const [id, v] of Object.entries(oldProgress)) {
    const nid = mapId(id)
    if (progress[nid]) progress[nid] = { level: v.level ?? 1, xp: v.xp ?? 0, outfit: 'base' }
  }
  const unlocked = Array.from(new Set(((p.unlocked as string[]) ?? base.unlocked).map(mapId))).filter(
    (id) => id in CHARACTERS,
  )
  return {
    ...base,
    selected: typeof p.selected === 'string' ? mapId(p.selected) : null,
    unlocked,
    progress,
    coins: typeof p.coins === 'number' ? p.coins : base.coins,
    equipment: (p.equipment as EquipmentId[]) ?? [],
    daily: (p.daily as GameData['daily']) ?? base.daily,
    achievements: (p.achievements as string[]) ?? [],
    lifetime: { ...base.lifetime, ...((p.lifetime as Partial<Lifetime>) ?? {}) },
    lastSeen: typeof p.lastSeen === 'number' ? p.lastSeen : Date.now(),
  }
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

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

      spendEnergy: (n = 1) => {
        get().syncEnergy()
        const s = get()
        if (s.energy < n) return false
        set({
          energy: s.energy - n,
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

      buyOutfit: (id, outfit) => {
        const s = get()
        const key = outfitKey(id, outfit)
        const price = OUTFITS[outfit].price
        if (s.outfits.includes(key) || s.coins < price) return false
        set({
          coins: s.coins - price,
          outfits: [...s.outfits, key],
          progress: { ...s.progress, [id]: { ...s.progress[id], outfit } },
        })
        return true
      },

      setOutfit: (id, outfit) => {
        const s = get()
        if (!s.outfits.includes(outfitKey(id, outfit))) return
        set({ progress: { ...s.progress, [id]: { ...s.progress[id], outfit } } })
      },

      startOutfitTrial: (id, outfit) =>
        set({ outfitTrial: { key: outfitKey(id, outfit), until: Date.now() + SKIN_TRIAL_MS } }),

      recordSession: (r) => {
        const s = get()
        const prog = s.progress[r.characterId]
        const lv = applyXp(prog.level, prog.xp, r.xp)
        const progress = { ...s.progress, [r.characterId]: { ...prog, level: lv.level, xp: lv.xp } }

        const beaten =
          s.challenge && !r.failed && r.exerciseId === s.challenge.exerciseId && r.weight >= s.challenge.kg
            ? s.challenge
            : null
        const won = beaten ? CHALLENGE_REWARD + (beaten.rev ? REMATCH_BONUS : 0) : 0
        const coinsGained = r.coins + won

        const lifetime: Lifetime = {
          ...s.lifetime,
          sessions: s.lifetime.sessions + 1,
          reps: s.lifetime.reps + r.goodReps,
          perfectReps: s.lifetime.perfectReps + r.perfectReps,
          kg: s.lifetime.kg + Math.max(r.weight, 10) * r.goodReps,
          coinsEarned: s.lifetime.coinsEarned + coinsGained,
          bestCombo: Math.max(s.lifetime.bestCombo, r.maxCombo),
          prs: s.lifetime.prs + (r.newPr ? 1 : 0),
          routines: s.lifetime.routines + (r.routine && !r.failed ? 1 : 0),
        }
        const missions = { ...s.missions, list: s.missions.list.map((m) => advanceMission(m, r)) }
        const prs = r.newPr ? { ...s.prs, [r.exerciseId]: r.weight } : s.prs
        const next: GameData = { ...s, progress, lifetime, missions, coins: s.coins + coinsGained }
        const unlockedNow = freeUnlocks(next, bestLevel(next))
        set({
          progress,
          lifetime,
          missions,
          prs,
          coins: next.coins,
          unlocked: [...s.unlocked, ...unlockedNow],
          quiz: { ...s.quiz, sessionsSince: s.quiz.sessionsSince + 1 },
          challenge: won ? null : s.challenge,
          ...(lv.levelsGained > 0 ? { energy: MAX_ENERGY, energyAt: Date.now() } : {}),
        })
        return { levelsGained: lv.levelsGained, newLevel: lv.level, unlockedNow, challengeWon: won, challenge: beaten }
      },

      addCoins: (n) => set((s) => earn(s, n)),

      claimDaily: (save = false) => {
        const s = get()
        const today = todayKey()
        if (s.daily.last === today) return null
        const keep = s.daily.last === yesterdayKey() || (save && streakSavable(s.daily))
        const streak = keep ? s.daily.streak + 1 : 1
        const reward = DAILY_REWARDS[(streak - 1) % DAILY_REWARDS.length]
        const isWeekBonus = streak % DAILY_REWARDS.length === 0
        const e = earn(s, reward)
        set({
          daily: { last: today, streak },
          coins: e.coins,
          lifetime: { ...e.lifetime, bestStreak: Math.max(s.lifetime.bestStreak, streak) },
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
          ...earn(s, m.reward),
          missions: {
            ...s.missions,
            list: s.missions.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
          },
        })
      },

      rerollMission: (id) => {
        const s = get()
        set({ missions: { ...s.missions, list: rerollMission(s.missions.list, id) } })
      },

      claimAchievement: (id) => {
        const s = get()
        const a = ACHIEVEMENTS.find((x) => x.id === id)
        if (!a || s.achievements.includes(id)) return
        const value = a.value({ lifetime: s.lifetime, bestLevel: bestLevel(s), unlockedCount: s.unlocked.length })
        if (value < a.target) return
        set({ ...earn(s, a.reward), achievements: [...s.achievements, id] })
      },

      answerQuiz: (id, right) => {
        const s = get()
        const reward = right ? QUIZ_REWARD : 0
        const e = earn(s, reward)
        set({
          coins: e.coins,
          lifetime: { ...e.lifetime, quizRight: s.lifetime.quizRight + (right ? 1 : 0) },
          quiz: { seen: [...s.quiz.seen.slice(-60), id], sessionsSince: 0 },
          missions: right ? { ...s.missions, list: advanceQuizMissions(s.missions.list) } : s.missions,
        })
        return reward
      },

      openBox: (free) => {
        const s = get()
        const now = Date.now()
        if (free && s.boxAt > now) return null
        const level = s.selected ? s.progress[s.selected].level : 1
        const reward = rollBox(level)
        const patch: Partial<GameData> = free ? { boxAt: now + BOX_MS } : {}
        if (reward.kind === 'coins') Object.assign(patch, earn(s, reward.n))
        if (reward.kind === 'energy') patch.energy = Math.min(MAX_ENERGY + 4, s.energy + reward.n)
        if (reward.kind === 'pre')
          patch.boosts = { ...s.boosts, xp2Until: Math.max(now, s.boosts.xp2Until) + BOOST_MS }
        if (reward.kind === 'crea')
          patch.boosts = { ...s.boosts, strUntil: Math.max(now, s.boosts.strUntil) + BOOST_MS }
        set(patch)
        return reward
      },

      activatePreWorkout: () => {
        const s = get()
        set({ boosts: { ...s.boosts, xp2Until: Math.max(Date.now(), s.boosts.xp2Until) + BOOST_MS } })
      },

      setSound: (sound) => set({ sound }),
      setVoice: (voice) => set({ voice }),
      setPlayerVoice: (playerVoice) => set({ playerVoice }),
      markLiftTutorial: () => set({ seenLiftTutorial: true }),
      setAudio: (p) => set(p),
      completeLesson: (id, score) => {
        const s = get()
        const prev = s.lessons[id]
        let coins = 0
        if (prev === undefined) coins += LESSON_REWARD
        if (score >= 3 && (prev ?? 0) < 3) coins += LESSON_PERFECT_BONUS
        set({
          lessons: { ...s.lessons, [id]: Math.max(prev ?? 0, score) },
          coins: s.coins + coins,
          lifetime: { ...s.lifetime, coinsEarned: s.lifetime.coinsEarned + coins },
        })
        return coins
      },
      checkInGym: () => {
        const s = get()
        const today = todayKey()
        const r = s.realStreak
        if (r.last === today) return null
        const streak = r.last === yesterdayKey() ? r.streak + 1 : 1
        const coins = Math.min(80, 30 + (streak - 1) * 5)
        set({
          realStreak: { last: today, streak, best: Math.max(r.best, streak), total: r.total + 1 },
          coins: s.coins + coins,
          lifetime: { ...s.lifetime, coinsEarned: s.lifetime.coinsEarned + coins },
        })
        return coins
      },
      setChallenge: (challenge) => set({ challenge }),
      markRoutineDaily: () => set({ routineDaily: todayKey() }),

      noteShare: () => {
        const s = get()
        const today = todayKey()
        const reward = s.shareDay === today ? 0 : SHARE_REWARD
        const e = earn(s, reward)
        set({ coins: e.coins, lifetime: { ...e.lifetime, shares: s.lifetime.shares + 1 }, shareDay: today })
        return reward
      },

      noteRecruit: (from) => {
        const s = get()
        const today = todayKey()
        const name = from.trim().toLowerCase()
        const count = s.recruits.day === today ? s.recruits.today : 0
        if (!name || s.recruits.names.includes(name) || count >= RECRUITS_PER_DAY) return 0
        set({
          ...earn(s, RECRUIT_REWARD),
          recruits: { names: [...s.recruits.names.slice(-200), name], day: today, today: count + 1 },
        })
        return RECRUIT_REWARD
      },

      setNick: (nick) => set({ nick: nick.replace(/\s+/g, ' ').trimStart().slice(0, 20) }),
      setLang: (lang) => set({ lang }),

      setLowWeight: (lowWeight) => set({ lowWeight }),
      touch: () => set({ lastSeen: Date.now() }),
      noteMidgame: () => set({ lastMidgame: Date.now() }),
      noteAdWatched: () =>
        set((s) => ({ lifetime: { ...s.lifetime, adsWatched: s.lifetime.adsWatched + 1 } })),

      resetAll: () => set(initialData()),
    }),
    {
      name: 'gym-coach-save',
      version: 3,
      storage: createJSONStorage(() => gameStorage),
      skipHydration: true,
      migrate: (persisted, version) => {
        const data = version < 2 ? migrateV1((persisted ?? {}) as Record<string, unknown>) : (persisted as GameData)
        // v3: voices on and Spanish unless the player had picked English.
        if (version < 3) return { ...data, voice: true, playerVoice: true, lang: data.lang === 'en' ? 'en' : 'es' }
        return data
      },
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

export function activeOutfit(s: GameData, id: CharacterId): OutfitId {
  if (s.outfitTrial && s.outfitTrial.until > Date.now()) {
    const [cid, outfit] = s.outfitTrial.key.split(':')
    if (cid === id) return outfit as OutfitId
  }
  return s.progress[id].outfit
}

export function muscleFor(id: CharacterId, level: number) {
  const def = CHARACTERS[id]
  return Math.min(1, Math.max(0, def.muscleBase + (level - 1) * def.muscleGrowth))
}

/** Final look: outfit, muscle from level and visible gear. */
export function lookFor(s: GameData, id: CharacterId): CharacterLook {
  const def = CHARACTERS[id]
  const outfit = OUTFITS[activeOutfit(s, id)] ?? OUTFITS.base
  const look = { ...def.look, ...outfit.apply(def.look) }
  const eq = s.equipment
  return {
    ...look,
    muscle: muscleFor(id, s.progress[id].level),
    belt: look.belt || eq.includes('belt'),
    kneeSleeves: look.kneeSleeves || eq.includes('knees'),
    wristStraps: eq.includes('straps'),
    shoes: eq.includes('shoes') && !outfit.price ? '#c1121f' : look.shoes,
  }
}

export function boostActive(until: number, now = Date.now()) {
  return until > now
}

export function currentStats(s: GameData, id: CharacterId) {
  const st = statsFor(id, s.progress[id].level, s.equipment)
  if (boostActive(s.boosts.strUntil)) st.str = Math.round(st.str * STR_BOOST)
  return st
}
