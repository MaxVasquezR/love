import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame, currentStats, type SessionOutcome } from '../core/store'
import { useTalk } from '../core/talk'
import { clampKg, liftTuning, repXp, sessionCoins, suggestedKg } from '../core/progression'
import type { Exercise, Pose, RepQuality, StationId } from '../core/types'
import { STATIONS, STATION_ORDER, exercisesFor } from '../data/exercises'
import { coachLine, playerLine } from '../data/coach'
import { AdService } from '../ads/AdService'
import type { RepSignal } from '../game/Doll'
import { useT } from '../i18n'

type Step = 'station' | 'exercise' | 'weight' | 'lifting' | 'results'

type Props = {
  station: StationId | null
  setStation: (s: StationId | null) => void
  repRef: React.MutableRefObject<RepSignal>
  setPlayerPose: (p: Pose) => void
  setCoachPose: (p: Pose) => void
  onExit: () => void
  onLevelUp: (o: SessionOutcome) => void
  onNoEnergy: () => void
}

interface SetState {
  done: number
  perfect: number
  combo: number
  maxCombo: number
  misses: number
  xp: number
  last: RepQuality | null
  hitId: number
}

const freshSet = (): SetState => ({
  done: 0,
  perfect: 0,
  combo: 0,
  maxCombo: 0,
  misses: 0,
  xp: 0,
  last: null,
  hitId: 0,
})

interface Results {
  xp: number
  coins: number
  perfect: number
  maxCombo: number
  failed: boolean
  doubled: boolean
}

const LOCK_MS = 480

