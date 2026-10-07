import { useGame } from './store'
import { useAdState } from '../ads/adState'
import { audio, onSpeech } from './audio'

/**
 * Procedural gym soundtrack: a small WebAudio step sequencer with synthesized drums,
 * bass, pads and a pentatonic lead. No audio files, so it costs nothing to download.
 *
 *  hub       90 bpm half-time trap groove, chill but with punch
 *  training  128 bpm four-on-the-floor; layers enter as the combo grows
 *  results   a short stinger, then back to the hub groove
 */

export type Mood = 'off' | 'menu' | 'hub' | 'training' | 'results'

const LOOKAHEAD = 0.14
const TICK_MS = 25

// A minor: Am – F – C – G, the classic "vamos con todo" loop.
const ROOTS = [45, 41, 48, 43]
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [55, 60, 64],
  [55, 59, 62],
]
const PENTA = [69, 72, 74, 76, 79, 81, 84]
const LEAD_A = [0, -1, 2, -1, 3, -1, 2, 1, 0, -1, 4, -1, 3, 2, -1, 1]
const LEAD_B = [5, -1, 4, 3, -1, 2, -1, 3, 4, -1, 2, -1, 1, -1, 0, -1]

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

type State = {
  mood: Mood
  intensity: number
  ducked: boolean
  boss: boolean
  step: number
  nextAt: number
  timer: number | null
  bus: GainNode | null
  noise: AudioBuffer | null
  unlocked: boolean
}

const st: State = {
  mood: 'off',
  intensity: 0,
  ducked: false,
  boss: false,
  step: 0,
  nextAt: 0,
  timer: null,
  bus: null,
  noise: null,
  unlocked: false,
}

function bus(ac: AudioContext) {
  if (st.bus) return st.bus
  const comp = ac.createDynamicsCompressor()
  comp.threshold.value = -16
  comp.ratio.value = 4
  comp.attack.value = 0.004
  comp.release.value = 0.2
  const g = ac.createGain()
  g.gain.value = 0
  g.connect(comp).connect(ac.destination)
  st.bus = g
  const len = ac.sampleRate
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  st.noise = buf
  return g
}

function targetVolume() {
  const s = useGame.getState()
  if (!s.sound || st.boss || st.mood === 'off' || useAdState.getState().playing) return 0
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return 0
  const base = s.musicVol * (s.office ? 0.35 : 1) * 0.55
  return base * (st.ducked ? 0.3 : 1)
}

function applyVolume() {
  const ac = st.unlocked ? audio() : null
  if (!ac) return
  const g = bus(ac)
  const v = targetVolume()
  g.gain.cancelScheduledValues(ac.currentTime)
  g.gain.setTargetAtTime(v, ac.currentTime, 0.12)
  if (v > 0) start()
  else window.setTimeout(() => targetVolume() === 0 && stop(), 600)
}

// ---------------------------------------------------------------- instruments

function env(ac: AudioContext, t: number, peak: number, attack: number, decay: number) {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

function kick(ac: AudioContext, out: AudioNode, t: number, punch = 1) {
  const o = ac.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(155, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.13)
  const g = env(ac, t, 0.95 * punch, 0.002, 0.32)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + 0.4)
}

function noiseHit(ac: AudioContext, out: AudioNode, t: number, type: BiquadFilterType, freq: number, peak: number, decay: number) {
  if (!st.noise) return
  const src = ac.createBufferSource()
  src.buffer = st.noise
  const f = ac.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = type === 'bandpass' ? 0.9 : 0.7
  const g = env(ac, t, peak, 0.001, decay)
  src.connect(f).connect(g).connect(out)
  src.start(t, Math.random() * 0.5)
  src.stop(t + decay + 0.05)
}

const hat = (ac: AudioContext, out: AudioNode, t: number, open = false, peak = 0.12) =>
  noiseHit(ac, out, t, 'highpass', 7500, peak, open ? 0.22 : 0.035)

