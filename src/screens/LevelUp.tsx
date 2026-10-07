import { Modal } from '../components/Modal'
import { StatBars } from '../components/StatBars'
import { ShareMoment } from '../components/ShareMoment'
import { useGame, currentStats, type SessionOutcome } from '../core/store'
import { inviteLink, playerName } from '../core/share'
import { CHARACTERS } from '../data/characters'
import { EXERCISES, STATIONS, STATION_ORDER } from '../data/exercises'
import { useT } from '../i18n'

export function LevelUp({ outcome, onClose }: { outcome: SessionOutcome; onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const id = game.selected!
  const from = outcome.newLevel - outcome.levelsGained
  const newStations = STATION_ORDER.filter(
    (s) => STATIONS[s].unlockLevel > from && STATIONS[s].unlockLevel <= outcome.newLevel,
  )
  const newExercises = EXERCISES.filter(
    (e) => e.unlockLevel > from && e.unlockLevel <= outcome.newLevel,
  )
  const tons = Math.round(game.lifetime.kg / 1000)

  return (
    <Modal title={t('levelUpTitle')} onClose={onClose}>
      <div className="levelup">
        <div className="levelup__num">{outcome.newLevel}</div>
        <p>{t('levelUpBody', { name: CHARACTERS[id].name, lvl: outcome.newLevel })}</p>
        <StatBars stats={currentStats(game, id)} />
        <ul className="unlock-list">
          {outcome.unlockedNow.map((c) => (
            <li key={c}>⭐ {t('newUnlock', { name: CHARACTERS[c].name })}</li>
          ))}
          {newStations.map((s) => (
            <li key={s}>🏋️ {t('newStation', { name: STATIONS[s].title })}</li>
          ))}
          {newExercises.map((e) => (
            <li key={e.id}>➕ {e.name}</li>
          ))}
        </ul>
        <div className="share-row">
          <ShareMoment
            origin="level"
            label={t('shareLevel')}
            card={{
              kicker: t('levelCardKicker'),
              title: CHARACTERS[id].name,
              big: `${outcome.newLevel}`,
              unit: t('levelCardUnit'),
              detail: tons > 0 ? t('levelCardDetail', { tons }) : undefined,
              cta: t('cardCtaPlay'),
            }}
            text={t('levelShareText', { lvl: outcome.newLevel })}
            link={() => inviteLink(playerName())}
          />
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {t('continue')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
