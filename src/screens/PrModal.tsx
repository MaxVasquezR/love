import { useState } from 'react'
import { Modal } from '../components/Modal'
import { NickField } from '../components/NickField'
import { useGame } from '../core/store'
import { oneRepMax } from '../core/economy'
import { challengeLink, noteShared, playerName, shareCard, shareWhatsApp } from '../core/share'
import { sfx } from '../core/audio'
import { exerciseName } from '../data/exercises'
import type { PrInfo } from './Training'
import { useT } from '../i18n'

/** PR celebration with the share card and a WhatsApp challenge link. */
export function PrModal({ pr, onClose }: { pr: PrInfo; onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const id = game.selected!
  const name = playerName()
  const exName = exerciseName(pr.exerciseId)
  const orm = oneRepMax(pr.kg, pr.reps)
  const text = t('shareText', { exercise: exName, kg: pr.kg })

  const rewardShare = (origin: 'pr' | 'pr_wsp') => {
    const coins = noteShared(origin)
    if (coins > 0) {
      sfx.coin()
      setMsg(t('shareDone', { coins }))
    }
  }

  const share = async () => {
    if (busy) return
    setBusy(true)
    const link = challengeLink(pr.exerciseId, pr.kg, playerName())
    const ok = await shareCard(
      {
        kicker: t('prCardKicker'),
        title: exName,
        big: `${pr.kg}`,
        unit: 'KG',
        detail: t('prCardDetail', { orm }),
        name: playerName(),
        level: game.progress[id].level,
        cta: t('cardCtaBeat'),
      },
      text,
      link,
    )
    setBusy(false)
    if (ok) rewardShare('pr')
  }

  const wsp = () => {
    shareWhatsApp(`${text} ${challengeLink(pr.exerciseId, pr.kg, playerName())}`)
    rewardShare('pr_wsp')
  }

  return (
    <Modal title={`🏆 ${t('prTitle')}`} onClose={onClose}>
      <div className="pr-hero">
        <span className="pr-hero__kg">{pr.kg}</span>
        <span className="pr-hero__unit">kg</span>
      </div>
      <p className="center">{t('prBody', { name, kg: pr.kg, exercise: exName, orm })}</p>
      <NickField />
      <button type="button" className="btn btn--primary" disabled={busy} onClick={share}>
        📸 {t('share')}
      </button>
      <button type="button" className="btn btn--wsp" onClick={wsp}>
        💬 {t('shareWsp')}
      </button>
      {msg && <p className="center accent">{msg}</p>}
      <button type="button" className="btn btn--ghost" onClick={onClose}>
        {t('continue')}
      </button>
    </Modal>
  )
}
