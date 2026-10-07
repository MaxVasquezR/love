import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { CHALLENGE_REWARD, REMATCH_BONUS } from '../core/economy'
import type { Challenge } from '../core/types'
import { exerciseById } from '../data/exercises'
import { useT } from '../i18n'
import { track } from '../core/analytics'

/** Shown when the game was opened from a friend's `?reto=` link. `recruit` = lucas paid for bringing that friend. */
export function ChallengeModal({ challenge, recruit, onClose }: { challenge: Challenge; recruit: number; onClose: () => void }) {
  const { t } = useT()
  const ex = exerciseById(challenge.exerciseId)!
  const reward = CHALLENGE_REWARD + (challenge.rev ? REMATCH_BONUS : 0)

  const accept = () => {
    useGame.getState().setChallenge(challenge)
    track('challenge_accept', { exercise: challenge.exerciseId, kg: challenge.kg, rev: !!challenge.rev })
    onClose()
  }

  return (
    <Modal title={`⚔️ ${t('challengeTitle')}`} onClose={onClose}>
      {recruit > 0 && <p className="banner">🤝 {t('recruitReward', { from: challenge.from, coins: recruit })}</p>}
      <div className="pr-hero">
        <span className="pr-hero__kg">{challenge.kg}</span>
        <span className="pr-hero__unit">kg</span>
      </div>
      <p className="center">
        {challenge.rev
          ? t('challengeRev', { from: challenge.from })
          : t('challengeBody', { from: challenge.from, kg: challenge.kg, exercise: ex.name })}
      </p>
      {challenge.rev && (
        <p className="center hint">
          {ex.name} · {challenge.kg} kg · {t('challengeRevBonus', { bonus: REMATCH_BONUS })}
        </p>
      )}
      <p className="center accent">
        <i className="coin" /> +{reward}
      </p>
      <button type="button" className="btn btn--primary" onClick={accept}>
        {t('challengeAccept')}
      </button>
      <button type="button" className="btn btn--ghost" onClick={onClose}>
        {t('challengeLater')}
      </button>
    </Modal>
  )
}
