import * as THREE from 'three'
import { BRAND_ORANGE, drawBrandSign, drawMuscleman } from './brandArt'

let sign: THREE.CanvasTexture | null = null
let print: THREE.CanvasTexture | null = null

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function signTexture() {
  if (sign) return sign
  const c = canvas(1024, 768)
  drawBrandSign(c.getContext('2d')!, c.width, c.height)
  sign = new THREE.CanvasTexture(c)
  sign.colorSpace = THREE.SRGBColorSpace
  sign.anisotropy = 4
  // Redraw once the web font is ready so the sign uses the brand typeface.
  document.fonts?.ready.then(() => {
    drawBrandSign(c.getContext('2d')!, c.width, c.height)
    if (sign) sign.needsUpdate = true
  })
  return sign
}

/** Chest print for shirts: small muscleman + BONNETTY on a transparent background. */
export function printTexture() {
  if (print) return print
  const c = canvas(256, 128)
  const draw = () => {
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    drawMuscleman(ctx, 128, 40, 64, '#ffffff')
    ctx.font = '900 34px "Bricolage Grotesque", "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('BONNETTY', 128, 100)
  }
  draw()
  print = new THREE.CanvasTexture(c)
  print.colorSpace = THREE.SRGBColorSpace
  document.fonts?.ready.then(() => {
    draw()
    if (print) print.needsUpdate = true
  })
  return print
}

let vzla: THREE.CanvasTexture | null = null

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
}

/** Vinotinto chest print (Profe Maribel): the flag's arc of 8 stars, VENEZUELA and a tricolor stripe. */
export function vzlaPrintTexture() {
  if (vzla) return vzla
  const c = canvas(256, 128)
  const draw = () => {
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (1.15 + (i / 7) * 0.7)
      star(ctx, 128 + Math.cos(a) * 70, 62 + Math.sin(a) * 42, 7)
    }
    ctx.font = '900 34px "Bricolage Grotesque", "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('VENEZUELA', 128, 72)
    const stripes = ['#f4c430', '#1f4fa3', '#cf142b']
    stripes.forEach((col, i) => {
      ctx.fillStyle = col
      ctx.fillRect(46, 98 + i * 7, 164, 6)
    })
  }
  draw()
  vzla = new THREE.CanvasTexture(c)
  vzla.colorSpace = THREE.SRGBColorSpace
  document.fonts?.ready.then(() => {
    draw()
    if (vzla) vzla.needsUpdate = true
  })
  return vzla
}

const labels = new Map<string, THREE.CanvasTexture>()

/** Small printed label (kg numbers, machine stickers). Cached per text/colors. */
export function labelTexture(text: string, bg = '#111111', fg = '#ffffff', w = 128, h = 64) {
  const key = `${text}|${bg}|${fg}|${w}x${h}`
  const hit = labels.get(key)
  if (hit) return hit
  const c = canvas(w, h)
  const draw = () => {
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = fg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let size = h * 0.72
    ctx.font = `900 ${size}px "Bricolage Grotesque", "Arial Black", sans-serif`
    while (ctx.measureText(text).width > w * 0.9 && size > 8) {
      size -= 2
      ctx.font = `900 ${size}px "Bricolage Grotesque", "Arial Black", sans-serif`
    }
    ctx.fillText(text, w / 2, h / 2 + 2)
  }
  draw()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  document.fonts?.ready.then(() => {
    draw()
    tex.needsUpdate = true
  })
  labels.set(key, tex)
  return tex
}

export type PosterLine = { t: string; c: string; s: number; italic?: boolean }

const posters = new Map<string, THREE.CanvasTexture>()

