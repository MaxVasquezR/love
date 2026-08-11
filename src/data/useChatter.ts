import { useEffect } from 'react'
import { lineFor } from './chatter'
import type { Bubble, PlayerId, StationId } from '../types'

export function useChatter(
  phase: 'lobby' | 'walk' | 'lift' | 'cheer' | 'between',
  enabled: boolean,
  stations: Partial<Record<PlayerId, StationId | null | undefined>>,
  setBubbles: React.Dispatch<React.SetStateAction<Bubble[]>>,
) {
  useEffect(() => {
    if (!enabled) return
    const speak = (player: PlayerId) => {
      const text = lineFor(phase, player, stations[player] ?? undefined)
      setBubbles((prev) => {
        const rest = prev.filter((b) => b.player !== player)
        return [...rest, { player, text, until: Date.now() + 2800 }]
      })
    }
    speak('max')
    const t1 = window.setTimeout(() => speak('ana'), 850)
    const iv = window.setInterval(() => {
      speak(Math.random() > 0.5 ? 'max' : 'ana')
    }, 3000)
    return () => {
      clearTimeout(t1)
      clearInterval(iv)
    }
  }, [phase, enabled, stations.max, stations.ana, setBubbles])
}