function clap(ac: AudioContext, out: AudioNode, t: number, peak = 0.5) {
  for (let i = 0; i < 3; i++) noiseHit(ac, out, t + i * 0.011, 'bandpass', 1600, peak * (i === 2 ? 1 : 0.6), i === 2 ? 0.16 : 0.02)
  noiseHit(ac, out, t, 'bandpass', 220, peak * 0.25, 0.06)
}

function bass808(ac: AudioContext, out: AudioNode, t: number, note: number, dur: number) {
  const o = ac.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(midi(note) * 1.5, t)
  o.frequency.exponentialRampToValueAtTime(midi(note), t + 0.05)
  const shaper = ac.createWaveShaper()
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1
    curve[i] = Math.tanh(x * 2.2)
  }
  shaper.curve = curve
  const g = env(ac, t, 0.55, 0.005, dur)
  o.connect(shaper).connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function pluckBass(ac: AudioContext, out: AudioNode, t: number, note: number, dur: number) {
  const o = ac.createOscillator()
  o.type = 'sawtooth'
  o.frequency.value = midi(note)
  const f = ac.createBiquadFilter()
  f.type = 'lowpass'
  f.Q.value = 6
  f.frequency.setValueAtTime(1400, t)
  f.frequency.exponentialRampToValueAtTime(180, t + dur)
  const g = env(ac, t, 0.32, 0.004, dur)
  o.connect(f).connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function pad(ac: AudioContext, out: AudioNode, t: number, notes: number[], dur: number, peak = 0.05) {
  const f = ac.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 1100
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.25)
  g.gain.setValueAtTime(peak, t + dur - 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  f.connect(g).connect(out)
  for (const n of notes) {
    for (const det of [-7, 7]) {
      const o = ac.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = midi(n)
      o.detune.value = det
      o.connect(f)
      o.start(t)
      o.stop(t + dur + 0.05)
    }
  }
}

function lead(ac: AudioContext, out: AudioNode, t: number, note: number, dur: number, peak = 0.11) {
  const o = ac.createOscillator()
  o.type = 'square'
  o.frequency.value = midi(note)
  const f = ac.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(3200, t)
  f.frequency.exponentialRampToValueAtTime(900, t + dur)
  const g = env(ac, t, peak, 0.004, dur)
  o.connect(f).connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

// ---------------------------------------------------------------- patterns

function bpm() {
  if (st.mood === 'training') return 128 + Math.round(st.intensity * 12)
  return 90
}

function playStep(ac: AudioContext, out: AudioNode, t: number, step: number, sixteenth: number) {
  const s = step % 16
  const bar = Math.floor(step / 16) % 4
  const root = ROOTS[bar]
  if (st.mood === 'training') {
    const i = st.intensity
    if (s % 4 === 0) kick(ac, out, t)
    if (s % 4 === 2) pluckBass(ac, out, t, root + 12, sixteenth * 1.6)
    if (s % 4 === 3 && i > 0.15) pluckBass(ac, out, t, root + 12, sixteenth * 0.9)
    if (i > 0.2) hat(ac, out, t, s % 4 === 2 && i > 0.5, s % 2 ? 0.07 : 0.11)
    if (i > 0.4 && (s === 4 || s === 12)) clap(ac, out, t, 0.45)
    if (s === 0) pad(ac, out, t, CHORDS[bar], sixteenth * 16, 0.035 + i * 0.02)
    if (i > 0.65) {
      const pat = bar % 2 ? LEAD_B : LEAD_A
      const k = pat[s]
      if (k >= 0) lead(ac, out, t, PENTA[k], sixteenth * 1.4, 0.07 + (i - 0.65) * 0.12)
    }
    if (i > 0.9 && s === 15 && bar === 3) noiseHit(ac, out, t, 'highpass', 2000, 0.18, sixteenth * 4)
    return
  }
  // hub / menu: half-time trap
  const soft = st.mood === 'menu'
  if (s === 0 || s === 7 || (s === 10 && bar % 2 === 1)) kick(ac, out, t, soft ? 0.7 : 1)
  if (s === 8) clap(ac, out, t, soft ? 0.3 : 0.42)
  if (s % 2 === 0) hat(ac, out, t, false, 0.08)
  else if (bar === 3 && s > 11) hat(ac, out, t, false, 0.06)
  if (s === 0) {
    bass808(ac, out, t, root, sixteenth * 7)
    pad(ac, out, t, CHORDS[bar], sixteenth * 16, soft ? 0.05 : 0.04)
  }
  if (s === 10 && bar % 2 === 1) bass808(ac, out, t, root, sixteenth * 4)
  if (!soft) {
    const k = (bar % 2 ? LEAD_B : LEAD_A)[s]
    if (k >= 0 && s % 2 === 0 && (bar === 1 || bar === 3)) lead(ac, out, t, PENTA[k] - 12, sixteenth * 2.5, 0.06)
  }
}

function tick() {
  const ac = audio()
  if (!ac || !st.bus) return
  const sixteenth = 60 / bpm() / 4
  while (st.nextAt < ac.currentTime + LOOKAHEAD) {
    if (st.nextAt < ac.currentTime - 0.2) st.nextAt = ac.currentTime + 0.02
    playStep(ac, st.bus, st.nextAt, st.step, sixteenth)
    st.step++
    st.nextAt += sixteenth
  }
}

function start() {
  if (st.timer != null) return
  const ac = audio()
  if (!ac) return
  st.nextAt = ac.currentTime + 0.05
  st.timer = window.setInterval(tick, TICK_MS)
}

function stop() {
  if (st.timer == null) return
  window.clearInterval(st.timer)
  st.timer = null
}

function stinger(kind: 'win' | 'pr' | 'fail') {
  const ac = st.unlocked ? audio() : null
  if (!ac || targetVolume() === 0) return
  const out = bus(ac)
  const t = ac.currentTime + 0.05
  if (kind === 'fail') {
    ;[64, 63, 62].forEach((n, i) => lead(ac, out, t + i * 0.18, n, 0.3, 0.09))
    return
  }
  const notes = kind === 'pr' ? [69, 72, 76, 81, 84] : [69, 72, 76, 81]
  notes.forEach((n, i) => lead(ac, out, t + i * 0.09, n, 0.35, 0.1))
  kick(ac, out, t)
  clap(ac, out, t + notes.length * 0.09, 0.5)
  pad(ac, out, t + notes.length * 0.09, [57, 64, 69, 72], 1.4, 0.06)
}

// ---------------------------------------------------------------- public API

export const music = {
  /** Call from the first user gesture; browsers block audio before that. */
  unlock() {
    if (st.unlocked) return
    st.unlocked = true
    applyVolume()
  },
  setMood(mood: Mood) {
    if (mood === st.mood) return
    const was = st.mood
    st.mood = mood
    if (mood === 'results') {
      stinger('win')
      st.mood = 'hub'
    }
    if (was === 'training' || mood === 'training') st.step = 0
    applyVolume()
  },
  /** 0..1, usually from the rep combo. */
  setIntensity(v: number) {
    st.intensity = Math.max(0, Math.min(1, v))
  },
  stinger,
  setBoss(on: boolean) {
    st.boss = on
    applyVolume()
  },
  refresh: applyVolume,
}

onSpeech((on) => {
  st.ducked = on
  applyVolume()
})
useAdState.subscribe(() => applyVolume())
useGame.subscribe((s, prev) => {
  if (s.sound !== prev.sound || s.musicVol !== prev.musicVol || s.office !== prev.office) applyVolume()
})
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => applyVolume())
  const first = () => {
    music.unlock()
    window.removeEventListener('pointerdown', first)
    window.removeEventListener('keydown', first)
  }
  window.addEventListener('pointerdown', first)
  window.addEventListener('keydown', first)
}
