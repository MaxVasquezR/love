import { useGame, bestLevel } from '../core/store'
import { statsFor } from '../core/progression'
import type { CharacterId } from '../core/types'
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters'
import { StatBars } from '../components/StatBars'
import { useT } from '../i18n'

type Props = {
  preview: CharacterId
  onPreview: (id: CharacterId) => void
  onConfirm: () => void
  onBack?: () => void
}

export function CharacterSelect({ preview, onPreview, onConfirm, onBack }: Props) {
  const { t, L } = useT()
  const game = useGame()
  const def = CHARACTERS[preview]
  const unlocked = game.unlocked.includes(preview)
  const level = game.progress[preview].level
  const stats = statsFor(preview, level, game.equipment)
  const best = bestLevel(game)

  const choose = () => {
    if (!unlocked) return
    game.selectCharacter(preview)
    onConfirm()
  }

  return (
    <div className="dock dock--select fade-in">
      <div className="dock__row">
        <div className="dock__title">
          <p className="tag">{t('selectTitle')}</p>
          <strong>
            {def.name} · <span className="accent">{L(def.title)}</span>
          </strong>
          <p className="hint">{L(def.bio)}</p>
        </div>
        {onBack && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onBack}>
            {t('back')}
          </button>
        )}
      </div>

      <div className="roster">
        {CHARACTER_ORDER.map((id) => {
          const c = CHARACTERS[id]
          const own = game.unlocked.includes(id)
          return (
            <button
              key={id}
              type="button"
              className={`roster__item ${id === preview ? 'on' : ''} ${own ? '' : 'locked'}`}
              onClick={() => onPreview(id)}
            >
              <span className="roster__dot" style={{ background: c.look.top }} />
              <b>{c.name}</b>
              <small>
                {own ? `${t('level')} ${game.progress[id].level}` : '🔒'}
              </small>
            </button>
          )
        })}
      </div>

      <StatBars stats={stats} />

      {unlocked ? (
        <button type="button" className="btn btn--primary" onClick={choose}>
          {t('choose')} {def.name}
        </button>
      ) : 'level' in def.unlock ? (
        <div className="row-2">
          <span className="hint">{t('unlockAt', { lvl: def.unlock.level })} ({best})</span>
          <button
            type="button"
            className="btn btn--gold"
            disabled={game.coins < def.unlock.coins}
            onClick={() => game.buyCharacter(preview)}
          >
            {t('buyFor', { price: def.unlock.coins })}
          </button>
        </div>
      ) : null}
    </div>
  )
}
