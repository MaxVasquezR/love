import { useEffect, useState } from 'react'
import { useGame, boostActive } from '../core/store'
import { useTalk } from '../core/talk'
import { claimableAchievements, claimableMissions, dailyAvailable } from '../core/selectors'
import { CHALLENGE_REWARD, REMATCH_BONUS, isSunday, todayKey, yesterdayKey } from '../core/economy'
import { exerciseById } from '../data/exercises'
import { CHARACTERS } from '../data/characters'
import { coachLine, coachPose, playerLine, type CoachMoment } from '../data/coach'
import { missionText } from '../data/missions'
import type { Pose } from '../core/types'
import { AdService } from '../ads/AdService'
import { sfx } from '../core/audio'
import { useT } from '../i18n'
import { track } from '../core/analytics'
import { promptInstall, useCanInstall } from '../core/pwa'

export type HubModal = 'shop' | 'missions' | 'daily' | 'box' | 'quiz' | 'school'

type Props = {
  onTrain: () => void
  onAthletes: () => void
  onOpen: (m: HubModal) => void
  setCoachPose: (p: Pose) => void
}

export function GymHub({ onTrain, onAthletes, onOpen, setCoachPose }: Props) {
  const { t } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const missionsReady = claimableMissions(game) + claimableAchievements(game)
  const daily = dailyAvailable(game)
  const name = game.selected ? CHARACTERS[game.selected].name : ''
  const nextMission = game.missions.list.find((m) => !m.claimed)
  const boxReady = game.boxAt <= now
  const sunday = isSunday(now)
  const preOn = boostActive(game.boosts.xp2Until, now)
  const canInstall = useCanInstall()
  const gymCheckIn = game.realStreak.streak > 0 && game.realStreak.last !== todayKey(now)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const s = useGame.getState()
    const lapsed = s.daily.streak > 1 && s.daily.last !== todayKey() && s.daily.last !== yesterdayKey()
    const first: CoachMoment = isSunday() ? 'sunday' : lapsed ? 'welcomeBack' : 'welcome'
    setCoachPose(first === 'welcome' ? 'wave' : coachPose(first))
    say('coach', coachLine(first, { name }), 3600)
    const p = window.setTimeout(() => say('player', playerLine('welcome')), 1400)
    let i = 0
    const tick = window.setInterval(() => {
      i += 1
      const st = useGame.getState()
      if (claimableMissions(st) > 0 && i % 3 === 1) {
        setCoachPose(coachPose('missionReady'))
        say('coach', coachLine('missionReady'))
      } else {
        setCoachPose(i % 2 ? 'point' : 'idle')
        say('coach', coachLine('tip'), 4200)
      }
    }, 8000)
    return () => {
      window.clearTimeout(p)
      window.clearInterval(tick)
    }
  }, [name, say, setCoachPose])

  const preWorkout = async () => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('pre_workout')
    setBusy(false)
    if (ok) {
      game.activatePreWorkout()
      sfx.levelUp()
      setCoachPose('fist')
      say('coach', t('preWorkoutOn'))
    } else say('coach', t('adNotAvailable'))
  }

  const open = (m: HubModal) => {
    sfx.click()
    if (m === 'school') track('school_open')
    onOpen(m)
  }

  return (
    <div className="dock fade-in">
      {sunday && <p className="banner">😴 {t('sundayBanner')}</p>}
      {nextMission && (
        <button type="button" className="mission-strip" onClick={() => open('missions')}>
          <span className="tag">{t('missionsDaily')}</span>
          <span className="mission-strip__text">{missionText(nextMission)}</span>
          <span className="mission-strip__prog">
            {Math.min(nextMission.progress, nextMission.target)}/{nextMission.target}
          </span>
        </button>
      )}
      {game.challenge && (
        <button type="button" className="mission-strip mission-strip--reto" onClick={onTrain}>
          <span className="tag">⚔️ {t('challengeTitle')}</span>
          <span className="mission-strip__text">
            {exerciseById(game.challenge.exerciseId)?.name} · {game.challenge.kg} kg ({game.challenge.from})
          </span>
          <span className="mission-strip__prog">+{CHALLENGE_REWARD + (game.challenge.rev ? REMATCH_BONUS : 0)}</span>
        </button>
      )}
      <div className="hub-main">
        <button
          type="button"
          className="btn btn--primary btn--xl"
          onClick={() => {
            sfx.whistle()
            onTrain()
          }}
        >
          🏋️ {t('train')}
        </button>
        {AdService.canShowRewarded() && !preOn && (
          <button type="button" className="btn btn--ad btn--pre" disabled={busy} onClick={preWorkout}>
            ▶ {t('preWorkout')}
          </button>
        )}
      </div>
      {canInstall && (
        <button
          type="button"
          className="btn btn--ghost btn--sm install-btn"
          onClick={() => {
            sfx.click()
            void promptInstall()
          }}
        >
          📲 {t('installApp')}
        </button>
      )}
      <div className="hub-actions hub-actions--6">
        <button type="button" className="hub-btn" onClick={onAthletes}>
          <span>👥</span>
          {t('athletes')}
        </button>
        <button type="button" className="hub-btn" onClick={() => open('school')}>
          <span>🎓</span>
          {t('school')}
          {gymCheckIn && <i className="badge">!</i>}
        </button>
        <button type="button" className="hub-btn" onClick={() => open('shop')}>
          <span>🛒</span>
          {t('shop')}
        </button>
        <button type="button" className="hub-btn" onClick={() => open('missions')}>
          <span>🎯</span>
          {t('missions')}
          {missionsReady > 0 && <i className="badge">{missionsReady}</i>}
        </button>
        <button type="button" className="hub-btn" onClick={() => open('box')}>
          <span>🧃</span>
          {t('box')}
          {boxReady && <i className="badge">!</i>}
        </button>
        <button type="button" className="hub-btn" onClick={() => open('daily')}>
          <span>🎁</span>
          {game.daily.streak > 0 ? `🔥 ${game.daily.streak}` : t('daily')}
          {daily && <i className="badge">!</i>}
        </button>
      </div>
    </div>
  )
}
