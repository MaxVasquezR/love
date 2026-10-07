import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { formatMs, type BoxReward } from '../core/economy'
import { AdService } from '../ads/AdService'
import { sfx } from '../core/audio'
import { useT } from '../i18n'

export function SupplementBox({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const boxAt = useGame((s) => s.boxAt)
  const [now, setNow] = useState(() => Date.now())
  const [got, setGot] = useState<BoxReward | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const ready = boxAt <= now

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const open = (free: boolean) => {
    const r = useGame.getState().openBox(free)
    if (!r) return
    setGot(r)
    sfx.coin()
  }

  const viaAd = async () => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('supplement_box')
    setBusy(false)
    if (ok) open(false)
    else setMsg(t('adNotAvailable'))
  }

  const label = (r: BoxReward) =>
    r.kind === 'coins'
      ? t('boxGotCoins', { n: r.n })
      : r.kind === 'energy'
        ? t('boxGotEnergy', { n: r.n })
        : r.kind === 'pre'
          ? t('boxGotPre')
          : t('boxGotCrea')

  const icon = (r: BoxReward) => (r.kind === 'coins' ? '🪙' : r.kind === 'energy' ? '⚡' : r.kind === 'pre' ? '🔥' : '💪')

  return (
    <Modal title={`🧃 ${t('boxTitle')}`} onClose={onClose}>
      <div className={`box-art ${got ? 'open' : ready ? 'ready' : ''}`}>{got ? icon(got) : '📦'}</div>
      {got ? <p className="center big-text accent">{label(got)}</p> : <p className="hint center">{t('boxBody')}</p>}
      {ready ? (
        <button type="button" className="btn btn--primary" onClick={() => open(true)}>
          {t('boxOpen')}
        </button>
      ) : (
        <p className="center hint">{t('boxNext', { t: formatMs(boxAt - now) })}</p>
      )}
      {!ready && AdService.canShowRewarded() && (
        <button type="button" className="btn btn--ad" disabled={busy} onClick={viaAd}>
          ▶ {t('boxAd')} · {t('watchAd')}
        </button>
      )}
      {msg && <p className="hint center warn">{msg}</p>}
    </Modal>
  )
}
