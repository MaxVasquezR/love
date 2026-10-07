import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { useTalk } from '../core/talk'
import { sfx } from '../core/audio'
import { pickQuestion } from '../data/quiz'
import { coachLine, coachPose } from '../data/coach'
import type { Pose } from '../core/types'
import { useT } from '../i18n'

export function Quiz({ onClose, setCoachPose }: { onClose: () => void; setCoachPose: (p: Pose) => void }) {
  const { t } = useT()
  const [q] = useState(() => pickQuestion(useGame.getState().quiz.seen))
  const [picked, setPicked] = useState<number | null>(null)
  const [reward, setReward] = useState(0)
  const say = useTalk((s) => s.say)

  const answer = (i: number) => {
    if (picked !== null) return
    const right = i === q.answer
    setPicked(i)
    setReward(useGame.getState().answerQuiz(q.id, right))
    if (right) sfx.coin()
    else sfx.miss()
    const moment = right ? 'quizRight' : 'quizWrong'
    setCoachPose(coachPose(moment))
    say('coach', coachLine(moment), 3200)
  }

  const close = () => {
    // Skipping still counts, so the quiz doesn't pop up again right away.
    if (picked === null) useGame.setState((s) => ({ quiz: { ...s.quiz, sessionsSince: 0 } }))
    onClose()
  }

  return (
    <Modal title={`🧠 ${t('quizTitle')}`} onClose={close}>
      <p className="quiz-q">{q.q}</p>
      <div className="quiz-opts">
        {q.options.map((o, i) => {
          const state = picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim'
          return (
            <button key={o} type="button" className={`quiz-opt ${state}`} onClick={() => answer(i)}>
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <>
          <p className={picked === q.answer ? 'accent center' : 'warn center'}>
            {picked === q.answer ? t('quizRight', { coins: reward }) : t('quizWrong', { answer: q.options[q.answer] })}
          </p>
          <p className="tip-card">{q.explain}</p>
          <button type="button" className="btn btn--primary" onClick={close}>
            {t('continue')}
          </button>
        </>
      )}
    </Modal>
  )
}
