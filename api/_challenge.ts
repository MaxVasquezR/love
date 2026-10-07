import { exerciseById } from '../src/data/exercises'
import { EXERCISES_EN } from '../src/i18n/exercises.en'

export type Lang = 'es' | 'en'

export interface LinkInfo {
  lang: Lang
  from: string
  rev: boolean
  exercise: string | null
  kg: number | null
  /** Query string to forward to the game (reto, de, rev, hl). */
  query: string
}

/** Parses `?reto=bench-bar-60&de=Juan&rev=1&hl=en` the same way the game does. */
export function parseLink(url: URL): LinkInfo {
  const p = url.searchParams
  const lang: Lang = p.get('hl') === 'en' ? 'en' : 'es'
  const from = (p.get('de') ?? '').replace(/\s+/g, ' ').trim().slice(0, 24)
  const rev = p.get('rev') === '1'
  const raw = p.get('reto') ?? ''
  const cut = raw.lastIndexOf('-')
  const id = cut > 0 ? raw.slice(0, cut) : ''
  const kg = Number(raw.slice(cut + 1))
  const ex = id ? exerciseById(id) : undefined
  const valid = !!ex && Number.isFinite(kg) && kg > 0
  const exercise = valid ? (lang === 'en' ? (EXERCISES_EN[ex.id]?.name ?? ex.name) : ex.name) : null

  const q = new URLSearchParams()
  if (valid) q.set('reto', raw)
  if (from) q.set('de', from)
  if (valid && rev) q.set('rev', '1')
  if (lang === 'en') q.set('hl', 'en')
  return { lang, from, rev: valid && rev, exercise, kg: valid ? kg : null, query: q.toString() }
}

export function headline(l: LinkInfo) {
  const who = l.from || (l.lang === 'en' ? 'A friend' : 'Un pata')
  if (l.lang === 'en') {
    if (!l.exercise) return { title: `${who} invites you to Gym Legends`, sub: 'Free gym game: train, break PRs and challenge your friends.' }
    if (l.rev) return { title: `${who} beat your challenge and sent it back!`, sub: `${l.exercise}: ${l.kg} kg. Can you take it back?` }
    return { title: `${who} challenges you: ${l.exercise} ${l.kg} kg`, sub: 'Can you beat it? Play free in your browser.' }
  }
  if (!l.exercise) return { title: `${who} te invita a Gym Legends`, sub: 'Juego de gym gratis: entrena, rompe tus PRs y reta a tus patas.' }
  if (l.rev) return { title: `¡${who} superó tu reto y te lo devolvió!`, sub: `${l.exercise}: ${l.kg} kg. ¿Te lo vas a dejar?` }
  return { title: `${who} te reta: ${l.exercise} ${l.kg} kg`, sub: '¿Me superas? Juega gratis desde el navegador.' }
}
