import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { achievementValue } from '../core/selectors'
import { ACHIEVEMENTS } from '../data/achievements'
import { missionText } from '../data/missions'
import { useT } from '../i18n'

export function Missions({ onClose }: { onClose: () => void }) {
  const { t, L, lang } = useT()
  const game = useGame()
  const [tab, setTab] = useState<'daily' | 'ach'>('daily')

  return (
    <Modal title={t('missions')} onClose={onClose} wide>
      <div className="tabs">
        <button type="button" className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>
          {t('missionsDaily')}
        </button>
        <button type="button" className={tab === 'ach' ? 'on' : ''} onClick={() => setTab('ach')}>
          {t('achievements')} ({game.achievements.length}/{ACHIEVEMENTS.length})
        </button>
      </div>

      {tab === 'daily' && (
        <div className="shop-list">
          {game.missions.list.map((m) => {
            const ready = !m.claimed && m.progress >= m.target
            return (
              <div key={m.id} className={`shop-item ${m.claimed ? 'own' : ''}`}>
                <div className="grow">
                  <b>{missionText(m, lang)}</b>
                  <Progress value={m.progress} target={m.target} />
                </div>
                {m.claimed ? (
                  <span className="tag">{t('claimed')}</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn--gold btn--sm"
                    disabled={!ready}
                    onClick={() => game.claimMission(m.id)}
                  >
                    {t('claim')} <i className="coin" /> {m.reward}
                  </button>
                )}
              </div>
            )
          })}
          <p className="hint center">{t('resetIn')}</p>
        </div>
      )}

      {tab === 'ach' && (
        <div className="shop-list">
          {ACHIEVEMENTS.map((a) => {
            const done = game.achievements.includes(a.id)
            const value = achievementValue(game, a.id)
            return (
              <div key={a.id} className={`shop-item ${done ? 'own' : ''}`}>
                <div className="grow">
                  <b>🏆 {L(a.name)}</b>
                  <Progress value={value} target={a.target} />
                </div>
                {done ? (
                  <span className="tag">{t('claimed')}</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn--gold btn--sm"
                    disabled={value < a.target}
                    onClick={() => game.claimAchievement(a.id)}
                  >
                    <i className="coin" /> {a.reward}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

function Progress({ value, target }: { value: number; target: number }) {
  const v = Math.min(value, target)
  return (
    <div className="progress">
      <div className="progress__bar">
        <div style={{ width: `${(v / target) * 100}%` }} />
      </div>
      <small>
        {Math.floor(v).toLocaleString()}/{target.toLocaleString()}
      </small>
    </div>
  )
}
