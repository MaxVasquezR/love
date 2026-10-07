export {}

type CrazyAdType = 'midgame' | 'rewarded'

interface CrazyAdCallbacks {
  adStarted?: () => void
  adFinished?: () => void
  adError?: (error: unknown, errorData?: { code?: string }) => void
}

interface CrazySDK {
  environment: 'local' | 'crazygames' | 'disabled'
  init(): Promise<void>
  ad: {
    requestAd(type: CrazyAdType, callbacks: CrazyAdCallbacks): void
    hasAdblock(): Promise<boolean>
  }
  game: {
    gameplayStart(): void
    gameplayStop(): void
    loadingStart(): void
    loadingStop(): void
    happytime(): void
  }
  data?: {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
  }
  user?: {
    systemInfo?: { locale?: string; countryCode?: string }
  }
}

interface AdBreakParams {
  type: 'preroll' | 'start' | 'pause' | 'next' | 'browse' | 'reward'
  name?: string
  beforeAd?: () => void
  afterAd?: () => void
  beforeReward?: (showAdFn: () => void) => void
  adDismissed?: () => void
  adViewed?: () => void
  adBreakDone?: (info: { breakStatus: string }) => void
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazySDK }
    adsbygoogle?: unknown[]
    adBreak?: (o: AdBreakParams) => void
    adConfig?: (o: Record<string, unknown>) => void
  }
}
