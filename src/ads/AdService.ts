import type { AdProvider } from './types'
import { noneProvider } from './providers/none'
import { crazyGamesProvider } from './providers/crazygames'
import { googleProvider } from './providers/google'
import { gameDistributionProvider } from './providers/gamedistribution'
import { useAdState } from './adState'
import { useGame } from '../core/store'
import { MIDGAME_COOLDOWN_MS } from '../core/economy'
import { track } from '../core/analytics'

function pickProvider(): AdProvider {
  switch (import.meta.env.VITE_AD_PROVIDER) {
    case 'crazygames':
      return crazyGamesProvider
    case 'google':
      return googleProvider
    case 'gamedistribution':
      return gameDistributionProvider
    default:
      return noneProvider
  }
}

const provider = pickProvider()
let inGameplay = false

async function withPause<T>(run: () => Promise<T>): Promise<T> {
  const wasPlaying = inGameplay
  if (wasPlaying) provider.gameplayStop()
  useAdState.getState().setPlaying(true)
  try {
    return await run()
  } finally {
    useAdState.getState().setPlaying(false)
    if (wasPlaying) provider.gameplayStart()
  }
}

export const AdService = {
  providerName: provider.name,
  init: () => provider.init(),
  canShowRewarded: () => provider.canShowRewarded(),

  /** Call only from a button the player pressed. Returns true if the reward must be granted. */
  async rewarded(placement: string) {
    if (!provider.canShowRewarded()) return false
    const ok = await withPause(() => provider.rewarded(placement))
    if (ok) useGame.getState().noteAdWatched()
    track('ad_rewarded', { placement, ok })
    return ok
  },

  /** Between sessions only; respects the portal cooldown. */
  async midgameIfReady(placement: string) {
    const last = useGame.getState().lastMidgame
    if (Date.now() - last < MIDGAME_COOLDOWN_MS) return
    useGame.getState().noteMidgame()
    track('ad_midgame', { placement })
    await withPause(() => provider.midgame(placement))
  },

  setGameplay(active: boolean) {
    if (active === inGameplay) return
    inGameplay = active
    if (active) provider.gameplayStart()
    else provider.gameplayStop()
  },

  loadingStart: () => provider.loadingStart(),
  loadingStop: () => provider.loadingStop(),
  happytime: () => provider.happytime(),
}
