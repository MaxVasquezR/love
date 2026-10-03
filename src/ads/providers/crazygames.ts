import type { AdProvider } from '../types'

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'

let ready = false

function sdk() {
  const s = ready ? window.CrazyGames?.SDK : undefined
  return s && s.environment !== 'disabled' ? s : undefined
}

function safe(run: () => void) {
  try {
    run()
  } catch (err) {
    console.warn('[ads] CrazyGames call failed', err)
  }
}

const timeout = (ms: number) =>
  new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('SDK timeout')), ms))

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

function request(type: 'midgame' | 'rewarded') {
  return new Promise<boolean>((resolve) => {
    const s = sdk()
    if (!s) return resolve(false)
    try {
      s.ad.requestAd(type, {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      })
    } catch {
      resolve(false)
    }
  })
}

export const crazyGamesProvider: AdProvider = {
  name: 'crazygames',
  init: async () => {
    try {
      await Promise.race([
        (async () => {
          await loadScript(SDK_URL)
          await window.CrazyGames?.SDK.init()
        })(),
        timeout(8000),
      ])
      ready = true
    } catch (err) {
      console.warn('[ads] CrazyGames SDK unavailable', err)
    }
  },
  canShowRewarded: () => !!sdk(),
  rewarded: () => request('rewarded'),
  midgame: async () => {
    await request('midgame')
  },
  gameplayStart: () => safe(() => sdk()?.game.gameplayStart()),
  gameplayStop: () => safe(() => sdk()?.game.gameplayStop()),
  loadingStart: () => safe(() => sdk()?.game.loadingStart()),
  loadingStop: () => safe(() => sdk()?.game.loadingStop()),
  happytime: () => safe(() => sdk()?.game.happytime()),
}
