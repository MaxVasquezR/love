import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useGame, lookFor, type SessionOutcome } from './core/store'
import { useTalk } from './core/talk'
import { OFFLINE_MIN_MS, isSunday, offlineCoins } from './core/economy'
import { dailyAvailable } from './core/selectors'
import { invitedBy, readChallenge } from './core/share'
import { isFirstOpen, track } from './core/analytics'
import type { Challenge, CharacterId, Exercise, MuscleGroup, Pose, StationId } from './core/types'
import { CHARACTERS } from './data/characters'
import { coachLine, coachPose } from './data/coach'
import { randomTip } from './data/tips'
import { AdService } from './ads/AdService'
import { setLang, urlLang, useT } from './i18n'
import './i18n/content'
import type { RepSignal } from './game/Doll'
import type { ActorId, SceneId } from './game/GameCanvas'
import type { RigFocus } from './game/equipment/RigSet'
import { music } from './core/music'
import { stopVoice } from './core/audio'
import { ambience } from './core/gymAudio'
import { BossScreen } from './components/BossScreen'
import { CoachDemo } from './screens/CoachDemo'
import { STATION_RIG } from './data/exercises'
import { TopBar } from './components/TopBar'
import { Bubbles } from './components/Bubbles'
import { DevAdOverlay } from './components/DevAdOverlay'
import { Title } from './screens/Title'
import { CharacterSelect } from './screens/CharacterSelect'
import { GymHub, type HubModal } from './screens/GymHub'
import { Training, type PrInfo } from './screens/Training'
import { LevelUp } from './screens/LevelUp'
import { Shop } from './screens/Shop'
import { Missions } from './screens/Missions'
import { DailyReward } from './screens/DailyReward'
import { OfflineEarnings } from './screens/OfflineEarnings'
import { EnergyModal } from './screens/EnergyModal'
import { Settings } from './screens/Settings'
import { ExerciseInfo } from './screens/ExerciseInfo'
import { Quiz } from './screens/Quiz'
import { SupplementBox } from './screens/SupplementBox'
import { School } from './screens/School'
import { PrModal } from './screens/PrModal'
import { ChallengeModal } from './screens/ChallengeModal'
import { RematchModal, type RematchInfo } from './screens/RematchModal'

const GameCanvas = lazy(() => import('./game/GameCanvas').then((m) => ({ default: m.GameCanvas })))

type Screen = 'title' | 'select' | 'hub' | 'training'
type ModalId = HubModal | 'energy' | 'settings' | null

interface BootResult {
  offline: number
  selected: CharacterId | null
  challenge: Challenge | null
  /** Lucas paid because a friend beat your challenge and sent it back. */
  recruit: number
}

let bootPromise: Promise<BootResult> | null = null

function boot(): Promise<BootResult> {
  bootPromise ??= (async () => {
    const challenge = readChallenge()
    AdService.loadingStart()
    await AdService.init()
    await useGame.persist.rehydrate()
    const s = useGame.getState()
    setLang(urlLang() ?? s.lang)
    s.ensureMissions()
    s.syncEnergy()
    let offline = 0
    const away = Date.now() - s.lastSeen
    if (s.selected && away >= OFFLINE_MIN_MS) {
      offline = offlineCoins(s.progress[s.selected].level, away) * (isSunday() ? 2 : 1)
    }
    s.touch()
    const recruit = challenge?.rev ? s.noteRecruit(challenge.from) : 0
    AdService.loadingStop()
    if (isFirstOpen) track('first_open', { challenge: !!challenge, ref: invitedBy })
    track('session_start', {
      returning: !!s.selected,
      level: s.selected ? s.progress[s.selected].level : 0,
      streak: s.daily.streak,
      awayHours: Math.round(away / 3_600_000),
    })
    if (challenge) track('challenge_open', { exercise: challenge.exerciseId, kg: challenge.kg, rev: !!challenge.rev, recruit })
    return { offline, selected: s.selected, challenge, recruit }
  })()
  return bootPromise
}

