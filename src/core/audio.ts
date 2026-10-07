import { useGame } from './store'
import { useAdState } from '../ads/adState'
import { getLang, type Lang } from '../i18n'

let ctx: AudioContext | null = null

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const muted = () => !useGame.getState().sound || useAdState.getState().playing

function tone(freq: number, dur: number, type: OscillatorType = 'sine', base = 0.12, slideTo?: number, delay = 0) {
  if (muted()) return
  const s = useGame.getState()
  const gain = base * s.sfxVol * (s.office ? 0.5 : 1)
  if (gain < 0.001) return
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  click: () => tone(660, 0.05, 'triangle', 0.06),
  rep: () => tone(240, 0.12, 'square', 0.07, 360),
  perfect: () => {
    tone(880, 0.09, 'triangle', 0.1)
    tone(1320, 0.14, 'triangle', 0.09, undefined, 0.07)
  },
  miss: () => tone(180, 0.25, 'sawtooth', 0.07, 90),
  coin: () => {
    tone(988, 0.07, 'square', 0.06)
    tone(1319, 0.16, 'square', 0.06, undefined, 0.07)
  },
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, undefined, i * 0.11)),
  pr: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'square', 0.07, undefined, i * 0.09)),
  whistle: () => tone(2100, 0.35, 'sine', 0.08, 2300),
}

const voices: Partial<Record<Lang, SpeechSynthesisVoice | null>> = {}

/** The Profe is Maribel: system voices only expose gender through their names. */
const FEMALE_VOICE =
  /paulina|m[oó]nica|helena|sabina|laura|elvira|dalia|camila|paloma|lupe|marisol|soledad|angelica|francisca|google espa|samantha|zira|aria|jenny|karen|victoria|susan|female|mujer/i
const MALE_VOICE = /ra[uú]l|pablo|jorge|[aá]lvaro|diego|juan|carlos|david|mark|guy|alex|daniel|fred|male\b/i

function pickVoice(lang: Lang) {
  if (voices[lang] !== undefined) return voices[lang]
  const list = window.speechSynthesis?.getVoices() ?? []
  if (!list.length) return null
  const by = (re: RegExp) => {
    const matches = list.filter((v) => re.test(v.lang))
    return (
      matches.find((v) => FEMALE_VOICE.test(v.name)) ?? matches.find((v) => !MALE_VOICE.test(v.name)) ?? matches[0]
    )
  }
  voices[lang] =
    lang === 'en'
      ? (by(/^en[-_]US/i) ?? by(/^en/i) ?? null)
      : (by(/^es[-_]PE/i) ?? by(/^es[-_](419|MX|US|CO|AR|CL)/i) ?? by(/^es/i) ?? null)
  return voices[lang]
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    delete voices.es
    delete voices.en
  }
}

/** Reads a coach line out loud (optional "Voz del Profe" setting). */
export function speak(text: string) {
  const s = useGame.getState()
  if (!s.voice || !s.sound || useAdState.getState().playing || !window.speechSynthesis) return
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()
  if (!clean) return
  const u = new SpeechSynthesisUtterance(clean)
  const lang = getLang()
  const v = pickVoice(lang)
  if (v) u.voice = v
  u.lang = v?.lang ?? (lang === 'en' ? 'en-US' : 'es-PE')
  u.rate = 1.08
  u.pitch = 1.1
  u.volume = s.office ? 0.6 : 1
  u.onstart = () => speechListeners.forEach((f) => f(true))
  u.onend = u.onerror = () => speechListeners.forEach((f) => f(false))
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

const speechListeners = new Set<(speaking: boolean) => void>()

/** Notified when the Profe starts/stops talking (music ducks under the voice). */
export function onSpeech(f: (speaking: boolean) => void) {
  speechListeners.add(f)
  return () => speechListeners.delete(f)
}

/** Speak and resolve when the line is finished (or right away if voice is off). */
export function speakAsync(text: string, fallbackMs = 2200): Promise<void> {
  const s = useGame.getState()
  if (!s.voice || !s.sound || !window.speechSynthesis) return new Promise((r) => window.setTimeout(r, fallbackMs))
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      off()
      window.clearTimeout(guard)
      resolve()
    }
    let started = false
    const off = onSpeech((on) => {
      if (on) started = true
      else if (started) finish()
    })
    const guard = window.setTimeout(finish, Math.max(fallbackMs, text.length * 90))
    speak(text)
  })
}

export function stopVoice() {
  window.speechSynthesis?.cancel()
}

useAdState.subscribe((s) => {
  if (s.playing) stopVoice()
})
