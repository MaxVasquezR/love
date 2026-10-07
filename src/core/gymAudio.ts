import { audio } from './audio'
import { useGame } from './store'
import { useAdState } from '../ads/adState'
import { CHARACTERS } from '../data/characters'

/**
 * Synthesized gym sounds: iron plates, the bar hitting the floor, chalk, the athlete's breathing and grunts,
 * and the room itself (people talking, distant plates, cables). Follows the effects volume.
 */

let out: GainNode | null = null
let noise: AudioBuffer | null = null

function level() {
  const s = useGame.getState()
  if (!s.sound || useAdState.getState().playing) return 0
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return 0
  return s.sfxVol * (s.office ? 0.45 : 1)
}

function bus() {
  const ac = audio()
  if (!ac) return null
  if (!out || !noise) {
    out = ac.createGain()
    out.gain.value = level()
    out.connect(ac.destination)
    const len = ac.sampleRate * 2
    noise = ac.createBuffer(1, len, ac.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return { ac, out, noise }
}

function applyLevel() {
  const ac = out ? audio() : null
  if (!ac || !out) return
  out.gain.setTargetAtTime(level(), ac.currentTime, 0.1)
}

useGame.subscribe((s, prev) => {
  if (s.sound !== prev.sound || s.sfxVol !== prev.sfxVol || s.office !== prev.office) applyLevel()
})
useAdState.subscribe(() => applyLevel())
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', applyLevel)

type Bus = NonNullable<ReturnType<typeof bus>>

function env(ac: AudioContext, t: number, peak: number, attack: number, decay: number) {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

/** Filtered noise burst; `sweepTo` glides the filter (scrapes, breaths). */
function hiss(
  b: Bus,
  t: number,
  o: { type: BiquadFilterType; freq: number; q?: number; peak: number; attack: number; decay: number; sweepTo?: number },
  dest: AudioNode = b.out,
) {
  const src = b.ac.createBufferSource()
  src.buffer = b.noise
  const f = b.ac.createBiquadFilter()
  f.type = o.type
  f.frequency.setValueAtTime(o.freq, t)
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + o.attack + o.decay)
  f.Q.value = o.q ?? 0.8
  const g = env(b.ac, t, o.peak, o.attack, o.decay)
  src.connect(f).connect(g).connect(dest)
  src.start(t, Math.random() * 1.2)
  src.stop(t + o.attack + o.decay + 0.05)
}

function tone(b: Bus, t: number, freq: number, peak: number, decay: number, type: OscillatorType = 'sine', slideTo?: number, dest: AudioNode = b.out) {
  const osc = b.ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + decay)
  const g = env(b.ac, t, peak, 0.002, decay)
  osc.connect(g).connect(dest)
  osc.start(t)
  osc.stop(t + decay + 0.05)
}

/** Iron plates knocking: inharmonic ring, lower and longer the more weight is on the bar. */
function ironRing(b: Bus, t: number, kg: number, peak: number, dest: AudioNode = b.out) {
  const base = 420 - Math.min(kg, 220) * 1.1 + Math.random() * 30
  const decay = 0.18 + Math.min(kg, 200) / 600
  ;[1, 1.47, 2.09, 2.71].forEach((m, i) => tone(b, t, base * m, peak / (1 + i * 0.7), decay / (1 + i * 0.35), 'triangle', undefined, dest))
  hiss(b, t, { type: 'bandpass', freq: 2600, q: 1.2, peak: peak * 0.6, attack: 0.001, decay: 0.04 }, dest)
}

function thud(b: Bus, t: number, peak: number, from = 95, decay = 0.22, dest: AudioNode = b.out) {
  tone(b, t, from, peak, decay, 'sine', from * 0.45, dest)
  hiss(b, t, { type: 'lowpass', freq: 380, peak: peak * 0.5, attack: 0.002, decay: decay * 0.8 }, dest)
}

function athleteVoice() {
  const s = useGame.getState()
  return s.selected && CHARACTERS[s.selected].look.build === 'female' ? 'female' : 'male'
}

/** Voiced effort: a buzzy source through two vowel formants. */
function voiced(b: Bus, t: number, f0: number, peak: number, dur: number, formants: [number, number], dest: AudioNode = b.out) {
  const osc = b.ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f0 * 1.08, t)
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.82, t + dur)
  const g = b.ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.04)
  g.gain.setValueAtTime(peak, t + dur * 0.6)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  for (const [i, f] of formants.entries()) {
    const bp = b.ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f
    bp.Q.value = 5
    const fg = b.ac.createGain()
    fg.gain.value = i === 0 ? 1 : 0.5
    osc.connect(bp).connect(fg).connect(g)
  }
  g.connect(dest)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

