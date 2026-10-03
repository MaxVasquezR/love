import type { AdProvider } from '../types'

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT
let ready = false

function inject() {
  return new Promise<void>((resolve) => {
    const s = document.createElement('script')
    s.async = true
    s.crossOrigin = 'anonymous'
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
    s.setAttribute('data-ad-client', CLIENT ?? '')
    s.setAttribute('data-ad-frequency-hint', '30s')
    if (import.meta.env.DEV) s.setAttribute('data-adbreak-test', 'on')
    s.onload = () => resolve()
    s.onerror = () => resolve()
    document.head.appendChild(s)

    window.adsbygoogle = window.adsbygoogle || []
    window.adBreak = window.adConfig = (o: object) => {
      window.adsbygoogle!.push(o)
    }
  })
}

/** Google H5 Games Ads (Ad Placement API). Needs an approved AdSense account. */
export const googleProvider: AdProvider = {
  name: 'google',
  init: async () => {
    if (!CLIENT) {
      console.warn('[ads] VITE_ADSENSE_CLIENT missing, ads disabled')
      return
    }
    await inject()
    window.adConfig?.({ preloadAdBreaks: 'on', sound: 'off' })
    ready = true
  },
  canShowRewarded: () => ready,
  rewarded: (placement) =>
    new Promise<boolean>((resolve) => {
      if (!ready || !window.adBreak) return resolve(false)
      let done = false
      const finish = (v: boolean) => {
        if (!done) {
          done = true
          resolve(v)
        }
      }
      window.adBreak({
        type: 'reward',
        name: placement,
        beforeReward: (showAdFn) => showAdFn(),
        adViewed: () => finish(true),
        adDismissed: () => finish(false),
        adBreakDone: () => finish(false),
      })
    }),
  midgame: (placement) =>
    new Promise<void>((resolve) => {
      if (!ready || !window.adBreak) return resolve()
      window.adBreak({ type: 'next', name: placement, adBreakDone: () => resolve() })
    }),
  gameplayStart: () => {},
  gameplayStop: () => {},
  loadingStart: () => {},
  loadingStop: () => {},
  happytime: () => {},
}
