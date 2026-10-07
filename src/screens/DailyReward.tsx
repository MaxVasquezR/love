import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { DAILY_REWARDS, streakSavable, todayKey, yesterdayKey } from '../core/economy'
import { AdService } from '../ads/AdService'
import { track } from '../core/analytics'
import { sfx } from '../core/audio'
import { useT } from '../i18n'

export function DailyReward({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [claimed, setClaimed] = useState<number | null>(null)
  const [doubled, setDoubled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const already = game.daily.last === todayKey()
  const savable = !already && claimed === null && streakSavable(game.daily) && AdService.canShowRewarded()
  const lost = savable && !saved ? game.daily.streak : 0
  const nextStreak = already
    ? game.daily.streak
    : game.daily.last === yesterdayKey() || saved
      ? game.daily.streak + 1
      : 1
  const dayIndex = (nextStreak - 1) % DAILY_REWARDS.length

  const claim = (save = false) => {
    const r = game.claimDaily(save)
    if (r === null) return
    setClaimed(r)
    track('daily_claim', { streak: useGame.getState().daily.streak, coins: r, saved: save })
  }

  const saveStreak = async () => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('streak_save')
    setBusy(false)
    if (!ok) return
    setSaved(true)
    sfx.levelUp()
    track('streak_saved', { streak: game.daily.streak })
    claim(true)
  }

  const double = async () => {
    if (claimed === null || doubled || busy) return
    setBusy(true)
    const ok = await AdService.rewarded('daily_double')
    setBusy(false)
    if (ok) {
      game.addCoins(claimed)
      setDoubled(true)
    }
  }

  return (
    <Modal title={t('dailyTitle')} onClose={onClose}>
      {lost > 0 ? (
        <p className="banner">💔 {t('streakLost', { n: lost })}</p>
      ) : (
        <p className="center accent">🔥 {t('dailyStreak', { n: nextStreak })}</p>
      )}
      {saved && <p className="center accent">🛡️ {t('streakSaved', { n: game.daily.streak })}</p>}
      <div className="daily-grid">
        {DAILY_REWARDS.map((coins, i) => {
          const state = i < dayIndex || (i === dayIndex && (already || claimed !== null)) ? 'done' : i === dayIndex ? 'today' : ''
          return (
            <div key={i} className={`daily-day ${state} ${i === DAILY_REWARDS.length - 1 ? 'big' : ''}`}>
              <small>{t('dailyDay', { n: i + 1 })}</small>
              <b>
                <i className="coin" /> {coins}
              </b>
              {i === DAILY_REWARDS.length - 1 && <small>{t('dailyBonus')}</small>}
            </div>
          )
        })}
      </div>
      {lost > 0 && (
        <button type="button" className="btn btn--ad" disabled={busy} onClick={saveStreak}>
          ▶ {t('streakSave', { n: lost })} · {t('watchAd')}
        </button>
      )}
      {claimed === null && !already && (
        <button type="button" className={lost > 0 ? 'btn btn--ghost' : 'btn btn--primary'} disabled={busy} onClick={() => claim()}>
          {lost > 0 ? t('streakRestart', { coins: DAILY_REWARDS[0] }) : t('dailyClaim', { coins: DAILY_REWARDS[dayIndex] })}
        </button>
      )}
      {claimed !== null && AdService.canShowRewarded() && (
        <button type="button" className="btn btn--ad" disabled={doubled || busy} onClick={double}>
          {doubled ? `✓ ${t('doubled')}` : `▶ ${t('doubleCoins')} · ${t('watchAd')}`}
        </button>
      )}
      {(claimed !== null || already) && (
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t('continue')}
        </button>
      )}
    </Modal>
  )
}
