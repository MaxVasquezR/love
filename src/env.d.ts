/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AD_PROVIDER?: 'none' | 'crazygames' | 'google' | 'gamedistribution'
  readonly VITE_ADSENSE_CLIENT?: string
  /** GameDistribution game id (from the GD developer dashboard). */
  readonly VITE_GD_GAME_ID?: string
  /** When set, the web build shows this portal-hosted game in a full-screen iframe. */
  readonly VITE_PLAY_URL?: string
  /** Public link used in share texts and challenge links. */
  readonly VITE_SHARE_URL?: string
  /** PostHog project API key (own website only; portals send no analytics). */
  readonly VITE_POSTHOG_KEY?: string
  /** PostHog ingest host, e.g. https://us.i.posthog.com or https://eu.i.posthog.com. */
  readonly VITE_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
