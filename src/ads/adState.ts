import { create } from 'zustand'

interface AdState {
  /** True while any ad is on screen: the game must stay paused. */
  playing: boolean
  /** Fake ad shown only in local development with the `none` provider. */
  devAd: { kind: 'rewarded' | 'midgame' } | null
  setPlaying(v: boolean): void
  setDevAd(v: AdState['devAd']): void
}

export const useAdState = create<AdState>()((set) => ({
  playing: false,
  devAd: null,
  setPlaying: (playing) => set({ playing }),
  setDevAd: (devAd) => set({ devAd }),
}))
