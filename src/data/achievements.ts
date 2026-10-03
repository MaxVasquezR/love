import type { Lifetime, Localized } from '../core/types'

export interface AchievementContext {
  lifetime: Lifetime
  bestLevel: number
  unlockedCount: number
}

export interface AchievementDef {
  id: string
  name: Localized
  target: number
  reward: number
  value: (c: AchievementContext) => number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: { es: 'Primer día', en: 'Day one' }, target: 1, reward: 50, value: (c) => c.lifetime.sessions },
  { id: 'sessions-25', name: { es: 'Habitual del gym', en: 'Gym regular' }, target: 25, reward: 250, value: (c) => c.lifetime.sessions },
  { id: 'sessions-100', name: { es: 'Vive en el gym', en: 'Lives at the gym' }, target: 100, reward: 800, value: (c) => c.lifetime.sessions },
  { id: 'reps-100', name: { es: '100 reps', en: '100 reps' }, target: 100, reward: 100, value: (c) => c.lifetime.reps },
  { id: 'reps-1000', name: { es: 'Mil repeticiones', en: 'A thousand reps' }, target: 1000, reward: 600, value: (c) => c.lifetime.reps },
  { id: 'perfect-50', name: { es: 'Técnica limpia', en: 'Clean technique' }, target: 50, reward: 200, value: (c) => c.lifetime.perfectReps },
  { id: 'perfect-300', name: { es: 'Maestro de la forma', en: 'Form master' }, target: 300, reward: 700, value: (c) => c.lifetime.perfectReps },
  { id: 'kg-10k', name: { es: '10 toneladas', en: '10 tonnes' }, target: 10000, reward: 200, value: (c) => c.lifetime.kg },
  { id: 'kg-100k', name: { es: '100 toneladas', en: '100 tonnes' }, target: 100000, reward: 1000, value: (c) => c.lifetime.kg },
  { id: 'combo-8', name: { es: 'Combo imparable', en: 'Unstoppable combo' }, target: 8, reward: 250, value: (c) => c.lifetime.bestCombo },
  { id: 'level-5', name: { es: 'Nivel 5', en: 'Level 5' }, target: 5, reward: 150, value: (c) => c.bestLevel },
  { id: 'level-10', name: { es: 'Nivel 10', en: 'Level 10' }, target: 10, reward: 400, value: (c) => c.bestLevel },
  { id: 'level-25', name: { es: 'Nivel 25', en: 'Level 25' }, target: 25, reward: 1500, value: (c) => c.bestLevel },
  { id: 'streak-7', name: { es: 'Semana completa', en: 'Full week' }, target: 7, reward: 500, value: (c) => c.lifetime.bestStreak },
  { id: 'roster', name: { es: 'Equipo completo', en: 'Full roster' }, target: 4, reward: 1000, value: (c) => c.unlockedCount },
]
