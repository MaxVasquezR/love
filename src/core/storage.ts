import type { StateStorage } from 'zustand/middleware'

interface CrazyData {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function crazyData(): CrazyData | null {
  const sdk = window.CrazyGames?.SDK
  if (!sdk || sdk.environment !== 'crazygames') return null
  return sdk.data ?? null
}

/** CrazyGames requires its Data module for cloud saves; everywhere else we use localStorage. */
export const gameStorage: StateStorage = {
  getItem: (key) => crazyData()?.getItem(key) ?? localStorage.getItem(key),
  setItem: (key, value) => {
    const cg = crazyData()
    if (cg) cg.setItem(key, value)
    localStorage.setItem(key, value)
  },
  removeItem: (key) => {
    crazyData()?.removeItem(key)
    localStorage.removeItem(key)
  },
}
