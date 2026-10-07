export interface AdProvider {
  readonly name: 'none' | 'crazygames' | 'google' | 'gamedistribution'
  init(): Promise<void>
  canShowRewarded(): boolean
  /** Resolves true only when the player watched the full ad and earned the reward. */
  rewarded(placement: string): Promise<boolean>
  midgame(placement: string): Promise<void>
  gameplayStart(): void
  gameplayStop(): void
  loadingStart(): void
  loadingStop(): void
  happytime(): void
}
