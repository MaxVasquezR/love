import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useGame, lookFor, type SessionOutcome } from './core/store'
import { useTalk } from './core/talk'
import { OFFLINE_MIN_MS, offlineCoins } from './core/economy'
import { dailyAvailable } from './core/selectors'
import type { CharacterId, Pose, StationId } from './core/types'
import { CHARACTERS } from './data/characters'
import { AdService } from './ads/AdService'
import { useT } from './i18n'
import type { RepSignal } from './game/Doll'
import type { ActorId, SceneId } from './game/GameCanvas'
import { TopBar } from './components/TopBar'
import { Bubbles } from './components/Bubbles'
import { DevAdOverlay } from './components/DevAdOverlay'
import { Title } from './screens/Title'
import { CharacterSelect } from './screens/CharacterSelect'
import { GymHub, type HubModal } from './screens/GymHub'
import { Training } from './screens/Training'
import { LevelUp } from './screens/LevelUp'
import { Shop } from './screens/Shop'
import { Missions } from './screens/Missions'
import { DailyReward } from './screens/DailyReward'
import { OfflineEarnings } from './screens/OfflineEarnings'
import { EnergyModal } from './screens/EnergyModal'
import { Settings } from './screens/Settings'

const GameCanvas = lazy(() => import('./game/GameCanvas').then((m) => ({ default: m.GameCanvas })))

type Screen = 'title' | 'select' | 'hub' | 'training'
type ModalId = HubModal | 'energy' | 'settings' | null

interface BootResult {
  offline: number
  selected: CharacterId | null
}

let bootPromise: Promise<BootResult> | null = null

function boot(): Promise<BootResult> {
  bootPromise ??= (async () => {
    AdService.loadingStart()
    await AdService.init()
    await useGame.persist.rehydrate()
    const s = useGame.getState()
    s.ensureMissions()
    s.syncEnergy()
    let offline = 0
    const away = Date.now() - s.lastSeen
    if (s.selected && away >= OFFLINE_MIN_MS) {
      offline = offlineCoins(s.progress[s.selected].level, away)
    }
    s.touch()
    AdService.loadingStop()
    return { offline, selected: s.selected }
  })()
  return bootPromise
}

export default function App() {
  const { t, lang } = useT()
  const game = useGame()
  const [booted, setBooted] = useState(false)
  const [screen, setScreen] = useState<Screen>('title')
  const [preview, setPreview] = useState<CharacterId>('max')
  const [station, setStation] = useState<StationId | null>(null)
  const [playerPose, setPlayerPose] = useState<Pose>('idle')
  const [coachPose, setCoachPose] = useState<Pose>('idle')
  const [modal, setModal] = useState<ModalId>(null)
  const [levelUp, setLevelUp] = useState<SessionOutcome | null>(null)
  const [offline, setOffline] = useState(0)
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
      setBooted(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

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
    }
  }, [screen])

  // Auto-open the daily reward once per session, after any offline popup.
  useEffect(() => {
    if (!booted || screen !== 'hub' || offline > 0 || modal || levelUp || dailyShown.current) return
    if (dailyAvailable(useGame.getState())) {
      dailyShown.current = true
      setModal('daily')
    }
  }, [booted, screen, offline, modal, levelUp])

  const shownId: CharacterId =
    screen === 'select' || screen === 'title' ? preview : (game.selected ?? preview)

  const { progress, equipment, skinTrial } = game
  const playerLook = useMemo(
    () => lookFor({ ...useGame.getState(), progress, equipment, skinTrial }, shownId),
    [progress, equipment, skinTrial, shownId],
  )

  const scene: SceneId =
    screen === 'hub' ? 'hub' : screen === 'training' ? (station ? 'training' : 'hub') : 'select'

  const resetGame = () => {
    setModal(null)
    setLevelUp(null)
    setOffline(0)
    setPreview('max')
    setScreen('title')
  }

  return (
    <div className="game">
      <Suspense fallback={<div className="boot">{t('loading')}</div>}>
        <GameCanvas
          scene={scene}
          playerLook={playerLook}
          playerPose={playerPose}
          coachPose={coachPose}
          station={scene === 'training' ? station : null}
          repRef={repRef}
          anchors={anchors}
        />
      </Suspense>

      <Bubbles anchors={anchors} playerName={CHARACTERS[shownId].name} />

      {!booted ? (
        <div className="boot">{t('loading')}</div>
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
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setModal('settings')}
                  aria-label={t('settings')}
                >
                  ⚙
                </button>
              </div>
            )}
          </div>

          <div className="hud__bottom">
            {screen === 'title' && (
              <Title onPlay={() => setScreen(game.selected ? 'hub' : 'select')} />
            )}
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
                repRef={repRef}
                setPlayerPose={setPlayerPose}
                setCoachPose={setCoachPose}
                onExit={() => setScreen('hub')}
                onLevelUp={setLevelUp}
                onNoEnergy={() => setModal('energy')}
              />
            )}
          </div>
        </div>
      )}

      {offline > 0 && <OfflineEarnings coins={offline} onClose={() => setOffline(0)} />}
      {levelUp && <LevelUp outcome={levelUp} onClose={() => setLevelUp(null)} />}
      {modal === 'shop' && <Shop onClose={() => setModal(null)} />}
      {modal === 'missions' && <Missions onClose={() => setModal(null)} />}
      {modal === 'daily' && <DailyReward onClose={() => setModal(null)} />}
      {modal === 'energy' && <EnergyModal onClose={() => setModal(null)} />}
      {modal === 'settings' && <Settings onClose={() => setModal(null)} onReset={resetGame} />}

      <DevAdOverlay />
    </div>
  )
}
