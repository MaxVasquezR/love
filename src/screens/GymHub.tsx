import { useEffect } from 'react'
import { useGame } from '../core/store'
import { useTalk } from '../core/talk'
import { claimableAchievements, claimableMissions, dailyAvailable } from '../core/selectors'
import { CHARACTERS } from '../data/characters'
import { coachLine, playerLine } from '../data/coach'
import { missionText } from '../data/missions'
import type { Pose } from '../core/types'
import { useT } from '../i18n'

export type HubModal = 'shop' | 'missions' | 'daily'

type Props = {
  onTrain: () => void
  onAthletes: () => void
  onOpen: (m: HubModal) => void
  setCoachPose: (p: Pose) => void
}

export function GymHub({ onTrain, onAthletes, onOpen, setCoachPose }: Props) {
  const { t, lang } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const missionsReady = claimableMissions(game) + claimableAchievements(game)
  const daily = dailyAvailable(game)
  const name = game.selected ? CHARACTERS[game.selected].name : ''
  const nextMission = game.missions.list.find((m) => !m.claimed)

  useEffect(() => {
    setCoachPose('wave')
    say('coach', coachLine(lang, 'welcome', { name }))
    const p = window.setTimeout(() => say('player', playerLine(lang, 'welcome')), 1200)
    let i = 0
    const tick = window.setInterval(() => {
      i += 1
      const s = useGame.getState()
      if (claimableMissions(s) > 0 && i % 3 === 1) {
        setCoachPose('point')
        say('coach', coachLine(lang, 'missionReady'))
      } else {
        setCoachPose(i % 2 ? 'point' : 'idle')
        say('coach', coachLine(lang, 'tip'), 4200)
      }
    }, 7000)
    return () => {
      window.clearTimeout(p)
      window.clearInterval(tick)
    }
  }, [lang, name, say, setCoachPose])

  return (
    <div className="dock fade-in">
      {nextMission && (
        <button type="button" className="mission-strip" onClick={() => onOpen('missions')}>
          <span className="tag">{t('missionsDaily')}</span>
          <span className="mission-strip__text">{missionText(nextMission, lang)}</span>
          <span className="mission-strip__prog">
            {Math.min(nextMission.progress, nextMission.target)}/{nextMission.target}
          </span>
        </button>
      )}
      <button type="button" className="btn btn--primary btn--xl" onClick={onTrain}>
        🏋️ {t('train')}
      </button>
      <div className="hub-actions">
        <button type="button" className="hub-btn" onClick={onAthletes}>
          <span>👥</span>
          {t('athletes')}
        </button>
        <button type="button" className="hub-btn" onClick={() => onOpen('shop')}>
          <span>🛒</span>
          {t('shop')}
        </button>
        <button type="button" className="hub-btn" onClick={() => onOpen('missions')}>
          <span>🎯</span>
          {t('missions')}
          {missionsReady > 0 && <i className="badge">{missionsReady}</i>}
        </button>
        <button type="button" className="hub-btn" onClick={() => onOpen('daily')}>
          <span>🎁</span>
          {game.daily.streak > 0 ? `🔥 ${game.daily.streak}` : t('daily')}
          {daily && <i className="badge">!</i>}
        </button>
      </div>
    </div>
  )
}