export function Training(props: Props) {
  const { station, setStation, repRef, setPlayerPose, setCoachPose, onExit, onLevelUp, onNoEnergy } = props
  const { t, L, lang } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const charId = game.selected!
  const level = game.progress[charId].level
  const stats = useMemo(() => currentStats(game, charId), [game, charId])

  const [step, setStep] = useState<Step>(station ? 'exercise' : 'station')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [weight, setWeight] = useState(0)
  const [hud, setHud] = useState<SetState>(freshSet)
  const [zone, setZone] = useState(50)
  const [results, setResults] = useState<Results | null>(null)
  const [adBusy, setAdBusy] = useState(false)

  const tuning = useMemo(
    () => (exercise ? liftTuning(exercise, stats, weight) : null),
    [exercise, stats, weight],
  )

  const sess = useRef<SetState>(freshSet())
  const markerEl = useRef<HTMLDivElement>(null)
  const markerPos = useRef(0)
  const lockUntil = useRef(0)
  const startedAt = useRef(0)

  useEffect(() => {
    setPlayerPose('idle')
    setCoachPose('point')
    say('coach', coachLine(lang, 'pickStation'))
    return () => AdService.setGameplay(false)
  }, [lang, say, setCoachPose, setPlayerPose])

  const pickStation = (s: StationId) => {
    setStation(s)
    setStep('exercise')
  }

  const pickExercise = (ex: Exercise) => {
    setExercise(ex)
    setWeight(suggestedKg(ex, stats))
    setStep('weight')
    setPlayerPose('idle')
    say('coach', coachLine(lang, 'preLift'))
  }

  const startSet = () => {
    if (!exercise) return
    if (!useGame.getState().spendEnergy()) {
      setCoachPose('point')
      say('coach', coachLine(lang, 'noEnergy'))
      onNoEnergy()
      return
    }
    sess.current = freshSet()
    setHud(freshSet())
    setZone(35 + Math.random() * 30)
    setResults(null)
    startedAt.current = performance.now()
    lockUntil.current = performance.now() + 500
    repRef.current = { start: -1e9, quality: 'good' }
    setPlayerPose('lift')
    setCoachPose('clap')
    setStep('lifting')
    AdService.setGameplay(true)
  }

  // Marker animation: writes straight to the DOM so React doesn't re-render every frame.
  useEffect(() => {
    if (step !== 'lifting' || !tuning) return
    let raf = 0
    const loop = (now: number) => {
      if (now >= lockUntil.current) {
        const u = ((now - startedAt.current) / 1000) * tuning.speed
        const phase = u % 2
        markerPos.current = (phase < 1 ? phase : 2 - phase) * 100
        if (markerEl.current) markerEl.current.style.left = `${markerPos.current}%`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [step, tuning])

  const finish = useCallback(
    (s: SetState, failed: boolean) => {
      if (!exercise) return
      AdService.setGameplay(false)
      const xp = Math.round(s.xp * (failed ? 0.6 : 1))
      const coins = sessionCoins(xp, s.perfect)
      const outcome = useGame.getState().recordSession({
        characterId: charId,
        station: exercise.station,
        exerciseId: exercise.id,
        weight,
        reps: exercise.reps,
        goodReps: s.done,
        perfectReps: s.perfect,
        maxCombo: s.maxCombo,
        xp,
        coins,
        failed,
      })
      setResults({ xp, coins, perfect: s.perfect, maxCombo: s.maxCombo, failed, doubled: false })
      setStep('results')
      setPlayerPose(failed ? 'idle' : 'cheer')
      setCoachPose(failed ? 'point' : 'clap')
      say('coach', coachLine(lang, failed ? 'failed' : 'done'), 3600)
      if (!failed) {
        say('player', playerLine(lang, 'done'))
        AdService.happytime()
      }
      if (outcome.levelsGained > 0) window.setTimeout(() => onLevelUp(outcome), 900)
    },
    [charId, exercise, lang, onLevelUp, say, setCoachPose, setPlayerPose, weight],
  )

  const lift = useCallback(() => {
    if (step !== 'lifting' || !tuning || !exercise) return
    const now = performance.now()
    if (now < lockUntil.current) return
    lockUntil.current = now + LOCK_MS

    const dist = Math.abs(markerPos.current - zone)
    const quality: RepQuality =
      dist <= tuning.perfectWidth / 2 ? 'perfect' : dist <= tuning.zoneWidth / 2 ? 'good' : 'miss'

    const s = { ...sess.current }
    if (quality === 'miss') {
      s.misses += 1
      s.combo = 0
    } else {
      s.done += 1
      s.combo += 1
      if (quality === 'perfect') s.perfect += 1
      s.maxCombo = Math.max(s.maxCombo, s.combo)
      s.xp += repXp(weight, tuning.difficulty, quality, s.combo)
    }
    s.last = quality
    s.hitId += 1
    sess.current = s
    setHud(s)
    repRef.current = { start: now, quality }

    if (quality === 'miss') {
      setCoachPose('point')
      say('coach', coachLine(lang, 'miss'), 1800)
      say('player', playerLine(lang, 'miss'), 1400)
    } else if ([3, 5, 8, 12].includes(s.combo)) {
      setCoachPose('cheer')
      say('coach', coachLine(lang, 'combo', { n: s.combo }), 1800)
    } else if (quality === 'perfect' && Math.random() < 0.5) {
      setCoachPose('clap')
      say('coach', coachLine(lang, 'perfect'), 1600)
    } else if (Math.random() < 0.3) {
      say('coach', coachLine(lang, 'good'), 1500)
    }

    if (s.done >= exercise.reps) {
      window.setTimeout(() => finish(s, false), 650)
      lockUntil.current = Infinity
    } else if (s.misses >= tuning.maxMisses) {
      window.setTimeout(() => finish(s, true), 650)
      lockUntil.current = Infinity
    } else {
      setZone(30 + Math.random() * 40)
    }
  }, [exercise, finish, lang, repRef, say, setCoachPose, step, tuning, weight, zone])

  useEffect(() => {
    if (step !== 'lifting') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        lift()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lift, step])

  const leaveResults = async (next: 'again' | 'hub') => {
    await AdService.midgameIfReady('after_set')
    if (next === 'again') {
      setStep('weight')
      setPlayerPose('idle')
      say('coach', coachLine(lang, 'preLift'))
    } else {
      setStation(null)
      onExit()
    }
  }

  const doubleCoins = async () => {
    if (!results || results.doubled || adBusy) return
    setAdBusy(true)
    const ok = await AdService.rewarded('double_coins')
    setAdBusy(false)
    if (ok) {
      useGame.getState().addCoins(results.coins)
      setResults({ ...results, doubled: true })
      say('player', t('doubled'))
    }
  }

  const back = () => {
    if (step === 'weight') setStep('exercise')
    else if (step === 'exercise') {
      setStation(null)
      setStep('station')
    } else onExit()
  }

  const diffLabel = (d: number) =>
    d < 0.7 ? t('easy') : d < 1 ? t('medium') : d < 1.25 ? t('hard') : t('insane')

  return (
    <div className="dock fade-in">
      {step === 'station' && (
        <>
          <div className="dock__row">
            <strong>{t('pickStation')}</strong>
            <button type="button" className="btn btn--ghost btn--sm" onClick={back}>
              {t('back')}
            </button>
          </div>
          <div className="choice-row">
            {STATION_ORDER.map((id) => {
              const st = STATIONS[id]
              const locked = level < st.unlockLevel
              return (
                <button
                  key={id}
                  type="button"
                  className={`choice choice--${id}`}
                  disabled={locked}
                  onClick={() => pickStation(id)}
                >
                  <b>{L(st.title)}</b>
                  <small>{locked ? `🔒 ${t('unlocksAt', { lvl: st.unlockLevel })}` : L(st.muscles)}</small>
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 'exercise' && station && (
        <>
          <div className="dock__row">
            <strong>
              {t('pickExercise')} · <span className="accent">{L(STATIONS[station].title)}</span>
            </strong>
            <button type="button" className="btn btn--ghost btn--sm" onClick={back}>
              {t('back')}
            </button>
          </div>
          <div className="choice-grid">
            {exercisesFor(station).map((ex) => {
              const locked = level < ex.unlockLevel
              return (
                <button
                  key={ex.id}
                  type="button"
                  className="choice choice--sm"
                  disabled={locked}
                  onClick={() => pickExercise(ex)}
                >
                  <b>{L(ex.name)}</b>
                  <small>{locked ? `🔒 ${t('unlocksAt', { lvl: ex.unlockLevel })}` : `${ex.reps} reps`}</small>
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 'weight' && exercise && tuning && (
        <>
          <div className="dock__row">
            <div className="dock__title">
              <strong>{L(exercise.name)}</strong>
              <p className="hint">{L(exercise.blurb)}</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={back}>
              {t('back')}
            </button>
          </div>
          <div className="weight-row">
            <button
              type="button"
              className="round-btn"
              onClick={() => setWeight((w) => clampKg(exercise, w - exercise.step))}
              aria-label="-"
            >
              −
            </button>
            <div className="weight-val">
              <b>{weight}</b> kg
              <small className={`diff diff--${Math.min(3, Math.floor(tuning.difficulty / 0.35))}`}>
                {t('difficulty')}: {diffLabel(tuning.difficulty)}
              </small>
            </div>
            <button
              type="button"
              className="round-btn"
              onClick={() => setWeight((w) => clampKg(exercise, w + exercise.step))}
              aria-label="+"
            >
              +
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={startSet}>
            {t('startSet')}
          </button>
        </>
      )}

      {step === 'lifting' && exercise && tuning && (
        <>
          <div className="lift-hud">
            <span>
              {t('rep')} <b>{hud.done}/{exercise.reps}</b>
            </span>
            <span className={hud.combo >= 3 ? 'hot' : ''}>
              {t('combo')} <b>x{hud.combo}</b>
            </span>
            <span>
              {t('misses')}{' '}
              <b>
                {'●'.repeat(hud.misses)}
                {'○'.repeat(Math.max(0, tuning.maxMisses - hud.misses))}
              </b>
            </span>
          </div>
          <div className="meter" onPointerDown={lift}>
            <div
              className="meter__zone"
              style={{ left: `${zone - tuning.zoneWidth / 2}%`, width: `${tuning.zoneWidth}%` }}
            />
            <div
              className="meter__perfect"
              style={{ left: `${zone - tuning.perfectWidth / 2}%`, width: `${tuning.perfectWidth}%` }}
            />
            <div className="meter__marker" ref={markerEl} />
            {hud.last && (
              <span key={hud.hitId} className={`meter__pop pop--${hud.last}`}>
                {t(hud.last)}
                {hud.last !== 'miss' && hud.combo >= 2 ? ` x${hud.combo}` : ''}
              </span>
            )}
          </div>
          <button type="button" className="btn btn--lift" onPointerDown={lift}>
            {t('lift')}
          </button>
        </>
      )}

      {step === 'results' && results && (
        <>
          <div className="dock__row">
            <strong className={results.failed ? 'warn' : 'accent'}>
              {results.failed ? t('resultsFailed') : t('resultsTitle')}
            </strong>
          </div>
          <div className="result-row">
            <div>
              <small>{t('xpGained')}</small>
              <b>+{results.xp}</b>
            </div>
            <div>
              <small>{t('coinsGained')}</small>
              <b>+{results.doubled ? results.coins * 2 : results.coins}</b>
            </div>
            <div>
              <small>{t('perfectReps')}</small>
              <b>{results.perfect}</b>
            </div>
            <div>
              <small>{t('maxCombo')}</small>
              <b>x{results.maxCombo}</b>
            </div>
          </div>
          {AdService.canShowRewarded() && results.coins > 0 && (
            <button
              type="button"
              className="btn btn--ad"
              disabled={results.doubled || adBusy}
              onClick={doubleCoins}
            >
              {results.doubled ? `✓ ${t('doubled')}` : `▶ ${t('doubleCoins')} · ${t('watchAd')}`}
            </button>
          )}
          <div className="row-2">
            <button type="button" className="btn btn--ghost" onClick={() => leaveResults('hub')}>
              {t('toHub')}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => leaveResults('again')}>
              {t('trainAgain')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
