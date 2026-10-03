/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AD_PROVIDER?: 'none' | 'crazygames' | 'google'
  readonly VITE_ADSENSE_CLIENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
