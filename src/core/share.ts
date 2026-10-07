import type { Challenge } from './types'
import { exerciseById } from '../data/exercises'
import { BRAND_LIME, BRAND_ORANGE, drawMuscleman, neonText } from '../game/brandArt'
import { getLang, translate as t } from '../i18n'
import { useGame } from './store'
import { CHARACTERS } from '../data/characters'
import { track } from './analytics'

/** Public URL used in share texts and challenge links (the game itself may run inside a portal iframe). */
export const SHARE_URL = import.meta.env.VITE_SHARE_URL || 'https://gym-legends.vercel.app/'

export type ShareOrigin = 'pr' | 'pr_wsp' | 'level' | 'challenge_won' | 'rematch' | 'achievement' | 'combo' | 'routine'

/** `/r` serves a per-challenge link preview (api/reto.ts) and then opens the game. */
function landing(params: Record<string, string>) {
  const u = new URL('r', SHARE_URL)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  if (getLang() === 'en') u.searchParams.set('hl', 'en')
  return u.toString()
}

export function challengeLink(exerciseId: string, kg: number, from: string, rev = false) {
  return landing({ reto: `${exerciseId}-${kg}`, de: from, ...(rev ? { rev: '1' } : {}) })
}

export function inviteLink(from: string) {
  return landing({ de: from })
}

/** Name shown to friends: the player's nickname, or the athlete's name. */
export function playerName() {
  const s = useGame.getState()
  return s.nick.trim() || (s.selected ? CHARACTERS[s.selected].name : 'Gym Legend')
}

/** Who sent the link that opened the game (challenge or invite), for analytics. */
export let invitedBy: string | null = null

/** Reads `?reto=bench-bar-60&de=Max&rev=1` once at boot and removes it from the address bar. */
export function readChallenge(): Challenge | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('reto')
  const de = params.get('de')
  const rev = params.get('rev') === '1'
  invitedBy = de ? de.slice(0, 24) : null
  if (!raw && !de) return null
  for (const k of ['reto', 'de', 'rev']) params.delete(k)
  const q = params.toString()
  const path = window.location.pathname.replace(/\/r\/?$/, '/')
  window.history.replaceState(null, '', path + (q ? `?${q}` : '') + window.location.hash)
  if (!raw) return null
  const cut = raw.lastIndexOf('-')
  const exerciseId = raw.slice(0, cut)
  const kg = Number(raw.slice(cut + 1))
  const from = (de ?? t('aFriend')).slice(0, 24)
  if (cut <= 0 || !exerciseById(exerciseId) || !Number.isFinite(kg) || kg <= 0) return null
  return { exerciseId, kg, from, ...(rev ? { rev: true } : {}) }
}

/** Pays the once-a-day share reward and records where the share came from. */
export function noteShared(origin: ShareOrigin) {
  track('share', { origin })
  return useGame.getState().noteShare()
}

/** Story-format card (1080x1920): kicker, a huge number, a title and a call to action. */
export interface CardData {
  kicker: string
  title: string
  big: string
  unit: string
  detail?: string
  name: string
  level: number
  cta: string
}

async function drawCard(d: CardData): Promise<Blob | null> {
  await document.fonts?.ready
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  const ctx = c.getContext('2d')!
  const bg = ctx.createLinearGradient(0, 0, 0, c.height)
  bg.addColorStop(0, '#120d0a')
  bg.addColorStop(0.55, '#2a1a12')
  bg.addColorStop(1, '#0d0907')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, c.width, c.height)

  ctx.save()
  ctx.globalAlpha = 0.09
  drawMuscleman(ctx, 540, 1100, 1300, BRAND_ORANGE)
  ctx.restore()

  neonText(ctx, 'BONNETTY', 540, 190, 150, BRAND_ORANGE)
  neonText(ctx, 'F I T N E S S', 540, 310, 72, BRAND_LIME, 800)

  const font = (w: number, s: number) => `${w} ${s}px "Bricolage Grotesque", "Arial Black", sans-serif`
  const fit = (text: string, w: number, size: number, max: number) => {
    let s = size
    ctx.font = font(w, s)
    while (s > 24 && ctx.measureText(text).width > max) ctx.font = font(w, (s -= 4))
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = BRAND_LIME
  fit(d.kicker, 900, 96, 980)
  ctx.fillText(d.kicker, 540, 560)

  ctx.fillStyle = '#f6efe6'
  fit(d.title, 800, 64, 980)
  ctx.fillText(d.title, 540, 700)

  ctx.save()
  ctx.shadowColor = BRAND_ORANGE
  ctx.shadowBlur = 50
  ctx.fillStyle = '#ffffff'
  fit(d.big, 900, 330, 1000)
  ctx.fillText(d.big, 540, 960)
  ctx.restore()
  ctx.fillStyle = BRAND_ORANGE
  ctx.font = font(900, 110)
  ctx.fillText(d.unit, 540, 1160)

  if (d.detail) {
    ctx.fillStyle = '#cbbba3'
    fit(d.detail, 700, 54, 980)
    ctx.fillText(d.detail, 540, 1290)
  }
  ctx.fillStyle = '#f6efe6'
  fit(`${d.name} · ${t('levelLong')} ${d.level}`, 800, 60, 980)
  ctx.fillText(`${d.name} · ${t('levelLong')} ${d.level}`, 540, 1400)

  ctx.fillStyle = BRAND_ORANGE
  ctx.beginPath()
  ctx.roundRect(140, 1560, 800, 150, 75)
  ctx.fill()
  ctx.fillStyle = '#1a100c'
  fit(d.cta, 900, 64, 720)
  ctx.fillText(d.cta, 540, 1637)

  ctx.fillStyle = '#cbbba3'
  ctx.font = font(700, 40)
  ctx.fillText(t('cardFooter', { host: new URL(SHARE_URL).host }), 540, 1810)

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'))
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

/**
 * Shares a story card as an image (WhatsApp/Instagram stories on mobile).
 * Falls back to downloading the card and opening WhatsApp with the link.
 * Returns true when something was actually shared or saved.
 */
export async function shareCard(d: CardData, text: string, link: string): Promise<boolean> {
  const blob = await drawCard(d)
  const full = `${text} ${link}`
  if (blob) {
    const file = new File([blob], 'gym-legends.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: full })
        return true
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return false
      }
    }
    download(blob, 'gym-legends.png')
  }
  shareWhatsApp(full)
  return true
}

