import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { currentStats, useGame } from '../core/store'
import { useTalk } from '../core/talk'
import { sfx } from '../core/audio'
import { suggestedKgFor } from '../core/progression'
import { todayKey } from '../core/economy'
import { routineText, shareRoutineImage, shareWhatsApp, type RoutineCardData } from '../core/share'
import { GOALS, GOAL_ORDER, STATIONS, exerciseById } from '../data/exercises'
import { LESSONS, LESSON_PERFECT_BONUS, LESSON_REWARD, lessonById, type Lesson } from '../data/lessons'
import { CHARACTERS } from '../data/characters'
import { coachLine } from '../data/coach'
import type { Exercise, Goal, Pose, StationId } from '../core/types'
import { L, useT } from '../i18n'
import { SCHOOL_EN } from '../i18n/content.en'

type Tab = 'technique' | 'basics' | 'routine' | 'streak'

type Props = {
  onClose: () => void
  onDemo: (ex: Exercise, lessonId: string) => void
  setCoachPose: (p: Pose) => void
  initialLesson?: string | null
}

const DAY_PLAN: Record<StationId, string[]> = {
  push: ['bench-bar', 'incline', 'ohp', 'dips'],
  pull: ['lat-pulldown', 'bar-row', 'db-row', 'rdl'],
  legs: ['squat', 'leg-press', 'lunges', 'hip-thrust'],
}

const DAY_TIPS: Record<StationId, string> = {
  push: 'Calienta hombros con 2 series ligeras antes del press.',
  pull: 'Piensa en llevar los codos atrás, no en jalar con las manos.',
  legs: 'Lleva rodilleras si tus rodillas lo agradecen y toma agua entre series.',
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d
}

/** Push / pull / legs rotation keyed on the calendar day, so tomorrow's split is stable. */
function rotationFor(d: Date): StationId {
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
  return (['push', 'pull', 'legs'] as const)[day % 3]
}