const now = (b: Bus) => b.ac.currentTime + 0.005

export const gymSfx = {
  /** Plates touching the bar / the floor; `gain` 0..1. */
  clank(kg = 40, gain = 0.4) {
    const b = bus()
    if (!b) return
    const t = now(b)
    ironRing(b, t, kg, 0.09 * gain)
    thud(b, t, 0.18 * gain * Math.min(1.5, 0.5 + kg / 100))
  },
  /** The bar dropped: heavy thud, plates rattling, one bounce. */
  slam(kg = 60) {
    const b = bus()
    if (!b) return
    const t = now(b)
    const heavy = Math.min(1.6, 0.6 + kg / 90)
    thud(b, t, 0.5 * heavy, 80, 0.4)
    ironRing(b, t, kg, 0.12)
    ironRing(b, t + 0.13, kg, 0.05)
    thud(b, t + 0.13, 0.15 * heavy, 70, 0.2)
  },
  /** Lifting the bar out of the rack: metal scraping on the hooks, then a knock. */
  unrack(kg = 40) {
    const b = bus()
    if (!b) return
    const t = now(b)
    hiss(b, t, { type: 'bandpass', freq: 1400, q: 3, peak: 0.07, attack: 0.03, decay: 0.22, sweepTo: 2600 })
    ironRing(b, t + 0.18, kg, 0.05)
  },
  rack(kg = 40) {
    const b = bus()
    if (!b) return
    const t = now(b)
    ironRing(b, t, kg, 0.08)
    ironRing(b, t + 0.09, kg, 0.06)
    thud(b, t, 0.2)
  },
  /** Chalk rubbed between the hands. */
  chalk() {
    const b = bus()
    if (!b) return
    const t = now(b)
    for (let i = 0; i < 3; i++)
      hiss(b, t + i * 0.16, { type: 'bandpass', freq: 3200 + i * 300, q: 0.6, peak: 0.05, attack: 0.04, decay: 0.12 })
    thud(b, t + 0.5, 0.05, 160, 0.08)
  },
  /** Exhale on the way up; voiced when it gets heavy. */
  breathOut(effort = 0.5) {
    const b = bus()
    if (!b) return
    const t = now(b)
    const e = Math.min(1, effort)
    hiss(b, t, { type: 'bandpass', freq: 1100, q: 0.7, peak: 0.035 + e * 0.05, attack: 0.05, decay: 0.45 + e * 0.35, sweepTo: 800 })
    if (e > 0.6) {
      const f0 = athleteVoice() === 'female' ? 230 : 120
      voiced(b, t + 0.03, f0, 0.02 + (e - 0.6) * 0.06, 0.4 + e * 0.2, [520, 900])
    }
  },
  /** Quick inhale through the mouth before lowering. */
  breathIn(effort = 0.4) {
    const b = bus()
    if (!b) return
    const t = now(b)
    hiss(b, t, { type: 'bandpass', freq: 2000, q: 0.9, peak: 0.02 + Math.min(1, effort) * 0.03, attack: 0.22, decay: 0.25, sweepTo: 2600 })
  },
  /** Grinding through the sticking point. */
  grunt(effort = 0.7) {
    const b = bus()
    if (!b) return
    const t = now(b)
    const e = Math.min(1, effort)
    const f0 = (athleteVoice() === 'female' ? 220 : 115) * (0.95 + Math.random() * 0.1)
    voiced(b, t, f0, 0.035 + e * 0.05, 0.28 + e * 0.18, [650 + Math.random() * 80, 1050])
    hiss(b, t, { type: 'bandpass', freq: 900, q: 0.8, peak: 0.03 + e * 0.03, attack: 0.02, decay: 0.3 })
  },
}

