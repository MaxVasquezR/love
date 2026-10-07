import { useState } from 'react'
import { Modal } from '../components/Modal'
import { NickField } from '../components/NickField'
import { useGame } from '../core/store'
import { clampKg } from '../core/progression'
import { REMATCH_BONUS } from '../core/economy'
import { challengeLink, noteShared, playerName, shareCard, shareWhatsApp } from '../core/share'
import { track } from '../core/analytics'
import { sfx } from '../core/audio'
import type { Challenge } from '../core/types'
import { exerciseById } from '../data/exercises'
import { useT } from '../i18n'

export interface RematchInfo {
  challenge: Challenge
  /** Weight the player actually lifted to beat it. */
  kg: number
  coins: number
}

/** After beating a friend's challenge: send it back heavier so the challenge bounces between friends. */
export function RematchModal({ info, onClose }: { info: RematchInfo; onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const ex = exerciseById(info.challenge.exerciseId)!
  const next = clampKg(ex, Math.max(info.kg, info.challenge.kg) + ex.step)
  const from = info.challenge.from
  const text = t('rematchText', { from, exercise: ex.name, kg: next })

  const rewardShare = () => {
    track('rematch_open', { exercise: ex.id, kg: next })
    const coins = noteShared('rematch')
    if (coins > 0) {
      sfx.coin()
      setMsg(t('shareDone', { coins }))
    }
  }

  const share = async () => {
    if (busy) return
    setBusy(true)
    const ok = await shareCard(
      {
        kicker: t('rematchCardKicker'),
        title: ex.name,
        big: `${next}`,
        unit: 'KG',
        detail: t('rematchCardDetail', { from }),
        name: playerName(),
        level: game.selected ? game.progress[game.selected].level : 1,
        cta: t('rematchCardCta'),
      },
      text,
      challengeLink(ex.id, next, playerName(), true),
    )
    setBusy(false)
    if (ok) rewardShare()
  }

  const wsp = () => {
    shareWhatsApp(`${text} ${challengeLink(ex.id, next, playerName(), true)}`)
    rewardShare()
  }

  return (
    <Modal title={`⚔️ ${t('rematchTitle')}`} onClose={onClose}>
      <div className="pr-hero">
        <span className="pr-hero__kg">{next}</span>
        <span className="pr-hero__unit">kg</span>
      </div>
      <p className="center">{t('rematchBody', { from, exercise: ex.name, kg: info.kg, next })}</p>
      <p className="center accent">
        <i className="coin" /> +{info.coins} · {t('rematchHint', { bonus: REMATCH_BONUS })}
      </p>
      <NickField />
      <button type="button" className="btn btn--primary" disabled={busy} onClick={share}>
        📸 {t('rematchSend')}
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
