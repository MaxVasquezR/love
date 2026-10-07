import { useEffect, useState } from 'react'
import { useGame } from '../core/store'
import { MAX_ENERGY, formatMs, msToNextEnergy } from '../core/economy'
import { xpForLevel, MAX_LEVEL } from '../core/progression'
import { CHARACTERS } from '../data/characters'
import { fmtNum, useT } from '../i18n'

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
  const xp2 = game.boosts.xp2Until - now
  const str = game.boosts.strUntil - now

  return (
    <div className="topbar">
      <div className="topbar__who">
        <span className="lvl-badge">
          {t('level')} {p.level}
        </span>
        <div className="topbar__name">
          <strong>
            {c.name}
            {xp2 > 0 && <em className="boost-chip" title={t('boxGotPre')}>⚡x2 {formatMs(xp2)}</em>}
            {str > 0 && <em className="boost-chip boost-chip--str" title={t('boxGotCrea')}>💪 {formatMs(str)}</em>}
          </strong>
          <div className="xpbar" title={`${p.xp}/${need} XP`}>
            <div className="xpbar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="topbar__res">
        <span className="pill pill--coins" title={t('coins')}>
          <i className="coin" /> {fmtNum(game.coins)}
        </span>
        <button type="button" className="pill pill--energy" onClick={onEnergy} title={t('energy')}>
          ⚡ {game.energy}/{MAX_ENERGY}
          {game.energy < MAX_ENERGY && <small>{formatMs(next)}</small>}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => game.setSound(!game.sound)}
          aria-label={t('sound')}
        >
          {game.sound ? '🔊' : '🔇'}
        </button>
        <button type="button" className="icon-btn" onClick={onSettings} aria-label={t('settings')}>
          ⚙
        </button>
      </div>
    </div>
  )
}
