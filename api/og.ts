import { ImageResponse } from '@vercel/og'
import type { ReactElement } from 'react'
import { headline, parseLink } from './_challenge'

export const config = { runtime: 'edge' }

const ORANGE = '#ff6b4a'
const LIME = '#c8f542'
const CREAM = '#f6efe6'

type Style = Record<string, string | number>
type Child = ReactElement | string | null

/** Satori takes plain element objects, so the card is built without JSX. */
function el(style: Style, ...children: Child[]): ReactElement {
  const kids = children.filter((c) => c !== null)
  return { type: 'div', key: null, props: { style: { display: 'flex', ...style }, children: kids.length === 1 ? kids[0] : kids } }
}

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&text=${encodeURIComponent(text)}`)
    ).text()
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)
    if (!src) return null
    const res = await fetch(src[1])
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

/** 1200x630 preview card for challenge / invite links. */
export default async function handler(req: Request) {
  const link = parseLink(new URL(req.url))
  const { sub } = headline(link)
  const en = link.lang === 'en'
  const who = (link.from || (en ? 'A friend' : 'Un pata')).toUpperCase()

  const kicker = !link.exercise
    ? en ? `${who} INVITES YOU` : `${who} TE INVITA`
    : link.rev
      ? en ? `${who} SENT IT BACK` : `${who} TE LO DEVOLVIÓ`
      : en ? `${who} CHALLENGES YOU` : `${who} TE RETA`
  const main = link.exercise ? `${link.kg} KG` : 'GYM LEGENDS'
  const detail = link.exercise ? link.exercise.toUpperCase() : en ? 'FREE GYM GAME' : 'JUEGO DE GYM GRATIS'
  const cta = !link.exercise
    ? en ? 'PLAY FREE' : 'JUEGA GRATIS'
    : link.rev
      ? en ? 'TAKE IT BACK?' : '¿TE LO VAS A DEJAR?'
      : en ? 'CAN YOU BEAT IT?' : '¿ME SUPERAS?'

  const font = await loadFont(`BONNETTY FITNESS ${kicker} ${main} ${detail} ${cta} ${sub}`)

  const card = el(
    {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px 64px',
      background: 'linear-gradient(160deg, #120d0a 0%, #2a1a12 60%, #0d0907 100%)',
      color: CREAM,
      fontFamily: font ? 'Bricolage' : 'sans-serif',
    },
    el(
      { justifyContent: 'space-between', alignItems: 'center' },
      el({ fontSize: 40, color: ORANGE, letterSpacing: 2 }, 'BONNETTY'),
      el({ fontSize: 28, color: LIME, letterSpacing: 8 }, 'FITNESS'),
    ),
    el(
      { flexDirection: 'column', alignItems: 'center' },
      el({ fontSize: 46, color: LIME }, kicker),
      el({ fontSize: link.exercise ? 170 : 120, lineHeight: 1, color: '#ffffff', textShadow: `0 0 40px ${ORANGE}` }, main),
      el({ fontSize: 44, marginTop: 8 }, detail),
    ),
    el(
      { justifyContent: 'center' },
      el(
        { background: ORANGE, color: '#1a100c', fontSize: 44, padding: '14px 56px', borderRadius: 999 },
        cta,
      ),
    ),
  )

  return new ImageResponse(card, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: 'Bricolage', data: font, weight: 800, style: 'normal' }] : undefined,
    headers: { 'cache-control': 'public, max-age=86400, s-maxage=604800, immutable' },
  })
}
