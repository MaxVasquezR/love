export type StationId = 'push' | 'pull' | 'legs'
export type RigId = 'bench' | 'adjustable' | 'dumbbells' | 'platform' | 'cable' | 'rack' | 'legpress' | 'tower'
export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'back'
  | 'abs'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
export type CharacterId = 'max' | 'ana' | 'bruno' | 'kiara' | 'lucho' | 'elva' | 'emma'
export type OutfitId = 'base' | 'bonnetty' | 'stringer' | 'neon' | 'hoodie' | 'oro'
export type EquipmentId = 'chalk' | 'belt' | 'knees' | 'straps' | 'shoes'
export type StatKey = 'str' | 'end' | 'tec'
export type Stats = Record<StatKey, number>
export type Goal = 'fuerza' | 'hipertrofia' | 'resistencia'

export type Pose =
  | 'idle'
  | 'walk'
  | 'lift'
  | 'cheer'
  | 'wave'
  | 'clap'
  | 'point'
  | 'cross'
  | 'fist'
  | 'facepalm'
  | 'flex'
  | 'rest'
  /** Spotter: hands under the bar, following it up. */
  | 'spot'
  /** Cleaning lady mopping the floor. */
  | 'mop'
/** `dirty`: the weight was let fall on the way down; `assisted`: the Profe spotted the rep. */
export type RepQuality = 'perfect' | 'good' | 'dirty' | 'assisted' | 'miss'

export type Build = 'male' | 'female'
export type HairStyle = 'short' | 'long' | 'ponytail' | 'buzz' | 'bun' | 'bald'
export type TopStyle = 'tank' | 'stringer' | 'tee' | 'bra' | 'hoodie'
export type BottomStyle = 'shorts' | 'joggers' | 'leggings'

export interface CharacterLook {
  build: Build
  skin: string
  hair: string
  hairStyle: HairStyle
  top: string
  topStyle: TopStyle
  /** Prints the BONNETTY logo on the chest. */
  /** Chest print: the Bonnetty logo, or the Venezuela national team print. */
  topPrint?: boolean | 'vzla'
  bottom: string
  bottomStyle: BottomStyle
  shoes: string
  shoeStripe: string
  socks: string
  /** Overall height multiplier (1 = 1.8 m). */
  height: number
  /** 0 = flaco, 1 = mamado. Grows with level. */
  muscle: number
  beard?: string
  mustache?: string
  cap?: string
  scrunchie?: string
  watch?: boolean
  headphones?: boolean
  whistle?: boolean
  belt?: boolean
  kneeSleeves?: boolean
  wristStraps?: boolean
  gloves?: boolean
}

export interface Exercise {
  id: string
  station: StationId
  /** Machine or zone of the gym where it is done. */
  rig: RigId
  /** Muscles the Profe lights up in the technique demo. */
  groups: MuscleGroup[]
  name: string
  blurb: string
  muscles: string
  cues: string[]
  mistakes: string[]
  minKg: number
  maxKg: number
  step: number
  baseKg: number
  unlockLevel: number
}

export interface Station {
  id: StationId
  title: string
  muscles: string
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

export type MissionTemplateId =
  | 'reps'
  | 'perfect'
  | 'station'
  | 'kg'
  | 'sessions'
  | 'combo'
  | 'quiz'
  | 'routine'
  | 'pr'

export interface SessionResult {
  characterId: CharacterId
  station: StationId
  exerciseId: string
  weight: number
  sets: number
  goodReps: number
  perfectReps: number
  maxCombo: number
  xp: number
  coins: number
  failed: boolean
  newPr: boolean
  routine?: boolean
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
  prs: number
  quizRight: number
  routines: number
  shares: number
}

export interface Challenge {
  exerciseId: string
  kg: number
  from: string
  /** A rematch: the friend beat your challenge and sent it back heavier. */
  rev?: boolean
}
