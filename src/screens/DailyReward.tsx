import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { DAILY_REWARDS, todayKey, yesterdayKey } from '../core/economy'
import { AdService } from '../ads/AdService'
import { useT } from '../i18n'

export function DailyReward({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [claimed, setClaimed] = useState<number | null>(null)
  const [doubled, setDoubled] = useState(false)
  const [busy, setBusy] = useState(false)

  const already = game.daily.last === todayKey()
  const nextStreak = already
    ? game.daily.streak
    : game.daily.last === yesterdayKey()
      ? game.daily.streak + 1
      : 1
  const dayIndex = (nextStreak - 1) % DAILY_REWARDS.length

  const claim = () => {
    const r = game.claimDaily()
    if (r !== null) setClaimed(r)
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
      <p className="center accent">🔥 {t('dailyStreak', { n: nextStreak })}</p>
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
      {claimed === null && !already && (
        <button type="button" className="btn btn--primary" onClick={claim}>
          {t('dailyClaim', { coins: DAILY_REWARDS[dayIndex] })}
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