export function School({ onClose, onDemo, setCoachPose, initialLesson }: Props) {
  const { t } = useT()
  const lessons = useGame((s) => s.lessons)
  const initial = initialLesson ? lessonById(initialLesson) : undefined
  const [tab, setTab] = useState<Tab>(initial?.kind ?? 'technique')
  const [open, setOpen] = useState<Lesson | null>(initial ?? null)

  const badges = Object.values(lessons).filter((v) => v >= 3).length
  const list = LESSONS.filter((l) => l.kind === tab)

  return (
    <Modal title={`🎓 ${t('schoolTitle')}`} onClose={onClose} wide>
      {open ? (
        <LessonView
          lesson={open}
          best={lessons[open.id]}
          onBack={() => setOpen(null)}
          onDemo={onDemo}
          setCoachPose={setCoachPose}
        />
      ) : (
        <>
          <div className="seg school-tabs">
            {(['technique', 'basics', 'routine', 'streak'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={tab === k ? 'on' : ''}
                onClick={() => {
                  sfx.click()
                  setTab(k)
                }}
              >
                {t(`schoolTab_${k}`)}
              </button>
            ))}
          </div>
          {(tab === 'technique' || tab === 'basics') && (
            <>
              <p className="muted small center">
                {t('schoolBadges', { n: badges, total: LESSONS.length })} · {t('schoolReward', { coins: LESSON_REWARD, bonus: LESSON_PERFECT_BONUS })}
              </p>
              <div className="lesson-list">
                {list.map((l) => {
                  const best = lessons[l.id]
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`lesson-card ${best !== undefined ? 'done' : ''} ${best === 3 ? 'perfect' : ''}`}
                      onClick={() => {
                        sfx.click()
                        setOpen(l)
                      }}
                    >
                      <span className="lesson-card__icon">{l.icon}</span>
                      <span className="lesson-card__title">{l.title}</span>
                      <span className="lesson-card__state">
                        {best === undefined ? `+${LESSON_REWARD}` : best === 3 ? '🏅' : `${best}/3`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {tab === 'routine' && <TomorrowRoutine />}
          {tab === 'streak' && <RealStreak setCoachPose={setCoachPose} />}
        </>
      )}
    </Modal>
  )
}

function LessonView({
  lesson,
  best,
  onBack,
  onDemo,
  setCoachPose,
}: {
  lesson: Lesson
  best: number | undefined
  onBack: () => void
  onDemo: Props['onDemo']
  setCoachPose: Props['setCoachPose']
}) {
  const { t } = useT()
  const say = useTalk((s) => s.say)
  const [step, setStep] = useState<'read' | number | 'done'>('read')
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [earned, setEarned] = useState(0)
  const ex = lesson.exerciseId ? exerciseById(lesson.exerciseId) : undefined

  const answer = (i: number) => {
    if (typeof step !== 'number' || picked !== null) return
    const right = i === lesson.quiz[step].answer
    setPicked(i)
    if (right) {
      setScore((s) => s + 1)
      sfx.coin()
    } else sfx.miss()
  }

  const next = () => {
    if (typeof step !== 'number') return
    setPicked(null)
    if (step + 1 < lesson.quiz.length) {
      setStep(step + 1)
      return
    }
    const coins = useGame.getState().completeLesson(lesson.id, score)
    setEarned(coins)
    setStep('done')
    const perfect = score >= lesson.quiz.length
    if (perfect) sfx.levelUp()
    setCoachPose(perfect ? 'clap' : 'point')
    say('coach', coachLine('lesson', { score, badge: lesson.badge }), 3600)
  }

  if (step === 'read') {
    return (
      <div className="lesson fade-in">
        <h3 className="lesson__title">
          {lesson.icon} {lesson.title}
        </h3>
        <ul className="lesson__body">
          {lesson.body.map((b) => (
            <li key={b} className={b.startsWith('✓') ? 'good' : b.startsWith('✗') ? 'bad' : ''}>
              {b.replace(/^[✓✗] /, '')}
            </li>
          ))}
        </ul>
        <p className="muted small center">🏅 {t('schoolBadgeHint', { badge: lesson.badge })}</p>
        <div className="row">
          <button type="button" className="btn" onClick={onBack}>
            ← {t('back')}
          </button>
          {ex && (
            <button type="button" className="btn" onClick={() => onDemo(ex, lesson.id)}>
              🎬 {t('schoolWatch')}
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              sfx.click()
              setStep(0)
            }}
          >
            🧠 {t('schoolQuiz')}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    const perfect = score >= lesson.quiz.length
    return (
      <div className="lesson lesson--done fade-in">
        <p className="lesson__score">{perfect ? '🏅' : score >= 2 ? '💪' : '📚'}</p>
        <h3 className="center">{t('schoolScore', { score, total: lesson.quiz.length })}</h3>
        {perfect && <p className="accent center">{t('schoolBadgeWon', { badge: lesson.badge })}</p>}
        {earned > 0 ? (
          <p className="accent center">+{earned} 🪙</p>
        ) : (
          <p className="muted center">{best !== undefined ? t('schoolRepeat') : ''}</p>
        )}
        <div className="row">
          <button type="button" className="btn" onClick={() => setStep('read')}>
            📖 {t('schoolReread')}
          </button>
          <button type="button" className="btn btn--primary" onClick={onBack}>
            {t('continue')}
          </button>
        </div>
      </div>
    )
  }

  const q = lesson.quiz[step]
  return (
    <div className="lesson fade-in">
      <p className="muted small center">
        {lesson.icon} {lesson.title} · {step + 1}/{lesson.quiz.length}
      </p>
      <p className="quiz-q">{q.q}</p>
      <div className="quiz-opts">
        {q.options.map((o, i) => {
          const state = picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim'
          return (
            <button key={o} type="button" className={`quiz-opt ${state}`} onClick={() => answer(i)}>
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <>
          <p className="tip-card">
            {picked === q.answer ? '✅ ' : '❌ '}
            {q.why}
          </p>
          <button type="button" className="btn btn--primary" onClick={next}>
            {step + 1 < lesson.quiz.length ? t('next') : t('schoolFinish')}
          </button>
        </>
      )}
    </div>
  )
}

function TomorrowRoutine() {
  const { t, lang } = useT()
  const game = useGame()
  const day = useMemo(tomorrow, [])
  const [split, setSplit] = useState<StationId>(() => rotationFor(day))
  const [goal, setGoal] = useState<Goal>('hipertrofia')
  const [status, setStatus] = useState('')
  const g = GOALS[goal]
  const en = lang === 'en'
  const name = game.selected ? CHARACTERS[game.selected].name : en ? SCHOOL_EN.me : 'Yo'

  const card: RoutineCardData = useMemo(() => {
    const stats = game.selected ? currentStats(game, game.selected) : null
    return {
      name,
      title: `${STATIONS[split].title} · ${g.label}`,
      date: en
        ? `${SCHOOL_EN.weekdays[day.getDay()]} ${day.getMonth() + 1}/${day.getDate()}`
        : `${WEEKDAYS[day.getDay()]} ${day.getDate()}/${day.getMonth() + 1}`,
      items: DAY_PLAN[split].flatMap((id) => {
        const ex = exerciseById(id)
        if (!ex) return []
        const kg = stats ? suggestedKgFor(ex, stats, g.load) : ex.baseKg
        return [{ name: ex.name, sets: g.sets + (goal === 'resistencia' ? 1 : 0), reps: g.reps, rest: g.restReal, kg }]
      }),
      tip: en ? SCHOOL_EN.dayTips[split] : DAY_TIPS[split],
    }
  }, [game, name, split, g, goal, day, en])

  const saveImage = async () => {
    sfx.click()
    setStatus(t('routineMaking'))
    const ok = await shareRoutineImage(card)
    setStatus(ok ? t('routineSaved') : '')
  }

  return (
    <div className="routine-card fade-in">
      <p className="muted small center">{t('routineIntro', { day: card.date })}</p>
      <div className="seg">
        {(['push', 'pull', 'legs'] as const).map((s) => (
          <button key={s} type="button" className={split === s ? 'on' : ''} onClick={() => setSplit(s)}>
            {STATIONS[s].title}
          </button>
        ))}
      </div>
      <div className="seg">
        {GOAL_ORDER.map((k) => (
          <button key={k} type="button" className={goal === k ? 'on' : ''} onClick={() => setGoal(k)}>
            {GOALS[k].label}
          </button>
        ))}
      </div>
      <ol className="routine-list">
        {card.items.map((it) => (
          <li key={it.name}>
            <b>{it.name}</b>
            <span>
              {it.sets}×{it.reps} · {it.rest}
            </span>
            <em>{it.kg} kg</em>
          </li>
        ))}
      </ol>
      <p className="tip-card">💡 {card.tip} {t('routineAdjust')}</p>
      <div className="row">
        <button type="button" className="btn btn--primary" onClick={saveImage}>
          🖼️ {t('routineImage')}
        </button>
        <button
          type="button"
          className="btn btn--wa"
          onClick={() => {
            sfx.click()
            shareWhatsApp(routineText(card))
          }}
        >
          WhatsApp
        </button>
      </div>
      {status && <p className="muted small center">{status}</p>}
    </div>
  )
}

const STREAK_BADGES = [
  { days: 3, label: 'Constante', icon: '🥉' },
  { days: 7, label: 'Semana de hierro', icon: '🥈' },
  { days: 30, label: 'Leyenda del gym', icon: '🥇' },
]

export function RealStreak({ setCoachPose }: { setCoachPose: (p: Pose) => void }) {
  const { t } = useT()
  const r = useGame((s) => s.realStreak)
  const say = useTalk((s) => s.say)
  const [confirm, setConfirm] = useState(false)
  const [earned, setEarned] = useState<number | null>(null)
  const doneToday = r.last === todayKey()

  const checkIn = () => {
    const coins = useGame.getState().checkInGym()
    setConfirm(false)
    if (coins === null) return
    setEarned(coins)
    sfx.levelUp()
    setCoachPose('clap')
    say('coach', t('streakCoach', { n: useGame.getState().realStreak.streak }), 3600)
  }

  return (
    <div className="streak-card fade-in">
      <p className="streak-card__big">🔥 {r.streak}</p>
      <p className="center">{t('streakDays', { n: r.streak })}</p>
      <p className="muted small center">{t('streakStats', { best: r.best, total: r.total })}</p>
      <div className="streak-badges">
        {STREAK_BADGES.map((b, i) => (
          <span key={b.days} className={`chip ${r.best >= b.days ? 'chip--on' : 'chip--off'}`}>
            {b.icon} {L(b.label, SCHOOL_EN.badges[i])} · {b.days}d
          </span>
        ))}
      </div>
      {doneToday ? (
        <p className="accent center">✅ {t('streakDone')}{earned ? ` +${earned} 🪙` : ''}</p>
      ) : confirm ? (
        <div className="streak-confirm">
          <p className="center">{t('streakHonor')}</p>
          <div className="row">
            <button type="button" className="btn" onClick={() => setConfirm(false)}>
              {t('streakNotYet')}
            </button>
            <button type="button" className="btn btn--primary" onClick={checkIn}>
              🤝 {t('streakYes')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--primary btn--xl" onClick={() => setConfirm(true)}>
          ✅ {t('streakCheck')}
        </button>
      )}
      <p className="muted small center">{t('streakHint')}</p>
    </div>
  )
}
