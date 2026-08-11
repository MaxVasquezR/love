import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import type { ActorPlan, SceneMode } from './game/GameCanvas'
import { useChatter } from './data/useChatter'
import { ROUNDS } from './data/chatter'
import { FINALE_LINES, STATIONS } from './data/stations'
import type {
  Assignment,
  Bubble,
  LiftResult,
  OutfitId,
  PlayerId,
  Screen,
  StationId,
  Variant,
} from './types'
import './App.css'

const GameCanvas = lazy(() =>
  import('./game/GameCanvas').then((m) => ({ default: m.GameCanvas })),
)

type PlayerLift = {
  marker: number
  weight: number
}

type State = {
  screen: Screen
  outfits: Record<PlayerId, OutfitId>
  roundIndex: number
  picks: Partial<Record<PlayerId, Assignment>>
  pickingFor: PlayerId
  coupleScore: number
  results: LiftResult[]
  sceneMode: SceneMode
  lifts: Record<PlayerId, PlayerLift>
  feedback: string
}

const initial: State = {
  screen: 'intro',
  outfits: { max: 'classic', ana: 'classic' },
  roundIndex: 0,
  picks: {},
  pickingFor: 'max',
  coupleScore: 0,
  results: [],
  sceneMode: 'lobby',
  lifts: {
    max: { marker: 0, weight: 40 },
    ana: { marker: 0, weight: 30 },
  },
  feedback: '',
}

const OUTFIT_OPTS: { id: OutfitId; max: string; ana: string }[] = [
  { id: 'classic', max: 'Tank verde', ana: 'Top rosa' },
  { id: 'street', max: 'Navy', ana: 'Violeta' },
  { id: 'date', max: 'Azul date', ana: 'Coral' },
]

function stationById(id: StationId) {
  return STATIONS.find((s) => s.id === id)!
}