function BootScreen() {
  const { t } = useT()
  const [tip] = useState(randomTip)
  return (
    <div className="boot">
      <div className="boot__inner">
        <p className="boot__brand">
          BONNETTY <span>FITNESS</span>
        </p>
        <p>{t('loading')}</p>
        <p className="tip-card">
          <b>{t('tipTitle')}</b> {tip}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { t } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const [booted, setBooted] = useState(false)
  const [screen, setScreen] = useState<Screen>('title')
  const [preview, setPreview] = useState<CharacterId>('max')
  const [station, setStation] = useState<StationId | null>(null)
  const [focus, setFocus] = useState<RigFocus | null>(null)
  const [playerPose, setPlayerPose] = useState<Pose>('idle')
  const [coachPoseState, setCoachPose] = useState<Pose>('idle')
  const [modal, setModal] = useState<ModalId>(null)
  const [levelUp, setLevelUp] = useState<SessionOutcome | null>(null)
  const [offline, setOffline] = useState(0)
  const [ficha, setFicha] = useState<Exercise | null>(null)
  const [pr, setPr] = useState<PrInfo | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [recruit, setRecruit] = useState(0)
  const [rematch, setRematch] = useState<RematchInfo | null>(null)
  const [demoEx, setDemoEx] = useState<Exercise | null>(null)
  /** Lesson to return to after a technique demo opened from the School. */
  const [schoolLesson, setSchoolLesson] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<readonly MuscleGroup[] | null>(null)
  const demoRep = useRef<RepSignal>({ start: -1e9, quality: 'good' })
  const dailyShown = useRef(false)

  const repRef = useRef<RepSignal>({ start: -1e9, quality: 'good' })
  const anchors = useRef<Record<ActorId, HTMLDivElement | null>>({ player: null, coach: null })

  useEffect(() => {
    let alive = true
    boot().then((r) => {
      if (!alive) return
      setOffline(r.offline)
      setPreview(r.selected ?? 'max')
      setScreen(r.selected ? 'hub' : 'title')
      setChallenge(r.challenge)
      setRecruit(r.recruit)
      setBooted(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!booted) return
    const save = () => useGame.getState().touch()
    const id = window.setInterval(save, 30_000)
    const onVis = () => {
      if (document.visibilityState === 'hidden') save()
      else {
        useGame.getState().syncEnergy()
        useGame.getState().ensureMissions()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', save)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', save)
    }
  }, [booted])

  useEffect(() => {
    useTalk.getState().clear()
    if (screen === 'select' || screen === 'title') {
      setPlayerPose('wave')
      setCoachPose('idle')
    } else if (screen === 'hub') {
      setPlayerPose('idle')
      setStation(null)
      setFocus(null)
    }
  }, [screen])

  const rigFocus: RigFocus | null = demoEx
    ? { rig: demoEx.rig, kg: demoEx.baseKg }
    : station
      ? (focus ?? { rig: STATION_RIG[station], kg: 60 })
      : null
  const demo = useMemo(
    () => (demoEx ? { rep: demoRep, station: demoEx.station, highlight } : null),
    [demoEx, highlight],
  )

  useEffect(() => {
    music.setMood(screen === 'hub' ? 'hub' : screen === 'training' ? 'training' : 'menu')
  }, [screen])

  // Modo jefe: in office mode Esc or a two-finger tap hides the game behind a spreadsheet.
  const [boss, setBoss] = useState(false)
  const office = game.office
  useEffect(() => {
    if (!office) return
    const toggle = () =>
      setBoss((b) => {
        music.setBoss(!b)
        if (!b) stopVoice()
        return !b
      })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        toggle()
      }
    }
    const onTouch = (e: TouchEvent) => {
      // Two thumbs on the lift pad are a grip, not the boss key.
      if (e.target instanceof Element && e.target.closest('.liftpad')) return
      if (e.touches.length === 2) toggle()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouch, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouch)
    }
  }, [office])
  const closeBoss = () => {
    setBoss(false)
    music.setBoss(false)
  }

  useEffect(() => {
    ambience((screen === 'hub' || screen === 'training') && !boss)
  }, [screen, boss])

  const busy = !!(modal || levelUp || pr || rematch || ficha || demoEx || challenge || offline > 0)

  // Auto-open the daily reward once per session, after any other popup.
  useEffect(() => {
    if (!booted || screen !== 'hub' || busy || dailyShown.current) return
    if (dailyAvailable(useGame.getState())) {
      dailyShown.current = true
      setModal('daily')
    }
  }, [booted, screen, busy])

  // Profe quiz after every 3 sessions, back in the gym.
  useEffect(() => {
    if (!booted || screen !== 'hub' || busy) return
    if (useGame.getState().quiz.sessionsSince >= 3) {
      const id = window.setTimeout(() => setModal('quiz'), 900)
      return () => window.clearTimeout(id)
    }
  }, [booted, screen, busy])

  useEffect(() => {
    if (!challenge || screen === 'title') return
    setCoachPose(coachPose('challenge'))
    say('coach', coachLine('challenge'), 3600)
  }, [challenge, screen, say])

  const shownId: CharacterId =
    screen === 'select' || screen === 'title' ? preview : (game.selected ?? preview)

  const { progress, equipment, outfitTrial } = game
  const playerLook = useMemo(
    () => lookFor({ ...useGame.getState(), progress, equipment, outfitTrial }, shownId),
    [progress, equipment, outfitTrial, shownId],
  )

  const scene: SceneId =
    screen === 'hub' ? 'hub' : screen === 'training' ? (station ? 'training' : 'hub') : 'select'

  const resetGame = () => {
    setModal(null)
    setLevelUp(null)
    setOffline(0)
    setPr(null)
    setRematch(null)
    setPreview('max')
    setScreen('title')
  }

  return (
    <div className={demoEx ? 'game game--demo' : 'game'}>
      <Suspense fallback={<BootScreen />}>
        <GameCanvas
          scene={scene}
          playerLook={playerLook}
          playerPose={playerPose}
          coachPose={coachPoseState}
          station={scene === 'training' ? station : null}
          focus={rigFocus}
          demo={demo}
          repRef={repRef}
          anchors={anchors}
        />
      </Suspense>

      <Bubbles anchors={anchors} playerName={CHARACTERS[shownId].name} />

      {!booted ? (
        <BootScreen />
      ) : (
        <div className="hud">
          <div className="hud__top">
            {screen === 'hub' || screen === 'training' ? (
              <TopBar onEnergy={() => setModal('energy')} onSettings={() => setModal('settings')} />
            ) : (
              <div className="topbar topbar--slim">
                <span className="logo">
                  GYM <b>LEGENDS</b>
                </span>
                <button type="button" className="icon-btn" onClick={() => setModal('settings')} aria-label={t('settings')}>
                  ⚙
                </button>
              </div>
            )}
          </div>

          <div className="hud__bottom">
            {screen === 'title' && <Title onPlay={() => setScreen(game.selected ? 'hub' : 'select')} />}
            {screen === 'select' && (
              <CharacterSelect
                preview={preview}
                onPreview={setPreview}
                onConfirm={() => setScreen('hub')}
                onBack={game.selected ? () => setScreen('hub') : () => setScreen('title')}
              />
            )}
            {screen === 'hub' && (
              <GymHub
                onTrain={() => setScreen('training')}
                onAthletes={() => {
                  setPreview(game.selected ?? 'max')
                  setScreen('select')
                }}
                onOpen={setModal}
                setCoachPose={setCoachPose}
              />
            )}
            {screen === 'training' && (
              <Training
                station={station}
                setStation={setStation}
                setFocus={setFocus}
                repRef={repRef}
                setPlayerPose={setPlayerPose}
                setCoachPose={setCoachPose}
                onExit={() => setScreen('hub')}
                onLevelUp={setLevelUp}
                onNoEnergy={() => setModal('energy')}
                onFicha={setFicha}
                onDemo={setDemoEx}
                onPr={setPr}
                onChallengeWon={setRematch}
              />
            )}
          </div>
        </div>
      )}

      {offline > 0 && <OfflineEarnings coins={offline} onClose={() => setOffline(0)} />}
      {levelUp && <LevelUp outcome={levelUp} onClose={() => setLevelUp(null)} />}
      {pr && !levelUp && <PrModal pr={pr} onClose={() => setPr(null)} />}
      {rematch && !levelUp && !pr && <RematchModal info={rematch} onClose={() => setRematch(null)} />}
      {ficha && <ExerciseInfo exercise={ficha} onClose={() => setFicha(null)} />}
      {challenge && booted && offline === 0 && (
        <ChallengeModal challenge={challenge} recruit={recruit} onClose={() => setChallenge(null)} />
      )}
      {modal === 'shop' && <Shop onClose={() => setModal(null)} />}
      {modal === 'missions' && <Missions onClose={() => setModal(null)} onQuiz={() => setModal('quiz')} />}
      {modal === 'daily' && <DailyReward onClose={() => setModal(null)} />}
      {modal === 'box' && <SupplementBox onClose={() => setModal(null)} />}
      {modal === 'quiz' && <Quiz onClose={() => setModal(null)} setCoachPose={setCoachPose} />}
      {modal === 'energy' && <EnergyModal onClose={() => setModal(null)} />}
      {modal === 'settings' && <Settings onClose={() => setModal(null)} onReset={resetGame} />}
      {modal === 'school' && (
        <School
          initialLesson={schoolLesson}
          setCoachPose={setCoachPose}
          onDemo={(ex, lessonId) => {
            setSchoolLesson(lessonId)
            setModal(null)
            setDemoEx(ex)
          }}
          onClose={() => {
            setSchoolLesson(null)
            setModal(null)
          }}
        />
      )}

      {demoEx && (
        <CoachDemo
          exercise={demoEx}
          rep={demoRep}
          setHighlight={setHighlight}
          setCoachPose={setCoachPose}
          setPlayerPose={setPlayerPose}
          onFicha={() => setFicha(demoEx)}
          onClose={() => {
            setDemoEx(null)
            if (schoolLesson) setModal('school')
          }}
        />
      )}
      <DevAdOverlay />
      {boss && <BossScreen onClose={closeBoss} />}
    </div>
  )
}
