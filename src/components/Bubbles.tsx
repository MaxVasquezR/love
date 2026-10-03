import { useTalk } from '../core/talk'
import { COACH_NAME } from '../data/characters'
import type { ActorId, BubbleAnchors } from '../game/GameCanvas'

type Props = { anchors: BubbleAnchors; playerName: string }

export function Bubbles({ anchors, playerName }: Props) {
  const lines = useTalk((s) => s.lines)
  const actors: ActorId[] = ['player', 'coach']
  return (
    <div className="bubbles" aria-live="polite">
      {actors.map((id) => (
        <div
          key={id}
          className="bubble-anchor"
          ref={(el) => {
            anchors.current[id] = el
          }}
        >
          {lines[id] && (
            <div key={lines[id]!.id} className={`speech speech--${id}`}>
              <strong>{id === 'coach' ? COACH_NAME : playerName}</strong>
              <span>{lines[id]!.text}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
