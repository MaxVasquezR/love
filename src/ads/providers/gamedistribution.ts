import type { AdProvider } from '../types'
import { useAdState } from '../adState'

const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js'
const GAME_ID = import.meta.env.VITE_GD_GAME_ID ?? ''

type GdEvent = { name: string; message?: string }

declare global {
  interface Window {
    GD_OPTIONS?: { gameId: string; onEvent: (e: GdEvent) => void }
    gdsdk?: {
      showAd(type?: 'interstitial' | 'rewarded'): Promise<unknown>
      preloadAd(type: 'rewarded'): Promise<unknown>
    }
  }
}

let ready = false
let rewardEarned = false
let onReady: (() => void) | null = null

function handle(e: GdEvent) {
  switch (e.name) {
    case 'SDK_READY':
      ready = true
      onReady?.()
      break
    case 'SDK_GAME_PAUSE':
      useAdState.getState().setPlaying(true)
      break
    case 'SDK_GAME_START':
      useAdState.getState().setPlaying(false)
      break
    case 'SDK_REWARDED_WATCH_COMPLETE':
      rewardEarned = true
      break
  }
}

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById('gamedistribution-jssdk')) return resolve()
    const s = document.createElement('script')
    s.id = 'gamedistribution-jssdk'
    s.src = SDK_URL
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('GameDistribution SDK failed to load'))
    document.head.appendChild(s)
  })
}

const sdk = () => (ready ? window.gdsdk : undefined)
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

export const gameDistributionProvider: AdProvider = {
  name: 'gamedistribution',
  init: async () => {
    if (!GAME_ID) {
      console.warn('[ads] VITE_GD_GAME_ID missing: GameDistribution ads disabled')
      return
    }
    window.GD_OPTIONS = { gameId: GAME_ID, onEvent: handle }
    try {
      const readyP = new Promise<void>((r) => (onReady = r))
      await loadScript()
      // Don't block the game forever if the SDK never reports ready (adblock, offline).
      await Promise.race([readyP, wait(8000)])
    } catch (err) {
      console.warn('[ads]', err)
    }
  },
  canShowRewarded: () => !!sdk(),
  rewarded: async () => {
    const gd = sdk()
    if (!gd) return false
    rewardEarned = false
    try {
      await gd.preloadAd('rewarded').catch(() => null)
      await gd.showAd('rewarded')
    } catch (err) {
      console.warn('[ads] rewarded unavailable', err)
      useAdState.getState().setPlaying(false)
      return false
    }
    // The completion event can land just after the promise resolves.
    if (!rewardEarned) await wait(300)
    useAdState.getState().setPlaying(false)
    return rewardEarned
  },
  midgame: async () => {
    const gd = sdk()
    if (!gd) return
    try {
      await gd.showAd('interstitial')
    } catch (err) {
      console.warn('[ads] interstitial unavailable', err)
    }
    useAdState.getState().setPlaying(false)
  },
  gameplayStart: () => {},
  gameplayStop: () => {},
  loadingStart: () => {},
  loadingStop: () => {},
  happytime: () => {},
}
