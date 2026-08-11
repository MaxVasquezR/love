export type Screen =
  | 'intro'
  | 'outfit'
  | 'pick'
  | 'walk'
  | 'lift'
  | 'between'
  | 'finale'

export type StationId = 'push' | 'pull' | 'legs'
export type PlayerId = 'max' | 'ana'
export type OutfitId = 'classic' | 'street' | 'date'
export type DollPose = 'idle' | 'walk' | 'lift' | 'cheer' | 'wave'

export interface Variant {
  id: string
  name: string
  blurb: string
  minKg: number
  maxKg: number
  step: number
  defaultKg: number
  reps: number
}

export interface Station {
  id: StationId
  title: string
  subtitle: string
  emoji: string
  variants: Variant[]
}

export interface Assignment {
  stationId: StationId
  variant: Variant
  weight: number
  rep: number
  goodReps: number
  done: boolean
  points: number
}

export interface LiftResult {
  player: PlayerId
  stationId: StationId
  variantName: string
  weight: number
  goodReps: number
  totalReps: number
  points: number
}

export interface Bubble {
  player: PlayerId
  text: string
  until: number
}