export interface RoutineCardData {
  name: string
  title: string
  date: string
  items: { name: string; sets: number; reps: number; rest: string; kg: number }[]
  tip: string
}

async function drawRoutineCard(d: RoutineCardData): Promise<Blob | null> {
  await document.fonts?.ready
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1350
  const ctx = c.getContext('2d')!
  const bg = ctx.createLinearGradient(0, 0, 0, c.height)
  bg.addColorStop(0, '#120d0a')
  bg.addColorStop(1, '#24170f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.save()
  ctx.globalAlpha = 0.07
  drawMuscleman(ctx, 860, 1050, 900, BRAND_ORANGE)
  ctx.restore()

  const font = (w: number, s: number) => `${w} ${s}px "Bricolage Grotesque", "Arial Black", sans-serif`
  neonText(ctx, 'BONNETTY', 540, 110, 96, BRAND_ORANGE)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = BRAND_LIME
  ctx.font = font(900, 64)
  ctx.fillText(t('routineCardTitle'), 540, 230)
  ctx.fillStyle = '#f6efe6'
  ctx.font = font(800, 44)
  ctx.fillText(`${d.title} · ${d.date}`, 540, 300)

  ctx.textAlign = 'left'
  let y = 400
  d.items.forEach((it, i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.roundRect(70, y - 70, 940, 150, 28)
    ctx.fill()
    ctx.fillStyle = BRAND_ORANGE
    ctx.font = font(900, 56)
    ctx.fillText(String(i + 1), 105, y)
    ctx.fillStyle = '#ffffff'
    ctx.font = font(800, 46)
    ctx.fillText(it.name, 170, y - 22)
    ctx.fillStyle = '#cbbba3'
    ctx.font = font(700, 34)
    ctx.fillText(t('routineCardLine', { sets: it.sets, reps: it.reps, rest: it.rest }), 170, y + 30)
    ctx.textAlign = 'right'
    ctx.fillStyle = BRAND_LIME
    ctx.font = font(900, 60)
    ctx.fillText(`${it.kg} kg`, 975, y)
    ctx.textAlign = 'left'
    y += 175
  })

  ctx.fillStyle = '#f6efe6'
  ctx.font = font(700, 34)
  ctx.textAlign = 'center'
  ctx.fillText(`💡 ${d.tip}`, 540, Math.min(1180, y + 10))
  ctx.fillStyle = '#cbbba3'
  ctx.font = font(700, 32)
  ctx.fillText(t('routineCardFooter', { name: d.name, host: new URL(SHARE_URL).host }), 540, 1290)
  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'))
}

export function routineText(d: RoutineCardData) {
  const lines = d.items.map((it, i) =>
    t('routineTextLine', { i: i + 1, name: it.name, sets: it.sets, reps: it.reps, kg: it.kg, rest: it.rest }),
  )
  return `${t('routineTextTitle', { title: d.title })}\n${lines.join('\n')}\n💡 ${d.tip}\n${t('routineTextFooter')} ${inviteLink(d.name)}`
}

/** Saves/shares the routine card as an image; falls back to downloading it. */
export async function shareRoutineImage(d: RoutineCardData): Promise<boolean> {
  const blob = await drawRoutineCard(d)
  if (!blob) return false
  const file = new File([blob], 'gym-legends-routine.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: routineText(d) })
      return true
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return false
    }
  }
  download(blob, 'gym-legends-routine.png')
  return true
}

export function shareWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}
