import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { achievementValue } from '../core/selectors'
import { sfx } from '../core/audio'
import { ACHIEVEMENTS, type AchievementDef } from '../data/achievements'
import { missionText } from '../data/missions'
import { AdService } from '../ads/AdService'
import { ShareMoment } from '../components/ShareMoment'
import { inviteLink, playerName } from '../core/share'
import { fmtNum, useT } from '../i18n'

/** Achievements worth this many lucas or more offer a share card when claimed. */
const SHARE_ACHIEVEMENT_REWARD = 300

export function Missions({ onClose, onQuiz }: { onClose: () => void; onQuiz: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [tab, setTab] = useState<'daily' | 'ach'>('daily')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [justAch, setJustAch] = useState<AchievementDef | null>(null)

  const claim = (run: () => void) => {
    run()
    sfx.coin()
  }

  const reroll = async (id: string) => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('mission_reroll')
    setBusy(false)
    if (ok) game.rerollMission(id)
    else setMsg(t('adNotAvailable'))
  }

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
                  <b>{missionText(m)}</b>
                  <Progress value={m.progress} target={m.target} />
                </div>
                <div className="shop-item__actions">
                  {m.claimed ? (
                    <span className="tag">{t('claimed')}</span>
                  ) : (
                    <>
                      {!ready && AdService.canShowRewarded() && (
                        <button type="button" className="btn btn--ad btn--sm" disabled={busy} onClick={() => reroll(m.id)}>
                          ▶ {t('reroll')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--gold btn--sm"
                        disabled={!ready}
                        onClick={() => claim(() => game.claimMission(m.id))}
                      >
                        {t('claim')} <i className="coin" /> {m.reward}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          <button type="button" className="btn btn--ghost" onClick={onQuiz}>
            🧠 {t('quizDaily')}
          </button>
          {msg && <p className="hint center warn">{msg}</p>}
          <p className="hint center">{t('resetIn')}</p>
        </div>
      )}

      {tab === 'ach' && (
        <div className="shop-list">
          {justAch && (
            <div className="shop-item own">
              <div className="grow">
                <b>{t('achievementJust', { name: justAch.name, coins: justAch.reward })}</b>
              </div>
              <div className="shop-item__actions">
                <ShareMoment
                  origin="achievement"
                  className="btn btn--wsp btn--sm"
                  label={t('shareAchievement')}
                  card={{
                    kicker: t('achievementCardKicker'),
                    title: justAch.name,
                    big: '🏆',
                    unit: t('achievementCardUnit'),
                    cta: t('cardCtaPlay'),
                  }}
                  text={t('achievementShareText', { name: justAch.name })}
                  link={() => inviteLink(playerName())}
                />
              </div>
            </div>
          )}
          {ACHIEVEMENTS.map((a) => {
            const done = game.achievements.includes(a.id)
            const value = achievementValue(game, a.id)
            return (
              <div key={a.id} className={`shop-item ${done ? 'own' : ''}`}>
                <div className="grow">
                  <b>🏆 {a.name}</b>
                  <Progress value={value} target={a.target} />
                </div>
                {done ? (
                  <span className="tag">{t('claimed')}</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn--gold btn--sm"
                    disabled={value < a.target}
                    onClick={() =>
                      claim(() => {
                        game.claimAchievement(a.id)
                        if (a.reward >= SHARE_ACHIEVEMENT_REWARD) setJustAch(a)
                      })
                    }
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
        {fmtNum(Math.floor(v))}/{fmtNum(target)}
      </small>
    </div>
  )
}
