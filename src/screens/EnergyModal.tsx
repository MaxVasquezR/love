import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { ENERGY_REFILL_COST, MAX_ENERGY } from '../core/economy'
import { AdService } from '../ads/AdService'
import { useT } from '../i18n'

export function EnergyModal({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const full = game.energy >= MAX_ENERGY

  const viaAd = async () => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('energy_refill')
    setBusy(false)
    if (ok) {
      game.refillEnergy()
      onClose()
    } else setMsg(t('adNotAvailable'))
  }

  return (
    <Modal title={full ? t('energy') : t('noEnergyTitle')} onClose={onClose}>
      <p className="center big-coins">
        ⚡ {game.energy}/{MAX_ENERGY}
      </p>
      <p className="hint center">{full ? t('full') : t('noEnergyBody')}</p>
      {!full && (
        <>
          {AdService.canShowRewarded() && (
            <button type="button" className="btn btn--ad" disabled={busy} onClick={viaAd}>
              ▶ {t('refillAd')} · {t('watchAd')}
            </button>
          )}
          <button
            type="button"
            className="btn btn--gold"
            disabled={game.coins < ENERGY_REFILL_COST}
            onClick={() => game.buyRefill() && onClose()}
          >
            {t('refillCoins', { price: ENERGY_REFILL_COST })}
          </button>
          {game.coins < ENERGY_REFILL_COST && <p className="hint center">{t('notEnough')}</p>}
        </>
      )}
      {msg && <p className="hint center warn">{msg}</p>}
    </Modal>
  )
}
