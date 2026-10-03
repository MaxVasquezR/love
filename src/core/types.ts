export type Lang = 'es' | 'en'
export type Localized = Record<Lang, string>

export type StationId = 'push' | 'pull' | 'legs'
export type CharacterId = 'max' | 'ana' | 'leo' | 'sofi'
export type SkinId = 'classic' | 'street' | 'night' | 'gold'
export type EquipmentId = 'chalk' | 'belt' | 'knees' | 'straps' | 'shoes'
export type StatKey = 'str' | 'end' | 'tec'
export type Stats = Record<StatKey, number>

export type Pose = 'idle' | 'walk' | 'lift' | 'cheer' | 'wave' | 'clap' | 'point'
export type RepQuality = 'perfect' | 'good' | 'miss'

export type HairStyle = 'short' | 'long' | 'ponytail' | 'buzz' | 'bun'

export interface CharacterLook {
  skin: string
  hair: string
  hairStyle: HairStyle
  top: string
  pants: string
  shoes: string
  scale: number
  bulk: number
  beard?: string
  cap?: string
  scrunchie?: string
  watch?: boolean
  headphones?: boolean
  whistle?: boolean
  belt?: boolean
  kneeSleeves?: boolean
  wristStraps?: boolean
}

export interface Exercise {
  id: string
  station: StationId
  name: Localized
  blurb: Localized
  minKg: number
  maxKg: number
  step: number
  baseKg: number
  reps: number
  unlockLevel: number
}

export interface Station {
  id: StationId
  title: Localized
  muscles: Localized
  unlockLevel: number
}

export interface MissionState {
  id: string
  template: MissionTemplateId
  target: number
  progress: number
  station?: StationId
  reward: number
  claimed: boolean
}

export type MissionTemplateId = 'reps' | 'perfect' | 'station' | 'kg' | 'sessions' | 'combo'

export interface SessionResult {
  characterId: CharacterId
  station: StationId
  exerciseId: string
  weight: number
  reps: number
  goodReps: number
  perfectReps: number
  maxCombo: number
  xp: number
  coins: number
  failed: boolean
}

export interface Lifetime {
  sessions: number
  reps: number
  perfectReps: number
  kg: number
  coinsEarned: number
  bestCombo: number
  bestStreak: number
  adsWatched: number
}
