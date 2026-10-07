import { useState } from 'react'
import { useGame } from '../core/store'
import { noteShared, playerName, shareCard, type CardData, type ShareOrigin } from '../core/share'
import { sfx } from '../core/audio'
import { useT } from '../i18n'

type Props = {
  origin: ShareOrigin
  label: string
  card: Omit<CardData, 'name' | 'level'>
  text: string
  /** Built at click time so it uses the latest nickname. */
  link: () => string
  className?: string
}

/** One-tap "show off" button: shares a story card + link and pays the daily share reward. */
export function ShareMoment({ origin, label, card, text, link, className = 'btn btn--wsp' }: Props) {
  const { t } = useT()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const share = async () => {
    if (busy) return
    setBusy(true)
    const s = useGame.getState()
    const level = s.selected ? s.progress[s.selected].level : 1
    const ok = await shareCard({ ...card, name: playerName(), level }, text, link())
    setBusy(false)
    if (!ok) return
    const coins = noteShared(origin)
    if (coins > 0) {
      sfx.coin()
      setMsg(t('shareDone', { coins }))
    }
  }

  return (
    <>
      <button type="button" className={className} disabled={busy} onClick={share}>
        📲 {label}
      </button>
      {msg && <p className="center accent">{msg}</p>}
    </>
  )
}
