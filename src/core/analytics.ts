/**
 * Tiny event tracker for the own website (PostHog capture API, no SDK).
 * Portal builds send nothing: CrazyGames / GameDistribution have their own stats and rules.
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = (import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '')
const PORTAL = import.meta.env.VITE_AD_PROVIDER === 'crazygames' || import.meta.env.VITE_AD_PROVIDER === 'gamedistribution'
const ENABLED = !!KEY && !PORTAL && !import.meta.env.DEV

const UID_KEY = 'gl-uid'
const INSTALL_KEY = 'gl-install'

export type AnalyticsEvent =
  | 'first_open'
  | 'session_start'
  | 'training_start'
  | 'training_finish'
  | 'level_up'
  | 'ad_rewarded'
  | 'ad_midgame'
  | 'share'
  | 'challenge_open'
  | 'challenge_accept'
  | 'challenge_won'
  | 'rematch_open'
  | 'daily_claim'
  | 'streak_saved'
  | 'school_open'
  | 'pwa_install'

type Props = Record<string, string | number | boolean | null | undefined>

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage may be blocked inside some iframes */
  }
}

function uid() {
  let id = read(UID_KEY)
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    write(UID_KEY, id)
  }
  return id
}

/** Day the player first opened the game; used for day-1 / day-7 retention. */
function installDay(): { day: string; first: boolean } {
  const prev = read(INSTALL_KEY)
  if (prev) return { day: prev, first: false }
  const day = new Date().toISOString().slice(0, 10)
  write(INSTALL_KEY, day)
  return { day, first: true }
}

const install = installDay()
const daysSinceInstall = Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(install.day)) / 86_400_000)

export function track(event: AnalyticsEvent, props: Props = {}) {
  const properties = {
    ...props,
    $current_url: location.href,
    $lib: 'gym-legends',
    platform: import.meta.env.VITE_AD_PROVIDER || 'web',
    lang: document.documentElement.lang,
    installDay: install.day,
    daysSinceInstall,
  }
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props)
    return
  }
  if (!ENABLED) return
  const body = JSON.stringify({ api_key: KEY, event, distinct_id: uid(), properties, timestamp: new Date().toISOString() })
  try {
    void fetch(`${HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* analytics must never break the game */
  }
}

export const isFirstOpen = install.first