// ---------------------------------------------------------------- recovery breathing

let breathTimer = 0

/** Heavy breathing after a hard set that slows down and fades over `seconds`. */
export function restBreathing(intensity: number, seconds: number) {
  stopRestBreathing()
  if (intensity < 0.15) return
  const start = performance.now()
  const cycle = () => {
    const k = 1 - Math.min(1, (performance.now() - start) / 1000 / seconds)
    const e = intensity * k
    if (e < 0.08) return
    gymSfx.breathIn(e * 0.8)
    window.setTimeout(() => gymSfx.breathOut(Math.min(0.55, e * 0.7)), 380)
    breathTimer = window.setTimeout(cycle, 1100 + (1 - e) * 1800)
  }
  cycle()
}

export function stopRestBreathing() {
  window.clearTimeout(breathTimer)
}

// ---------------------------------------------------------------- room tone

const room: { on: boolean; gain: GainNode | null; src: AudioBufferSourceNode | null; lfo: OscillatorNode | null; timer: number } = {
  on: false,
  gain: null,
  src: null,
  lfo: null,
  timer: 0,
}

/** Something happening somewhere in the gym. */
function distantEvent() {
  const b = bus()
  if (!b || !room.gain) return
  const t = now(b)
  const dest = room.gain
  const r = Math.random()
  if (r < 0.4) {
    const kg = 40 + Math.random() * 120
    ironRing(b, t, kg, 0.35, dest)
    if (Math.random() < 0.5) ironRing(b, t + 0.1 + Math.random() * 0.1, kg, 0.2, dest)
    thud(b, t, 0.3, 90, 0.2, dest)
  } else if (r < 0.6) {
    thud(b, t, 0.9, 85, 0.35, dest)
    ironRing(b, t, 120, 0.25, dest)
  } else if (r < 0.8) {
    const female = Math.random() < 0.4
    voiced(b, t, female ? 215 : 110, 0.35, 0.35 + Math.random() * 0.2, [600, 1000], dest)
  } else {
    hiss(b, t, { type: 'bandpass', freq: 500, q: 4, peak: 0.25, attack: 0.15, decay: 0.6, sweepTo: 900 }, dest)
  }
}

function scheduleRoom() {
  room.timer = window.setTimeout(
    () => {
      if (!room.on) return
      distantEvent()
      scheduleRoom()
    },
    1800 + Math.random() * 4200,
  )
}

/** People talking, distant plates and cables while you're in the gym. */
export function ambience(on: boolean) {
  if (on === room.on) return
  room.on = on
  const b = bus()
  if (!b) return
  if (on) {
    const g = b.ac.createGain()
    g.gain.value = 0.0001
    g.gain.setTargetAtTime(0.12, b.ac.currentTime, 0.8)
    const lp = b.ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1800
    g.connect(lp).connect(b.out)
    // Murmur: band-limited noise whose loudness drifts like a crowd.
    const src = b.ac.createBufferSource()
    src.buffer = b.noise
    src.loop = true
    const bp = b.ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 520
    bp.Q.value = 1.1
    const murmur = b.ac.createGain()
    murmur.gain.value = 0.16
    const lfo = b.ac.createOscillator()
    lfo.frequency.value = 0.23
    const depth = b.ac.createGain()
    depth.gain.value = 0.07
    lfo.connect(depth).connect(murmur.gain)
    src.connect(bp).connect(murmur).connect(g)
    src.start()
    lfo.start()
    room.gain = g
    room.src = src
    room.lfo = lfo
    scheduleRoom()
  } else {
    window.clearTimeout(room.timer)
    const { gain, src, lfo } = room
    if (gain) gain.gain.setTargetAtTime(0.0001, b.ac.currentTime, 0.3)
    window.setTimeout(() => {
      src?.stop()
      lfo?.stop()
      gain?.disconnect()
    }, 1500)
    room.gain = room.src = room.lfo = null
  }
}
