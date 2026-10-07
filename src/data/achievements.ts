import type { Lifetime } from '../core/types'

export interface AchievementContext {
  lifetime: Lifetime
  bestLevel: number
  unlockedCount: number
}

export interface AchievementDef {
  id: string
  name: string
  target: number
  reward: number
  value: (c: AchievementContext) => number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: 'Primer día en Bonnetty', target: 1, reward: 50, value: (c) => c.lifetime.sessions },
  { id: 'sessions-25', name: 'Cliente frecuente', target: 25, reward: 250, value: (c) => c.lifetime.sessions },
  { id: 'sessions-100', name: 'Vive en el gym', target: 100, reward: 800, value: (c) => c.lifetime.sessions },
  { id: 'reps-100', name: '100 reps', target: 100, reward: 100, value: (c) => c.lifetime.reps },
  { id: 'reps-1000', name: 'Mil repeticiones', target: 1000, reward: 600, value: (c) => c.lifetime.reps },
  { id: 'perfect-50', name: 'Técnica limpia', target: 50, reward: 200, value: (c) => c.lifetime.perfectReps },
  { id: 'perfect-300', name: 'Maestro de la forma', target: 300, reward: 700, value: (c) => c.lifetime.perfectReps },
  { id: 'kg-10k', name: '10 toneladas movidas', target: 10000, reward: 200, value: (c) => c.lifetime.kg },
  { id: 'kg-100k', name: '100 toneladas movidas', target: 100000, reward: 1000, value: (c) => c.lifetime.kg },
  { id: 'combo-8', name: 'Combo imparable', target: 8, reward: 250, value: (c) => c.lifetime.bestCombo },
  { id: 'pr-1', name: 'Primer PR', target: 1, reward: 100, value: (c) => c.lifetime.prs },
  { id: 'pr-20', name: 'Rompe-récords', target: 20, reward: 600, value: (c) => c.lifetime.prs },
  { id: 'quiz-10', name: 'Alumno de la Profe', target: 10, reward: 300, value: (c) => c.lifetime.quizRight },
  { id: 'routine-5', name: 'Disciplina de rutina', target: 5, reward: 400, value: (c) => c.lifetime.routines },
  { id: 'share-1', name: 'Influencer fitness', target: 1, reward: 150, value: (c) => c.lifetime.shares },
  { id: 'level-5', name: 'Nivel 5', target: 5, reward: 150, value: (c) => c.bestLevel },
  { id: 'level-10', name: 'Nivel 10', target: 10, reward: 400, value: (c) => c.bestLevel },
  { id: 'level-25', name: 'Nivel 25', target: 25, reward: 1500, value: (c) => c.bestLevel },
  { id: 'streak-7', name: 'Semana completa', target: 7, reward: 500, value: (c) => c.lifetime.bestStreak },
  { id: 'roster', name: 'Equipo completo', target: 5, reward: 1200, value: (c) => c.unlockedCount },
]
