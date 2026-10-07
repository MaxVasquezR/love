import type { Exercise } from '../core/types'
import { useGame } from '../core/store'
import { useT } from '../i18n'

export type DemoBeat =
  | { kind: 'intro' }
  | { kind: 'cue'; index: number }
  | { kind: 'mistake' }
  | { kind: 'correct' }
  | { kind: 'done' }

/** On-screen card for the Profe's technique demo: caption, ✓/✗ badge, muscles and progress. */
export function TechniqueDemo({
  exercise,
  beat,
  cues,
  onSkip,
  onDone,
  onFicha,
}: {
  exercise: Exercise
  beat: DemoBeat
  cues: string[]
  onSkip: () => void
  onDone: () => void
  onFicha: () => void
}) {
  const { t } = useT()
  const voice = useGame((s) => s.voice)
  const setVoice = useGame((s) => s.setVoice)
  const total = cues.length + 3
  const at =
    beat.kind === 'intro' ? 0 : beat.kind === 'cue' ? 1 + beat.index : beat.kind === 'mistake' ? cues.length + 1 : beat.kind === 'correct' ? cues.length + 2 : total

  let badge = '👀'
  let tone = 'info'
  let caption = t('demoIntro', { name: exercise.name })
  if (beat.kind === 'cue') {
    badge = '✓'
    tone = 'good'
    caption = cues[beat.index]
  } else if (beat.kind === 'mistake') {
    badge = '✗'
    tone = 'bad'
    caption = exercise.mistakes[0] ?? ''
  } else if (beat.kind === 'correct') {
    badge = '✓'
    tone = 'good'
    caption = t('demoCorrect')
  } else if (beat.kind === 'done') {
    badge = '💪'
    tone = 'good'
    caption = t('demoDone')
  }

  return (
    <div className="demo" role="dialog" aria-label={t('demoTitle')}>
      <div className="demo__card">
        <div className="demo__top">
          <span className="demo__tag">{t('demoTitle')}</span>
          <b>{exercise.name}</b>
          <button type="button" className="icon-btn" onClick={() => setVoice(!voice)} aria-label={t('voice')}>
            {voice ? '🔊' : '🔇'}
          </button>
        </div>
        <div className="demo__muscles">
          {exercise.muscles.split(/[·,]/).map((m) => (
            <span key={m} className="chip chip--muscle">
              {m.trim()}
            </span>
          ))}
        </div>
        <div className={`demo__caption demo__caption--${tone}`} key={`${beat.kind}${'index' in beat ? beat.index : ''}`}>
          <span className="demo__badge">{badge}</span>
          <p>
            {beat.kind === 'mistake' && <small>{t('demoMistake')}</small>}
            {beat.kind === 'cue' && <small>{t('demoCue', { n: beat.index + 1 })}</small>}
            {caption}
          </p>
        </div>
        <div className="demo__dots">
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < at ? 'done' : i === at ? 'on' : ''} />
          ))}
        </div>
        {beat.kind === 'done' ? (
          <div className="demo__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onFicha}>
              📋 {t('demoFicha')}
            </button>
            <button type="button" className="btn btn--primary" onClick={onDone}>
              {t('demoGo')}
            </button>
          </div>
        ) : (
          <div className="demo__actions">
            <small className="demo__slow">🐢 {t('demoSlow')}</small>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onSkip}>
              {t('demoSkip')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
