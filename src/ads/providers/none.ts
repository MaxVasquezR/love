import type { AdProvider } from '../types'
import { useAdState } from '../adState'

const DEV = import.meta.env.DEV

function fakeAd(kind: 'rewarded' | 'midgame', ms: number) {
  return new Promise<void>((resolve) => {
    useAdState.getState().setDevAd({ kind })
    window.setTimeout(() => {
      useAdState.getState().setDevAd(null)
      resolve()
    }, ms)
  })
}

/** No real ads. In `npm run dev` it shows a fake ad so the flows can be tested. */
export const noneProvider: AdProvider = {
  name: 'none',
  init: async () => {},
  canShowRewarded: () => DEV,
  rewarded: async () => {
    if (!DEV) return false
    await fakeAd('rewarded', 2500)
    return true
  },
  midgame: async () => {
    if (DEV) await fakeAd('midgame', 1500)
  },
  gameplayStart: () => {},
  gameplayStop: () => {},
  loadingStart: () => {},
  loadingStop: () => {},
  happytime: () => {},
}
