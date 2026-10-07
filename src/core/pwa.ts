import { useSyncExternalStore } from 'react'
import { track } from './analytics'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PORTAL = import.meta.env.VITE_AD_PROVIDER === 'crazygames' || import.meta.env.VITE_AD_PROVIDER === 'gamedistribution'
const topLevel = window.self === window.top

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Service worker + install prompt, only for the own website (portals forbid both inside their iframe). */
export function setupPwa() {
  if (PORTAL || !topLevel || import.meta.env.DEV) return
  if ('serviceWorker' in navigator) {
    const register = () =>
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[pwa] service worker failed', err))
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    track('pwa_install', { via: 'browser' })
    notify()
  })
}

/** Shows the browser's "add to home screen" dialog. Returns true if the player accepted. */
export async function promptInstall() {
  const e = deferred
  if (!e) return false
  deferred = null
  notify()
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'accepted') track('pwa_install', { via: 'button' })
  return outcome === 'accepted'
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useCanInstall() {
  return useSyncExternalStore(subscribe, () => !!deferred)
}
