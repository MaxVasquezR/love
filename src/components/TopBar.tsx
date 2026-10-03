import { useEffect, useState } from 'react'
import { useGame } from '../core/store'
import { MAX_ENERGY, formatMs, msToNextEnergy } from '../core/economy'
import { xpForLevel, MAX_LEVEL } from '../core/progression'
import { CHARACTERS } from '../data/characters'
import { useT } from '../i18n'

type Props = { onEnergy: () => void; onSettings: () => void }

export function TopBar({ onEnergy, onSettings }: Props) {
  const { t } = useT()
  const game = useGame()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now())
      useGame.getState().syncEnergy()
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!game.selected) return null
  const c = CHARACTERS[game.selected]
  const p = game.progress[game.selected]
  const need = xpForLevel(p.level)
  const pct = p.level >= MAX_LEVEL ? 100 : Math.min(100, (p.xp / need) * 100)
  const next = msToNextEnergy(game.energy, game.energyAt, now)

  return (
    <div className="topbar">
      <div className="topbar__who">
        <span className="lvl-badge">
          {t('level')} {p.level}
        </span>
        <div className="topbar__name">
          <strong>{c.name}</strong>
          <div className="xpbar" title={`${p.xp}/${need} XP`}>
            <div className="xpbar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="topbar__res">
        <span className="pill pill--coins" title={t('coins')}>
          <i className="coin" /> {game.coins.toLocaleString()}
        </span>
        <button type="button" className="pill pill--energy" onClick={onEnergy} title={t('energy')}>
          ⚡ {game.energy}/{MAX_ENERGY}
          {game.energy < MAX_ENERGY && <small>{formatMs(next)}</small>}
        </button>
        <button type="button" className="icon-btn" onClick={onSettings} aria-label={t('settings')}>
          ⚙
        </button>
      </div>
    </div>
  )
}
