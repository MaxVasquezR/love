import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame, boostActive, currentStats, type SessionOutcome } from '../core/store'
import { useTalk } from '../core/talk'
import { clampKg, liftTuning, repXp, sessionCoins, suggestedKgFor } from '../core/progression'
import { ROUTINE_ENERGY, todayKey } from '../core/economy'
import type { Exercise, Goal, Pose, RepQuality, RigId, StationId } from '../core/types'
import { GOALS, GOAL_ORDER, STATIONS, STATION_ORDER, exerciseById, exerciseName, exercisesFor } from '../data/exercises'
import { ROUTINES, dailyRoutine, routineLocked, type RoutineDef } from '../data/routines'
import { coachLine, coachPose, playerLine } from '../data/coach'
import { randomTip } from '../data/tips'
import { AdService } from '../ads/AdService'
import { sfx } from '../core/audio'
import { music } from '../core/music'
import type { RepSignal } from '../game/Doll'
import type { RigFocus } from '../game/equipment/RigSet'
import { demoSeen } from './CoachDemo'
import { useT } from '../i18n'
import { track } from '../core/analytics'
import type { RematchInfo } from './RematchModal'
import { ShareMoment } from '../components/ShareMoment'
import { challengeLink, playerName } from '../core/share'
import { LiftPad } from './LiftPad'
import { freshLift, repsLeft, type LiftEvent, type LiftState } from '../core/liftEngine'

type Step = 'menu' | 'station' | 'exercise' | 'setup' | 'routines' | 'lifting' | 'rest' | 'second' | 'results'

export interface PrInfo {
  exerciseId: string
  kg: number
  reps: number
}

type Props = {
  station: StationId | null
  setStation: (s: StationId | null) => void
  setFocus: (f: RigFocus | null) => void
  repRef: React.MutableRefObject<RepSignal>
  setPlayerPose: (p: Pose) => void
  setCoachPose: (p: Pose) => void
  onExit: () => void
  onLevelUp: (o: SessionOutcome) => void
  onNoEnergy: () => void
  onFicha: (ex: Exercise) => void
  onDemo: (ex: Exercise) => void
  onPr: (pr: PrInfo) => void
  onChallengeWon: (r: RematchInfo) => void
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
  /** Stopped 1-2 reps short of failure (RIR bonus). */
  rir: boolean
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
  rir: false,
})

interface PlanStep {
  exercise: Exercise
  goal: Goal
  sets: number
  weight: number
}

interface Plan {
  steps: PlanStep[]
  routine: RoutineDef | null
  daily: boolean
}

interface Cursor {
  step: number
  set: number
}

interface Totals {
  xp: number
  goodReps: number
  perfect: number
  maxCombo: number
  sets: number
  rirSets: number
  /** Heaviest completed set per exercise. */
  done: Record<string, { kg: number; reps: number }>
}

const freshTotals = (): Totals => ({ xp: 0, goodReps: 0, perfect: 0, maxCombo: 0, sets: 0, rirSets: 0, done: {} })

interface Results {
  xp: number
  coins: number
  bonus: number
  perfect: number
  maxCombo: number
  failed: boolean
  doubled: boolean
  boosted: boolean
  exerciseId: string
  kg: number
  rirSets: number
}

/** Combo worth showing off from the results screen. */
const SHARE_COMBO = 8

/** Sessions now have several sets; keeps leveling pace close to one set per energy. */
const XP_SCALE = 0.6
/** Reps past the target pay more: the push-your-luck part of the set. */
const EXTRA_REP_XP = 1.5
const RIR_XP_BONUS = 1.25
/** Tank left after a second chance. */
const SECOND_CHANCE_TANK = 0.45

function nextCursor(c: Cursor, p: Plan): Cursor | null {
  if (c.set + 1 < p.steps[c.step].sets) return { step: c.step, set: c.set + 1 }
  if (c.step + 1 < p.steps.length) return { step: c.step + 1, set: 0 }
  return null
}

