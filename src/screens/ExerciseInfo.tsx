import { useEffect } from 'react'
import { Modal } from '../components/Modal'
import type { Exercise } from '../core/types'
import { GOALS, GOAL_ORDER, STATIONS } from '../data/exercises'
import { useT } from '../i18n'

const KEY = 'gl-fichas'

function seenList(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function fichaSeen(id: string) {
  return seenList().includes(id)
}

function markSeen(id: string) {
  try {
    const list = seenList()
    if (!list.includes(id)) localStorage.setItem(KEY, JSON.stringify([...list, id]))
  } catch {
    /* storage may be blocked inside some iframes */
  }
}

/** Technique sheet: muscles, cues, common mistakes and how to train it for each goal. */
export function ExerciseInfo({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const { t } = useT()
  useEffect(() => markSeen(exercise.id), [exercise.id])

  return (
    <Modal title={`${t('fichaTitle')} · ${exercise.name}`} onClose={onClose} wide>
      <p>{exercise.blurb}</p>
      <div className="ficha">
        <section>
          <h3>💪 {t('fichaMuscles')}</h3>
          <p>
            {exercise.muscles} <span className="tag">{STATIONS[exercise.station].title}</span>
          </p>
        </section>
        <section>
          <h3>✅ {t('fichaCues')}</h3>
          <ul>
            {exercise.cues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>❌ {t('fichaMistakes')}</h3>
          <ul className="bad">
            {exercise.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>🎯 {t('goal')}</h3>
          <div className="goal-table">
            {GOAL_ORDER.map((g) => (
              <div key={g}>
                <b>{GOALS[g].label}</b>
                <small>
                  {GOALS[g].sets}×{GOALS[g].reps} · {t('restReal', { rest: GOALS[g].restReal })}
                </small>
                <small>{GOALS[g].why}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <p className="disclaimer">{t('disclaimer')}</p>
      <button type="button" className="btn btn--primary" onClick={onClose}>
        {t('fichaGot')}
      </button>
    </Modal>
  )
}
