import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { CHARACTERS } from '../data/characters'
import { AdService } from '../ads/AdService'
import { useT } from '../i18n'

export function OfflineEarnings({ coins, onClose }: { coins: number; onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [busy, setBusy] = useState(false)
  const name = game.selected ? CHARACTERS[game.selected].name : ''

  const take = (amount: number) => {
    game.addCoins(amount)
    onClose()
  }

  const double = async () => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('offline_double')
    setBusy(false)
    take(ok ? coins * 2 : coins)
  }

  return (
    <Modal title={t('offlineTitle')}>
      <div className="center">
        <p>{t('offlineBody', { name, coins })}</p>
        <p className="big-coins">
          <i className="coin" /> {coins}
        </p>
      </div>
      {AdService.canShowRewarded() && (
        <button type="button" className="btn btn--ad" disabled={busy} onClick={double}>
          ▶ {t('offlineDouble')} ({coins * 2}) · {t('watchAd')}
        </button>
      )}
      <button type="button" className="btn btn--primary" disabled={busy} onClick={() => take(coins)}>
        {t('offlineClaim', { coins })}
      </button>
    </Modal>
  )
}