function addToTotals(tt: Totals, s: SetState, ps: PlanStep, completed: boolean) {
  tt.xp += s.xp * GOALS[ps.goal].xpMult
  tt.goodReps += s.done
  tt.perfect += s.perfect
  tt.maxCombo = Math.max(tt.maxCombo, s.maxCombo)
  if (!completed) return
  tt.sets += 1
  if (s.rir) tt.rirSets += 1
  const prev = tt.done[ps.exercise.id]
  if (!prev || ps.weight > prev.kg || (ps.weight === prev.kg && s.done > prev.reps))
    tt.done[ps.exercise.id] = { kg: ps.weight, reps: s.done }
}

export function Training(props: Props) {
  const { station, setStation, setFocus, repRef, setPlayerPose, setCoachPose, onExit, onLevelUp, onNoEnergy, onFicha, onDemo, onPr, onChallengeWon } = props
  const { t } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const charId = game.selected!
  const level = game.progress[charId].level
  const stats = useMemo(() => currentStats(game, charId), [game, charId])

  const [step, setStep] = useState<Step>(station ? 'exercise' : 'menu')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [goal, setGoal] = useState<Goal>('hipertrofia')
  const [weight, setWeight] = useState(0)
  const [selRoutine, setSelRoutine] = useState<RoutineDef | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [cursor, setCursor] = useState<Cursor>({ step: 0, set: 0 })
  const [hud, setHud] = useState<SetState>(freshSet)
  const [padKey, setPadKey] = useState(0)
  const [startTank, setStartTank] = useState(1)
  const [results, setResults] = useState<Results | null>(null)
  const [rest, setRest] = useState<{ until: number; tip: string } | null>(null)
  const [restLeft, setRestLeft] = useState(0)
  const [adBusy, setAdBusy] = useState(false)

  const planRef = useRef<Plan | null>(null)
  const cursorRef = useRef<Cursor>({ step: 0, set: 0 })
  const rigRef = useRef<RigId | null>(null)
  const totals = useRef<Totals>(freshTotals())
  const secondUsed = useRef(false)
  const sess = useRef<SetState>(freshSet())
  const lockUntil = useRef(0)
  const liftState = useRef<LiftState>(freshLift())
  const saidLowTank = useRef(false)
  const lastStallLine = useRef(0)
  const seenTutorial = useGame((s) => s.seenLiftTutorial)
  const markTutorial = useGame((s) => s.markLiftTutorial)

  useEffect(() => {
    if (step === 'setup' && exercise) setFocus({ rig: exercise.rig, kg: weight })
  }, [step, exercise, weight, setFocus])

  const cur: PlanStep | null = plan ? plan.steps[cursor.step] : null
  const liftEx = cur?.exercise ?? exercise
  const liftKg = cur ? cur.weight : weight
  const liftGoal = GOALS[cur?.goal ?? goal]
  const tuning = useMemo(
    () => (liftEx ? liftTuning(liftEx, stats, liftKg, liftGoal.reps, liftGoal.load) : null),
    [liftEx, stats, liftKg, liftGoal],
  )
  const daily = useMemo(() => dailyRoutine(todayKey(), level), [level])
  const dailyDone = game.routineDaily === todayKey()

  useEffect(() => {
    setPlayerPose('idle')
    setCoachPose(coachPose('pickStation'))
    say('coach', coachLine('pickStation'))
    return () => AdService.setGameplay(false)
  }, [say, setCoachPose, setPlayerPose])

  // Coach reacts to the chosen weight: too light or very heavy.
  useEffect(() => {
    if (step !== 'setup' || !tuning) return
    const id = window.setTimeout(() => {
      if (tuning.difficulty < 0.5) {
        setCoachPose(coachPose('lowWeight'))
        say('coach', coachLine('lowWeight'))
      } else if (tuning.difficulty > 1.2) {
        setCoachPose(coachPose('heavy'))
        say('coach', coachLine('heavy'))
      }
    }, 700)
    return () => window.clearTimeout(id)
  }, [step, tuning, say, setCoachPose])

  const pickStation = (s: StationId) => {
    sfx.click()
    setStation(s)
    setFocus(null)
    setStep('exercise')
  }

  const pickExercise = (ex: Exercise) => {
    sfx.click()
    setExercise(ex)
    const kg = suggestedKgFor(ex, stats, GOALS[goal].load)
    setWeight(kg)
    setFocus({ rig: ex.rig, kg })
    setStep('setup')
    setPlayerPose('idle')
    say('coach', coachLine('preLift'))
    if (!demoSeen(ex.id)) onDemo(ex)
  }

  const changeGoal = (g: Goal) => {
    sfx.click()
    setGoal(g)
    if (exercise) setWeight(suggestedKgFor(exercise, stats, GOALS[g].load))
    say('coach', GOALS[g].why, 4200)
  }

  const startSet = useCallback(
    (c: Cursor) => {
      const p = planRef.current
      if (!p) return
      const ps = p.steps[c.step]
      const moved = ps.exercise.rig !== rigRef.current
      rigRef.current = ps.exercise.rig
      setStation(ps.exercise.station)
      setFocus({ rig: ps.exercise.rig, kg: ps.weight })
      cursorRef.current = c
      setCursor(c)
      sess.current = freshSet()
      setHud(freshSet())
      setStartTank(1)
      setPadKey((k) => k + 1)
      saidLowTank.current = false
      lockUntil.current = performance.now() + (moved ? 1400 : 500)
      repRef.current = {
        start: -1e9,
        quality: 'good',
        exerciseId: ps.exercise.id,
        kg: ps.weight,
        heavy: liftTuning(ps.exercise, stats, ps.weight).difficulty >= 0.9,
      }
      setPlayerPose('lift')
      setCoachPose('clap')
      setStep('lifting')
      music.setIntensity(0.15)
      AdService.setGameplay(true)
    },
    [repRef, setCoachPose, setFocus, setPlayerPose, setStation, stats],
  )

  const begin = (p: Plan, energy: number) => {
    if (!useGame.getState().spendEnergy(energy)) {
      setCoachPose('point')
      say('coach', coachLine('noEnergy'))
      onNoEnergy()
      return
    }
    sfx.whistle()
    track('training_start', {
      routine: p.routine?.id ?? null,
      exercise: p.steps[0].exercise.id,
      kg: p.steps[0].weight,
      level,
    })
    planRef.current = p
    setPlan(p)
    totals.current = freshTotals()
    secondUsed.current = false
    setResults(null)
    const s = useGame.getState()
    const first = p.steps[0]
    const diff = liftTuning(first.exercise, stats, first.weight).difficulty
    if (!p.routine && diff < 0.5) {
      s.setLowWeight(s.lowWeight + 1)
      setCoachPose(s.lowWeight >= 1 ? 'facepalm' : 'cross')
      say('coach', coachLine('lowWeight'), 3200)
    } else if (s.lowWeight) s.setLowWeight(0)
    startSet({ step: 0, set: 0 })
  }

  const startFree = () => {
    if (!exercise) return
    begin({ steps: [{ exercise, goal, sets: GOALS[goal].sets, weight }], routine: null, daily: false }, 1)
  }

  const startRoutine = (r: RoutineDef) => {
    const steps = r.steps.map((s) => {
      const ex = exerciseById(s.exerciseId)!
      return { exercise: ex, goal: s.goal, sets: s.sets, weight: suggestedKgFor(ex, stats, GOALS[s.goal].load) }
    })
    begin({ steps, routine: r, daily: r.id === 'daily' }, ROUTINE_ENERGY)
  }

  const finish = useCallback(
    (failed: boolean) => {
      const p = planRef.current
      if (!p) return
      AdService.setGameplay(false)
      const s = useGame.getState()
      const tt = totals.current
      const boosted = boostActive(s.boosts.xp2Until)
      const xp = Math.round(tt.xp * XP_SCALE * (failed ? 0.6 : 1) * (boosted ? 2 : 1))
      const coins = sessionCoins(xp, tt.perfect)
      let bonus = 0
      if (p.routine && !failed) {
        bonus = p.routine.bonus * (p.daily && s.routineDaily !== todayKey() ? 2 : 1)
        if (p.daily) s.markRoutineDaily()
      }

      // Main lift reported to the store: the challenge exercise, then a new PR, then the first step.
      const isPr = (id: string, kg: number) => {
        const prev = s.prs[id]
        const ex = exerciseById(id)
        return prev !== undefined ? kg > prev : !!ex && kg >= ex.baseKg
      }
      const done = Object.entries(tt.done)
      const challengeHit = s.challenge && tt.done[s.challenge.exerciseId] ? s.challenge.exerciseId : null
      const prHit = done.find(([id, d]) => isPr(id, d.kg))?.[0] ?? null
      const mainId = challengeHit ?? prHit ?? p.steps[0].exercise.id
      const mainEx = exerciseById(mainId)!
      const mainDone = tt.done[mainId]
      const mainKg = mainDone?.kg ?? p.steps[0].weight
      const newPr = !!mainDone && isPr(mainId, mainDone.kg)

      const outcome = s.recordSession({
        characterId: charId,
        station: mainEx.station,
        exerciseId: mainId,
        weight: mainKg,
        sets: tt.sets,
        goodReps: tt.goodReps,
        perfectReps: tt.perfect,
        maxCombo: tt.maxCombo,
        xp,
        coins: coins + bonus,
        failed,
        newPr,
        routine: !!p.routine,
      })
      track('training_finish', {
        routine: p.routine?.id ?? null,
        exercise: mainId,
        kg: mainKg,
        failed,
        xp,
        coins: coins + bonus,
        perfect: tt.perfect,
        combo: tt.maxCombo,
        newPr,
      })
      if (outcome.levelsGained > 0) track('level_up', { level: outcome.newLevel })
      if (outcome.challengeWon) track('challenge_won', { exercise: mainId, kg: mainKg, rev: !!outcome.challenge?.rev })
      setResults({
        xp,
        coins,
        bonus,
        perfect: tt.perfect,
        maxCombo: tt.maxCombo,
        failed,
        doubled: false,
        boosted,
        exerciseId: mainId,
        kg: mainKg,
        rirSets: tt.rirSets,
      })
      setStep('results')
      sfx.coin()
      music.setIntensity(0)
      music.stinger(failed ? 'fail' : newPr ? 'pr' : 'win')
      setPlayerPose(failed ? 'idle' : 'cheer')
      const moment = failed ? 'failed' : p.routine ? 'routineDone' : 'done'
      setCoachPose(coachPose(moment))
      say('coach', coachLine(moment), 3600)
      if (!failed) {
        say('player', playerLine('done'))
        AdService.happytime()
      }
      if (outcome.challengeWon && outcome.challenge) {
        const won = { challenge: outcome.challenge, kg: mainKg, coins: outcome.challengeWon }
        window.setTimeout(() => say('coach', t('challengeWon', { coins: outcome.challengeWon }), 4000), 1800)
        window.setTimeout(() => onChallengeWon(won), 1200)
      }
      if (newPr && mainDone) {
        window.setTimeout(() => {
          sfx.pr()
          setCoachPose('flex')
          say('coach', coachLine('pr'), 3600)
          say('player', playerLine('pr'))
          onPr({ exerciseId: mainId, kg: mainDone.kg, reps: mainDone.reps })
        }, 700)
      }
      if (outcome.levelsGained > 0) {
        sfx.levelUp()
        window.setTimeout(() => onLevelUp(outcome), 900)
      }
    },
    [charId, onChallengeWon, onLevelUp, onPr, say, setCoachPose, setPlayerPose, t],
  )

  const completeSet = useCallback(
    (s: SetState) => {
      const p = planRef.current
      if (!p) return
      const c = cursorRef.current
      addToTotals(totals.current, s, p.steps[c.step], true)
      const next = nextCursor(c, p)
      if (!next) return finish(false)
      AdService.setGameplay(false)
      const sec = p.routine ? p.routine.rest : GOALS[p.steps[c.step].goal].restSec
      setRest({ until: Date.now() + sec * 1000, tip: randomTip() })
      setRestLeft(sec)
      setStep('rest')
      music.setIntensity(0.3)
      setPlayerPose('rest')
      setCoachPose('idle')
      say('coach', coachLine('rest'), 3000)
    },
    [finish, say, setCoachPose, setPlayerPose],
  )

  const failSet = useCallback(
    (s: SetState) => {
      AdService.setGameplay(false)
      if (!secondUsed.current && AdService.canShowRewarded()) {
        sess.current = s
        setStep('second')
        setPlayerPose('idle')
        setCoachPose(coachPose('secondChance'))
        say('coach', coachLine('secondChance'), 3200)
        return
      }
      const p = planRef.current
      if (p) addToTotals(totals.current, s, p.steps[cursorRef.current.step], false)
      finish(true)
    },
    [finish, say, setCoachPose, setPlayerPose],
  )

  const advance = useCallback(() => {
    const p = planRef.current
    if (!p) return
    const next = nextCursor(cursorRef.current, p)
    setRest(null)
    if (next) startSet(next)
    else finish(false)
  }, [finish, startSet])

  // Rest countdown.
  useEffect(() => {
    if (step !== 'rest' || !rest) return
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((rest.until - Date.now()) / 1000))
      setRestLeft(left)
      if (left <= 0) {
        window.clearInterval(id)
        sfx.whistle()
        advance()
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [step, rest, advance])

  /** Ends the set on the player's call; stopping 1-2 reps short of failure earns the RIR bonus. */
  const endSet = useCallback(
    (byChoice: boolean) => {
      if (!tuning) return
      lockUntil.current = Infinity
      const s = { ...sess.current }
      const left = repsLeft(liftState.current, tuning)
      if (byChoice && left >= 0.5 && left <= 2.5) {
        s.rir = true
        s.xp = Math.round(s.xp * RIR_XP_BONUS)
        sfx.coin()
        setCoachPose(coachPose('rirBonus'))
        say('coach', coachLine('rirBonus', { n: Math.round(left) }), 2600)
      }
      sess.current = s
      setHud(s)
      window.setTimeout(() => completeSet(s), s.rir ? 900 : 300)
    },
    [completeSet, say, setCoachPose, tuning],
  )

  const onLiftEvent = useCallback(
    (e: LiftEvent, st: LiftState) => {
      if (step !== 'lifting' || !tuning || !cur) return
      const now = performance.now()
      const target = GOALS[cur.goal].reps

      if (e.type === 'lockout') {
        repRef.current = { ...repRef.current, start: now, quality: 'good' }
        return
      }
      if (e.type === 'stall') {
        if (now - lastStallLine.current > 4000) {
          lastStallLine.current = now
          setCoachPose(coachPose('stall'))
          say('coach', coachLine('stall'), 1400)
          say('player', playerLine('stall'), 1200)
        }
        return
      }

      const quality: RepQuality = e.type === 'miss' ? 'miss' : e.quality
      const s = { ...sess.current }
      const extra = s.done >= target
      if (quality === 'miss') {
        s.misses += 1
        s.combo = 0
        sfx.miss()
      } else {
        s.done += 1
        s.combo += 1
        if (quality === 'perfect') s.perfect += 1
        s.maxCombo = Math.max(s.maxCombo, s.combo)
        s.xp += Math.round(repXp(cur.weight, tuning.difficulty, quality, s.combo) * (extra ? EXTRA_REP_XP : 1))
        if (quality === 'perfect') sfx.perfect()
        else sfx.rep()
      }
      s.last = quality
      s.hitId += 1
      sess.current = s
      setHud(s)
      music.setIntensity(0.15 + Math.min(1, s.combo / 10) * 0.85)

      if (quality === 'miss') {
        if (extra) {
          // Pushed past the target and failed: the set counts, the RIR bonus is gone.
          setCoachPose(coachPose('greedy'))
          say('coach', coachLine('greedy'), 2200)
          endSet(false)
          return
        }
        setCoachPose(coachPose('miss'))
        say('coach', coachLine('miss'), 1800)
        say('player', playerLine('miss'), 1400)
        if (s.misses >= tuning.maxMisses) {
          lockUntil.current = Infinity
          window.setTimeout(() => failSet(s), 650)
        }
        return
      }

      const left = repsLeft(st, tuning)
      if (s.done === target) {
        setCoachPose(coachPose('oneMore'))
        say('coach', coachLine('oneMore'), 2400)
      } else if (!saidLowTank.current && left < 1.6) {
        saidLowTank.current = true
        setCoachPose(coachPose('lowTank'))
        say('coach', coachLine('lowTank'), 2000)
      } else if ([3, 5, 8, 12].includes(s.combo)) {
        setCoachPose(coachPose('combo'))
        say('coach', coachLine('combo', { n: s.combo }), 1800)
      } else if (quality === 'perfect' && Math.random() < 0.4) {
        setCoachPose(coachPose('perfect'))
        say('coach', coachLine('perfect'), 1600)
      } else if (Math.random() < 0.25) {
        setCoachPose(coachPose('good'))
        say('coach', coachLine('good'), 1500)
      }
    },
    [cur, endSet, failSet, repRef, say, setCoachPose, step, tuning],
  )

  const secondChance = async () => {
    if (adBusy) return
    setAdBusy(true)
    const ok = await AdService.rewarded('second_chance')
    setAdBusy(false)
    if (!ok) {
      say('coach', t('adNotAvailable'))
      return giveUp()
    }
    secondUsed.current = true
    const s = { ...sess.current, misses: 0, last: null }
    sess.current = s
    setHud(s)
    lockUntil.current = performance.now() + 700
    setStartTank(SECOND_CHANCE_TANK)
    setPadKey((k) => k + 1)
    setPlayerPose('lift')
    setCoachPose('fist')
    setStep('lifting')
    AdService.setGameplay(true)
  }

  const giveUp = () => {
    const p = planRef.current
    if (p) addToTotals(totals.current, sess.current, p.steps[cursorRef.current.step], false)
    finish(true)
  }

  const leaveResults = async (next: 'again' | 'hub') => {
    await AdService.midgameIfReady('after_set')
    const wasRoutine = !!planRef.current?.routine
    planRef.current = null
    setPlan(null)
    if (next === 'again') {
      setPlayerPose('idle')
      setStep(wasRoutine ? 'routines' : exercise ? 'setup' : 'menu')
      say('coach', coachLine('preLift'))
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
      sfx.coin()
      say('player', t('doubled'))
    } else say('coach', t('adNotAvailable'))
  }

  const back = () => {
    sfx.click()
    if (step === 'setup') setStep('exercise')
    else if (step === 'exercise') {
      setStation(null)
      setStep('station')
    } else if (step === 'station' || step === 'routines') {
      setSelRoutine(null)
      setStep('menu')
    } else onExit()
  }

  const diffLabel = (d: number) => (d < 0.7 ? t('easy') : d < 1 ? t('medium') : d < 1.25 ? t('hard') : t('insane'))
  const goalDef = GOALS[goal]
  const BackBtn = (
    <button type="button" className="btn btn--ghost btn--sm" onClick={back}>
      {t('back')}
    </button>
  )

  return (
    <div className="dock fade-in">
      {step === 'menu' && (
        <>
          <div className="dock__row">
            <strong>{t('train')}</strong>
            {BackBtn}
          </div>
          <div className="choice-row choice-row--2">
            <button type="button" className="choice choice--push" onClick={() => setStep('station')}>
              <b>🏋️ {t('trainFree')}</b>
              <small>{t('trainFreeSub')}</small>
            </button>
            <button type="button" className="choice choice--legs" onClick={() => setStep('routines')}>
              <b>📋 {t('trainRoutines')}</b>
              <small>{dailyDone ? t('trainRoutinesSub') : `⭐ ${t('routineDaily')} · x2`}</small>
            </button>
          </div>
        </>
      )}

      {step === 'station' && (
        <>
          <div className="dock__row">
            <strong>{t('pickStation')}</strong>
            {BackBtn}
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
                  <b>{st.title}</b>
                  <small>{locked ? `🔒 ${t('unlocksAt', { lvl: st.unlockLevel })}` : st.muscles}</small>
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
              {t('pickExercise')} · <span className="accent">{STATIONS[station].title}</span>
            </strong>
            {BackBtn}
          </div>
          <div className="choice-grid">
            {exercisesFor(station).map((ex) => {
              const locked = level < ex.unlockLevel
              const pr = game.prs[ex.id]
              return (
                <button
                  key={ex.id}
                  type="button"
                  className="choice choice--sm"
                  disabled={locked}
                  onClick={() => pickExercise(ex)}
                >
                  <b>{ex.name}</b>
                  <small>
                    {locked ? `🔒 ${t('unlocksAt', { lvl: ex.unlockLevel })}` : pr ? `🏆 PR ${pr} kg` : ex.muscles.split(',')[0]}
                  </small>
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 'setup' && exercise && tuning && (
        <>
          <div className="dock__row">
            <div className="dock__title">
              <strong>{exercise.name}</strong>
              <p className="hint">{exercise.muscles}</p>
            </div>
            <div className="row-btns">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => onDemo(exercise)}>
                🎬 {t('demoWatch')}
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => onFicha(exercise)}>
                📖 {t('info')}
              </button>
              {BackBtn}
            </div>
          </div>
          <div className="tabs">
            {GOAL_ORDER.map((g) => (
              <button key={g} type="button" className={goal === g ? 'on' : ''} onClick={() => changeGoal(g)}>
                {GOALS[g].label}
                <small>
                  {GOALS[g].sets}×{GOALS[g].reps}
                </small>
              </button>
            ))}
          </div>
          <div className="weight-row">
            <button
              type="button"
              className="round-btn"
              onClick={() => setWeight((w) => clampKg(exercise, w - exercise.step))}
              aria-label={t('lessWeight')}
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
              aria-label={t('moreWeight')}
            >
              +
            </button>
          </div>
          <p className="hint center">
            {t('setsReps', { sets: goalDef.sets, reps: goalDef.reps })} · {t('restReal', { rest: goalDef.restReal })}
            {game.prs[exercise.id] ? ` · 🏆 PR ${game.prs[exercise.id]} kg` : ''}
          </p>
          <button type="button" className="btn btn--primary" onClick={startFree}>
            {t('startSet')}
          </button>
        </>
      )}

      {step === 'routines' && (
        <>
          <div className="dock__row">
            <strong>{t('routinesTitle')}</strong>
            {BackBtn}
          </div>
          {selRoutine ? (
            <div className="routine-detail">
              <div className="dock__row">
                <div className="dock__title">
                  <span className="tag">{selRoutine.kind === 'circuito' ? t('circuit') : t('routine')}</span>
                  <strong>{selRoutine.name}</strong>
                  <p className="hint">{selRoutine.blurb}</p>
                </div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelRoutine(null)}>
                  ✕
                </button>
              </div>
              <ol className="routine-steps">
                {selRoutine.steps.map((s, i) => {
                  const ex = exerciseById(s.exerciseId)
                  return (
                    <li key={i}>
                      <b>{ex?.name}</b> · {s.sets}×{GOALS[s.goal].reps} <small>({GOALS[s.goal].label})</small>
                    </li>
                  )
                })}
              </ol>
              <button type="button" className="btn btn--primary" onClick={() => startRoutine(selRoutine)}>
                {t('startRoutine')} · <i className="coin" />{' '}
                {selRoutine.id === 'daily' && !dailyDone ? selRoutine.bonus * 2 : selRoutine.bonus}
              </button>
            </div>
          ) : (
            <div className="choice-grid choice-grid--routines">
              {[daily, ...ROUTINES].map((r) => {
                const locked = r.steps.length === 0 || routineLocked(r, level)
                const isDaily = r.id === 'daily'
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`choice choice--sm ${isDaily ? 'choice--daily' : ''}`}
                    disabled={locked}
                    onClick={() => {
                      sfx.click()
                      setSelRoutine(r)
                    }}
                  >
                    <b>
                      {isDaily ? '⭐ ' : r.kind === 'circuito' ? '🔥 ' : ''}
                      {r.name}
                    </b>
                    <small>
                      {locked
                        ? `🔒 ${t('unlocksAt', { lvl: r.unlockLevel })}`
                        : isDaily && dailyDone
                          ? t('routineDailyDone')
                          : `${t('steps', { n: r.steps.length })} · ${t('routineBonus', { coins: isDaily ? r.bonus * 2 : r.bonus })}`}
                    </small>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {step === 'lifting' && cur && plan && tuning && (
        <>
          <div className="lift-head">
            <b>{cur.exercise.name}</b>
            <span>
              {cur.weight} kg · {t('set')} {cursor.set + 1}/{cur.sets}
              {plan.steps.length > 1 ? ` · ${cursor.step + 1}/${plan.steps.length}` : ''}
            </span>
          </div>
          <div className="lift-hud">
            <span>
              {t('rep')} <b>{hud.done}/{GOALS[cur.goal].reps}</b>
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
          <LiftPad
            tuning={tuning}
            resetKey={padKey}
            startTank={startTank}
            lockRef={lockUntil}
            stateRef={liftState}
            repRef={repRef}
            onEvent={onLiftEvent}
            tutorial={!seenTutorial}
            onTutorialDone={markTutorial}
          >
            {hud.last && (
              <span key={hud.hitId} className={`meter__pop pop--${hud.last}`}>
                {t(hud.last)}
                {hud.last !== 'miss' && hud.combo >= 2 ? ` x${hud.combo}` : ''}
              </span>
            )}
          </LiftPad>
          {hud.done >= GOALS[cur.goal].reps ? (
            <div className="set-choice">
              <p className="hint">💪 {t('oneMore')}</p>
              <button type="button" className="btn btn--lift" onClick={() => endSet(true)}>
                ✋ {t('endSet')}
              </button>
            </div>
          ) : (
            <p className="hint center">{t('liftHint')}</p>
          )}
        </>
      )}

      {step === 'rest' && plan && rest && (
        <>
          <div className="dock__row">
            <strong>
              😮‍💨 {t('restTitle')} <span className="accent rest-num">{restLeft}s</span>
            </strong>
            <span className="hint">
              {(() => {
                const n = nextCursor(cursor, plan)
                return n ? t('nextUp', { name: `${plan.steps[n.step].exercise.name} (${t('set')} ${n.set + 1})` }) : ''
              })()}
            </span>
          </div>
          <p className="tip-card">
            <b>{t('tipTitle')}</b> {rest.tip}
          </p>
          <button type="button" className="btn btn--primary" onClick={advance}>
            {t('restSkip')}
          </button>
        </>
      )}

      {step === 'second' && (
        <>
          <div className="dock__row">
            <strong className="warn">{t('secondChanceTitle')}</strong>
          </div>
          <button type="button" className="btn btn--ad" disabled={adBusy} onClick={secondChance}>
            ▶ {t('secondChance')} · {t('watchAd')}
          </button>
          <button type="button" className="btn btn--ghost" disabled={adBusy} onClick={giveUp}>
            {t('giveUp')}
          </button>
        </>
      )}

      {step === 'results' && results && (
        <>
          <div className="dock__row">
            <strong className={results.failed ? 'warn' : 'accent'}>
              {results.failed ? t('resultsFailed') : t('resultsTitle')}
            </strong>
            {results.boosted && <span className="boost-chip">⚡ x2 XP</span>}
          </div>
          {results.bonus > 0 && <p className="banner">🏅 {t('routineDone', { coins: results.bonus })}</p>}
          {results.rirSets > 0 && <p className="banner">🎯 {t('rirSets', { n: results.rirSets })}</p>}
          <div className="result-row">
            <div>
              <small>{t('xpGained')}</small>
              <b>+{results.xp}</b>
            </div>
            <div>
              <small>{t('coinsGained')}</small>
              <b>+{(results.doubled ? results.coins * 2 : results.coins) + results.bonus}</b>
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
            <button type="button" className="btn btn--ad" disabled={results.doubled || adBusy} onClick={doubleCoins}>
              {results.doubled ? `✓ ${t('doubled')}` : `▶ ${t('doubleCoins')} · ${t('watchAd')}`}
            </button>
          )}
          {!results.failed && results.maxCombo >= SHARE_COMBO && (
            <ShareMoment
              origin="combo"
              label={t('shareCombo', { n: results.maxCombo })}
              card={{
                kicker: t('comboCardKicker'),
                title: exerciseName(results.exerciseId),
                big: `x${results.maxCombo}`,
                unit: 'COMBO',
                detail: t('comboCardDetail', { perfect: results.perfect, kg: results.kg }),
                cta: t('cardCtaBeat'),
              }}
              text={t('comboShareText', { n: results.maxCombo, exercise: exerciseName(results.exerciseId), kg: results.kg })}
              link={() => challengeLink(results.exerciseId, results.kg, playerName())}
            />
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