/** Multi-line printed poster/sign, lines stacked and centered. Cached per key. */
export function posterTexture(key: string, lines: PosterLine[], bg: string, w = 512, h = 256, border?: string) {
  const hit = posters.get(key)
  if (hit) return hit
  const c = canvas(w, h)
  const draw = () => {
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    if (border) {
      ctx.strokeStyle = border
      ctx.lineWidth = Math.max(6, w * 0.018)
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2)
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const total = lines.reduce((a, l) => a + l.s * 1.18, 0)
    let y = (h - total) / 2
    for (const l of lines) {
      let size = l.s
      const font = () => `${l.italic ? 'italic ' : ''}900 ${size}px "Bricolage Grotesque", "Arial Black", sans-serif`
      ctx.font = font()
      while (ctx.measureText(l.t).width > w * 0.9 && size > 8) {
        size -= 2
        ctx.font = font()
      }
      ctx.fillStyle = l.c
      ctx.fillText(l.t, w / 2, y + (l.s * 1.18) / 2)
      y += l.s * 1.18
    }
  }
  draw()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  document.fonts?.ready.then(() => {
    draw()
    tex.needsUpdate = true
  })
  posters.set(key, tex)
  return tex
}

let tiles: THREE.CanvasTexture | null = null

/** Interlocking rubber gym tiles with flecks; repeat it across the free-weights floor. */
export function tileTexture() {
  if (tiles) return tiles
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1b1b1d'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = Math.random() < 0.15 ? '#5a3a22' : '#2a2a2e'
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }
  ctx.strokeStyle = '#0c0c0d'
  ctx.lineWidth = 4
  ctx.strokeRect(0, 0, 256, 256)
  tiles = new THREE.CanvasTexture(c)
  tiles.colorSpace = THREE.SRGBColorSpace
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping
  tiles.anisotropy = 4
  return tiles
}

export type TvSlide = { title: string; line: string; cue: string }

/** Wall TV that cycles through the routine of the day. Call `show(i)` to change slide. */
export function tvTexture(slides: TvSlide[]) {
  const c = canvas(512, 288)
  const ctx = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const show = (i: number, progress: number) => {
    const s = slides[i % slides.length]
    const g = ctx.createLinearGradient(0, 0, 512, 288)
    g.addColorStop(0, '#16213e')
    g.addColorStop(1, '#0f0f14')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 288)
    ctx.fillStyle = BRAND_ORANGE
    ctx.fillRect(0, 0, 512, 42)
    ctx.fillStyle = '#111'
    ctx.font = '900 26px "Bricolage Grotesque", "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('BONNETTY TV · RUTINA DEL DÍA', 16, 22)
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 46px "Bricolage Grotesque", "Arial Black", sans-serif'
    ctx.fillText(s.title, 22, 100)
    ctx.fillStyle = '#c8f542'
    ctx.font = '800 32px "Bricolage Grotesque", Arial, sans-serif'
    ctx.fillText(s.line, 22, 152)
    ctx.fillStyle = '#e8e8e8'
    ctx.font = 'italic 700 24px "Bricolage Grotesque", Arial, sans-serif'
    ctx.fillText(`“${s.cue}”`, 22, 205)
    ctx.fillStyle = '#333'
    ctx.fillRect(22, 250, 468, 10)
    ctx.fillStyle = BRAND_ORANGE
    ctx.fillRect(22, 250, 468 * progress, 10)
    tex.needsUpdate = true
  }
  show(0, 0)
  return { tex, show }
}

let board: THREE.CanvasTexture | null = null

/** Gym whiteboard with the "rutina del día" written in marker. */
export function boardTexture() {
  if (board) return board
  const c = canvas(512, 384)
  const draw = () => {
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#f4f4ef'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = BRAND_ORANGE
    ctx.font = '900 40px "Bricolage Grotesque", "Arial Black", sans-serif'
    ctx.fillText('RUTINA DEL DÍA', 28, 46)
    ctx.fillStyle = '#1d3557'
    ctx.font = '700 28px "Bricolage Grotesque", Arial, sans-serif'
    const lines = ['• Press banca  4x8', '• Remo con barra  4x10', '• Sentadilla  5x5', '• Plancha  3x45s']
    lines.forEach((l, i) => ctx.fillText(l, 36, 112 + i * 48))
    ctx.fillStyle = '#c1121f'
    ctx.font = 'italic 800 26px "Bricolage Grotesque", Arial, sans-serif'
    ctx.fillText('¡Sin excusas! — Profe Maribel', 36, 340)
  }
  draw()
  board = new THREE.CanvasTexture(c)
  board.colorSpace = THREE.SRGBColorSpace
  document.fonts?.ready.then(() => {
    draw()
    if (board) board.needsUpdate = true
  })
  return board
}