export default function App() {
  const [state, setState] = useState<State>(initial)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [bubblePos, setBubblePos] = useState<
    Record<PlayerId, { x: number; y: number; visible: boolean }>
  >({
    max: { x: 0, y: 0, visible: false },
    ana: { x: 0, y: 0, visible: false },
  })

  const round = ROUNDS[state.roundIndex]
  const maxStation = round?.max
  const anaStation = round?.ana

  const plans: Record<PlayerId, ActorPlan> = useMemo(() => {
    const maxId = state.picks.max?.stationId ?? null
    const anaId = state.picks.ana?.stationId ?? null
    let maxPose: ActorPlan['pose'] = 'idle'
    let anaPose: ActorPlan['pose'] = 'idle'
    if (state.sceneMode === 'lobby') {
      maxPose = 'wave'
      anaPose = 'wave'
    }
    return {
      max: { stationId: maxId, pose: maxPose },
      ana: { stationId: anaId, pose: anaPose },
    }
  }, [state.picks, state.sceneMode])

  // dual markers
  useEffect(() => {
    if (state.sceneMode !== 'lift' || state.screen !== 'lift') return
    let raf = 0
    let mMax = 0
    let mAna = 35
    let dMax = 1
    let dAna = -1
    const tick = () => {
      mMax += dMax * 1.9
      mAna += dAna * 1.7
      if (mMax >= 100) {
        mMax = 100
        dMax = -1
      } else if (mMax <= 0) {
        mMax = 0
        dMax = 1
      }
      if (mAna >= 100) {
        mAna = 100
        dAna = -1
      } else if (mAna <= 0) {
        mAna = 0
        dAna = 1
      }
      setState((s) => ({
        ...s,
        lifts: {
          max: { ...s.lifts.max, marker: mMax },
          ana: { ...s.lifts.ana, marker: mAna },
        },
      }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state.sceneMode, state.screen, state.roundIndex])

  // prune bubbles
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      setBubbles((b) => b.filter((x) => x.until > now))
    }, 400)
    return () => clearInterval(id)
  }, [])

  const chatterPhase =
    state.sceneMode === 'walk'
      ? 'walk'
      : state.sceneMode === 'lift'
        ? 'lift'
        : state.sceneMode === 'celebrate'
          ? 'cheer'
          : state.screen === 'between'
            ? 'between'
            : 'lobby'

  useChatter(
    chatterPhase,
    state.screen !== 'intro' && state.screen !== 'pick',
    {
      max: state.picks.max?.stationId ?? maxStation,
      ana: state.picks.ana?.stationId ?? anaStation,
    },
    setBubbles,
  )

  const onArrived = useCallback(() => {
    setState((s) =>
      s.sceneMode === 'walk' ? { ...s, sceneMode: 'lift', screen: 'lift' } : s,
    )
  }, [])

  const onBubblePositions = useCallback(
    (pos: Record<PlayerId, { x: number; y: number; visible: boolean }>) => {
      setBubblePos(pos)
    },
    [],
  )

  const pickVariant = (variant: Variant) => {
    const player = state.pickingFor
    const stationId = player === 'max' ? maxStation : anaStation
    if (!stationId) return

    const assignment: Assignment = {
      stationId,
      variant,
      weight: variant.defaultKg,
      rep: 0,
      goodReps: 0,
      done: false,
      points: 0,
    }

    setState((s) => {
      const picks = { ...s.picks, [player]: assignment }
      const lifts = {
        ...s.lifts,
        [player]: { marker: player === 'max' ? 0 : 40, weight: variant.defaultKg },
      }
      if (player === 'max') {
        return { ...s, picks, lifts, pickingFor: 'ana' }
      }
      // both ready → walk to different machines
      return {
        ...s,
        picks,
        lifts,
        screen: 'walk',
        sceneMode: 'walk',
      }
    })
  }

  const finishPlayer = (player: PlayerId, picks: State['picks'], points: number) => {
    const a = picks[player]!
    return {
      ...a,
      done: true,
      points,
    }
  }

  const attemptRep = (player: PlayerId) => {
    const pick = state.picks[player]
    if (!pick || pick.done || state.sceneMode !== 'lift') return
    const marker = state.lifts[player].marker
    const inZone = marker >= 36 && marker <= 64
    const nextGood = pick.goodReps + (inZone ? 1 : 0)
    const nextRep = pick.rep + 1

    if (nextRep >= pick.variant.reps) {
      const formBonus = 0.7 + (nextGood / pick.variant.reps) * 0.55
      const points = Math.round(state.lifts[player].weight * nextGood * formBonus)
      const result: LiftResult = {
        player,
        stationId: pick.stationId,
        variantName: pick.variant.name,
        weight: state.lifts[player].weight,
        goodReps: nextGood,
        totalReps: pick.variant.reps,
        points,
      }

      setState((s) => {
        const picks = {
          ...s.picks,
          [player]: finishPlayer(player, s.picks, points),
        }
        picks[player] = {
          ...picks[player]!,
          rep: nextRep,
          goodReps: nextGood,
        }
        const results = [...s.results, result]
        const coupleScore = s.coupleScore + points
        const maxDone = picks.max?.done
        const anaDone = picks.ana?.done

        if (maxDone && anaDone) {
          const nextRound = s.roundIndex + 1
          if (nextRound >= ROUNDS.length) {
            return {
              ...s,
              picks,
              results,
              coupleScore,
              sceneMode: 'celebrate',
              screen: 'finale',
              feedback: '¡Rutina completa!',
            }
          }
          return {
            ...s,
            picks,
            results,
            coupleScore,
            sceneMode: 'celebrate',
            screen: 'between',
            feedback: `Ronda ${s.roundIndex + 1} lista`,
          }
        }

        return {
          ...s,
          picks,
          results,
          coupleScore,
          feedback: `${player === 'max' ? 'Max' : 'Ana'} terminó su serie`,
        }
      })
      return
    }

    setState((s) => ({
      ...s,
      picks: {
        ...s.picks,
        [player]: {
          ...pick,
          rep: nextRep,
          goodReps: nextGood,
        },
      },
      feedback: inZone
        ? `¡Buena forma ${player === 'max' ? 'Max' : 'Ana'}!`
        : `${player === 'max' ? 'Max' : 'Ana'}: ajusta timing`,
    }))
  }

  const clampW = (w: number, v: Variant) =>
    Math.min(v.maxKg, Math.max(v.minKg, Number(w.toFixed(1))))

  const byStation = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of state.results) {
      map[r.stationId] = (map[r.stationId] ?? 0) + r.points
    }
    return map
  }, [state.results])

  const currentPickStation =
    state.pickingFor === 'max' ? maxStation : anaStation
  const currentStationData = currentPickStation
    ? stationById(currentPickStation)
    : null

  return (
    <div className="game">
      <Suspense fallback={<div className="boot">Cargando gym 3D…</div>}>
        <GameCanvas
          mode={state.sceneMode}
          outfits={state.outfits}
          plans={plans}
          onArrived={onArrived}
          onBubblePositions={onBubblePositions}
        />
      </Suspense>

      <div className="bubbles" aria-live="polite">
        {bubbles.map((b) => {
          const pos = bubblePos[b.player]
          if (!pos?.visible) return null
          return (
            <div
              key={b.player}
              className={`speech speech--${b.player}`}
              style={{ left: pos.x, top: pos.y }}
            >
              <strong>{b.player === 'max' ? 'Max' : 'Ana'}</strong>
              <span>{b.text}</span>
            </div>
          )
        })}
      </div>

      <div className="hud">
        <div className="hud__top">
          <div className="logo">
            <span>Nosotros en el Gym</span>
            <strong>Max & Ana</strong>
          </div>
          <div className="score-pill">
            <span>Pts</span>
            <strong>{state.coupleScore}</strong>
          </div>
        </div>

        {state.screen === 'intro' && (
          <div className="dock dock--menu fade-in">
            <div className="dock__row">
              <div className="dock__title">
                <p className="tag">Minijuego 3D</p>
                <strong>Gym en vivo · Max & Ana</strong>
                <p className="hint-inline">
                  Cada uno en su máquina. Mira los movimientos y los chats.
                </p>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    screen: 'outfit',
                    sceneMode: 'lobby',
                  }))
                }
              >
                ¡Entrar!
              </button>
            </div>
          </div>
        )}

        {state.screen === 'outfit' && (
          <div className="dock dock--menu fade-in">
            <div className="dock__title">
              <p className="tag">Vestuario</p>
              <strong>Look del día</strong>
            </div>
            <div className="outfit-row">
              {(['max', 'ana'] as PlayerId[]).map((p) => (
                <div key={p} className="outfit-block">
                  <h3>{p === 'max' ? 'Max' : 'Ana'}</h3>
                  <div className="chips">
                    {OUTFIT_OPTS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`chip ${state.outfits[p] === o.id ? 'on' : ''}`}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            outfits: { ...s.outfits, [p]: o.id },
                          }))
                        }
                      >
                        {p === 'max' ? o.max : o.ana}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  screen: 'pick',
                  pickingFor: 'max',
                  picks: {},
                  sceneMode: 'idle',
                }))
              }
            >
              Elegir máquinas
            </button>
          </div>
        )}

        {state.screen === 'pick' && round && currentStationData && (
          <div className="dock dock--menu fade-in">
            <div className="dock__title">
              <p className="tag">
                Ronda {state.roundIndex + 1}/3 ·{' '}
                {state.pickingFor === 'max' ? 'Max' : 'Ana'}
              </p>
              <strong>
                {currentStationData.emoji} {currentStationData.title}
              </strong>
              <p className="hint-inline">
                {state.pickingFor === 'max'
                  ? `Ana irá a ${stationById(anaStation).title}`
                  : `Max ya en ${stationById(maxStation).title}`}
              </p>
            </div>
            <div className="variants">
              {currentStationData.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="variant"
                  onClick={() => pickVariant(v)}
                >
                  <strong>{v.name}</strong>
                  <span>{v.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {state.screen === 'walk' && (
          <div className="dock fade-in">
            <div className="dock__row">
              <p className="hint-inline">
                Caminan a sus máquinas… mira los pasos y los chats ♥
              </p>
            </div>
          </div>
        )}

        {state.screen === 'lift' && state.picks.max && state.picks.ana && (
          <div className="dock fade-in">
            <div className="lift-dock">
              {(['max', 'ana'] as PlayerId[]).map((p) => {
                const pick = state.picks[p]!
                const done = pick.done
                return (
                  <div key={p} className={`lift-strip ${done ? 'done' : ''}`}>
                    <div className="lift-strip__who">
                      <b>{p === 'max' ? 'Max' : 'Ana'}</b>
                      <span>
                        {stationById(pick.stationId).title} · {pick.variant.name}
                      </span>
                    </div>
                    {!done ? (
                      <div className="lift-strip__play">
                        <div className="kg">
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                lifts: {
                                  ...s.lifts,
                                  [p]: {
                                    ...s.lifts[p],
                                    weight: clampW(
                                      s.lifts[p].weight - pick.variant.step,
                                      pick.variant,
                                    ),
                                  },
                                },
                              }))
                            }
                          >
                            −
                          </button>
                          <span>{state.lifts[p].weight}</span>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                lifts: {
                                  ...s.lifts,
                                  [p]: {
                                    ...s.lifts[p],
                                    weight: clampW(
                                      s.lifts[p].weight + pick.variant.step,
                                      pick.variant,
                                    ),
                                  },
                                },
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                        <div className="meter">
                          <div className="meter__zone" />
                          <div
                            className="meter__marker"
                            style={{ left: `${state.lifts[p].marker}%` }}
                          />
                        </div>
                        <span className="reps">
                          {pick.rep}/{pick.variant.reps}
                        </span>
                      </div>
                    ) : (
                      <p className="feedback">OK · {pick.points} pts</p>
                    )}
                    {!done ? (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => attemptRep(p)}
                      >
                        ¡Up!
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                )
              })}
            </div>
            {state.feedback && <p className="feedback">{state.feedback}</p>}
          </div>
        )}

        {state.screen === 'between' && (
          <div className="dock fade-in">
            <div className="dock__row">
              <div className="dock__title">
                <strong>{state.feedback || 'Ronda lista'}</strong>
                <p className="hint-inline">Cambian de máquina</p>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    roundIndex: s.roundIndex + 1,
                    picks: {},
                    pickingFor: 'max',
                    screen: 'pick',
                    sceneMode: 'idle',
                    feedback: '',
                  }))
                }
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {state.screen === 'finale' && (
          <div className="dock dock--menu fade-in">
            <div className="dock__row">
              <div className="dock__title">
                <strong>
                  ¡Clear! <span className="accent">{state.coupleScore}</span>
                </strong>
                <p className="hint-inline">{FINALE_LINES[0]}</p>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setBubbles([])
                  setState({ ...initial })
                }}
              >
                Otra vez
              </button>
            </div>
            <div className="breakdown">
              {STATIONS.map((s) => (
                <div key={s.id}>
                  <span>{s.title}</span>
                  <strong>{byStation[s.id] ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
