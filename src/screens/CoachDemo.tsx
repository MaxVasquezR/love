import { useEffect, useRef, useState } from 'react'
import type { Exercise, MuscleGroup, Pose } from '../core/types'
import { speakAsync, stopVoice } from '../core/audio'
import { useTalk } from '../core/talk'
import type { RepSignal } from '../game/Doll'
import { coachLine } from '../data/coach'
import { TechniqueDemo, type DemoBeat } from './TechniqueDemo'

const KEY = 'gl-demos'
const SLOW = 3
const REP_MS = 600 * SLOW + 450

function seen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function demoSeen(id: string) {
  return seen().includes(id)
}

function markDemo(id: string) {
  try {
    const list = seen()
    if (!list.includes(id)) localStorage.setItem(KEY, JSON.stringify([...list, id]))
  } catch {
    /* storage may be blocked inside some iframes */
  }
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

/**
 * The Profe takes the machine and teaches the lift in slow motion: says each cue out loud while
 * repping, lights up the muscles, shows the classic mistake (red ✗) and then the clean rep (green ✓).
 */
export function CoachDemo({
  exercise,
  rep,
  setHighlight,
  setCoachPose,
  setPlayerPose,
  onFicha,
  onClose,
}: {
  exercise: Exercise
  rep: React.MutableRefObject<RepSignal>
  setHighlight: (g: readonly MuscleGroup[] | null) => void
  setCoachPose: (p: Pose) => void
  setPlayerPose: (p: Pose) => void
  onFicha: () => void
  onClose: () => void
}) {
  const [beat, setBeat] = useState<DemoBeat>({ kind: 'intro' })
  const alive = useRef(true)
  const say = useTalk((s) => s.say)
  const cues = exercise.cues.slice(0, 3)

  useEffect(() => {
    alive.current = true
    const ok = () => alive.current
    const base: RepSignal = { start: -1e9, quality: 'good', exerciseId: exercise.id, kg: exercise.baseKg, slow: SLOW }

    /** Keep repping slowly until `line` has been spoken (and at least `min` reps). */
    const repWhile = async (line: string, bad: boolean, min = 1) => {
      let done = false
      const talking = speakAsync(line, Math.max(2600, line.length * 60)).then(() => {
        done = true
      })
      let n = 0
      while (ok() && (!done || n < min)) {
        rep.current = { ...base, bad, start: performance.now() }
        n++
        await wait(REP_MS)
      }
      await talking
    }

    const run = async () => {
      rep.current = { ...base }
      setPlayerPose('idle')
      setCoachPose('point')
      setHighlight(exercise.groups)
      const intro = coachLine('demoIntro', { name: exercise.name, muscles: exercise.muscles.toLowerCase() })
      say('coach', intro, 4200)
      await speakAsync(intro, 3600)
      if (!ok()) return
      setCoachPose('lift')
      await wait(1300)
      for (let i = 0; i < cues.length && ok(); i++) {
        setBeat({ kind: 'cue', index: i })
        say('coach', cues[i], 4000)
        await repWhile(cues[i], false)
      }
      if (!ok()) return
      setBeat({ kind: 'mistake' })
      const mistake = (exercise.mistakes[0] ?? '').replace(/\.\s*$/, '').toLowerCase()
      const wrong = coachLine('demoMistake', { mistake })
      say('coach', wrong, 4200)
      await repWhile(wrong, true, 2)
      if (!ok()) return
      setBeat({ kind: 'correct' })
      const right = coachLine('demoCorrect')
      say('coach', right, 3600)
      await repWhile(right, false, 2)
      if (!ok()) return
      rep.current = { ...base }
      setCoachPose('clap')
      setPlayerPose('fist')
      setBeat({ kind: 'done' })
      markDemo(exercise.id)
      const out = coachLine('demoDone')
      say('coach', out, 3600)
      void speakAsync(out)
    }
    void run()
    return () => {
      alive.current = false
      stopVoice()
      setHighlight(null)
    }
  }, [exercise.id])

  const finish = () => {
    alive.current = false
    markDemo(exercise.id)
    stopVoice()
    setHighlight(null)
    setCoachPose('idle')
    setPlayerPose('idle')
    onClose()
  }

  return (
    <TechniqueDemo
      exercise={exercise}
      beat={beat}
      cues={cues}
      onSkip={finish}
      onDone={finish}
      onFicha={() => {
        finish()
        onFicha()
      }}
    />
  )
}
