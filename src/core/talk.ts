import { create } from 'zustand'
import type { ActorId } from '../game/GameCanvas'
import { speak } from './audio'

interface Line {
  text: string
  id: number
}

interface TalkState {
  lines: Partial<Record<ActorId, Line>>
  say(actor: ActorId, text: string | null, ms?: number): void
  clear(): void
}

const timers: Partial<Record<ActorId, number>> = {}
let seq = 0

export const useTalk = create<TalkState>()((set) => ({
  lines: {},
  say: (actor, text, ms = 2800) => {
    if (!text) return
    const id = ++seq
    window.clearTimeout(timers[actor])
    set((s) => ({ lines: { ...s.lines, [actor]: { text, id } } }))
    speak(text, actor)
    timers[actor] = window.setTimeout(() => {
      set((s) => (s.lines[actor]?.id === id ? { lines: { ...s.lines, [actor]: undefined } } : s))
    }, ms)
  },
  clear: () => set({ lines: {} }),
}))
