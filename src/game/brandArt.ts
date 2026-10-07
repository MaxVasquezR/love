/** 2D drawing helpers for the Bonnetty Fitness brand. Used by 3D textures and the share card. */

export const BRAND_ORANGE = '#ff6b4a'
export const BRAND_LIME = '#c8f542'

/** Double-biceps bodybuilder silhouette centered at (cx, cy); `s` is the total height. */
export function drawMuscleman(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  const u = s / 10
  ctx.save()
  ctx.translate(cx, cy - s / 2)
  ctx.fillStyle = color
  const ellipse = (x: number, y: number, rx: number, ry: number, rot = 0) => {
    ctx.beginPath()
    ctx.ellipse(x * u, y * u, rx * u, ry * u, rot, 0, Math.PI * 2)
    ctx.fill()
  }
  // head and neck
  ellipse(0, 0.9, 0.62, 0.75)
  ctx.fillRect(-0.42 * u, 1.4 * u, 0.84 * u, 0.6 * u)
  // traps + V torso
  ctx.beginPath()
  ctx.moveTo(-2.3 * u, 2.2 * u)
  ctx.quadraticCurveTo(0, 1.4 * u, 2.3 * u, 2.2 * u)
  ctx.lineTo(1.25 * u, 5.4 * u)
  ctx.lineTo(-1.25 * u, 5.4 * u)
  ctx.closePath()
  ctx.fill()
  // pecs
  ellipse(-0.75, 2.85, 0.95, 0.6)
  ellipse(0.75, 2.85, 0.95, 0.6)
  for (const side of [-1, 1]) {
    // delt
    ellipse(side * 2.35, 2.35, 0.75, 0.65)
    // upper arm horizontal
    ellipse(side * 3.3, 2.35, 1.05, 0.48)
    // biceps peak
    ellipse(side * 3.25, 1.95, 0.7, 0.55)
    // forearm vertical
    ctx.save()
    ctx.translate(side * 4.15 * u, 1.3 * u)
    ctx.rotate(side * 0.18)
    ctx.beginPath()
    ctx.ellipse(0, 0, 0.42 * u, 1.05 * u, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // fist
    ellipse(side * 4.25, 0.25, 0.45, 0.42)
    // quads
    ctx.save()
    ctx.translate(side * 0.75 * u, 7 * u)
    ctx.rotate(side * -0.08)
    ctx.beginPath()
    ctx.ellipse(0, 0, 0.8 * u, 1.7 * u, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // calves
    ellipse(side * 0.85, 9.05, 0.45, 0.85)
  }
  // hips
  ellipse(0, 5.45, 1.3, 0.55)
  ctx.restore()
}

/** Classic neon tube text with glow. */
export function neonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 900,
) {
  ctx.save()
  ctx.font = `${weight} ${size}px "Bricolage Grotesque", "Arial Black", Impact, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = size * 0.35
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.shadowBlur = size * 0.12
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.55
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** Full sign: BONNETTY / FITNESS with the muscleman logo underneath, on a transparent background. */
export function drawBrandSign(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  neonText(ctx, 'BONNETTY', w / 2, h * 0.15, h * 0.2, BRAND_ORANGE)
  neonText(ctx, 'F I T N E S S', w / 2, h * 0.33, h * 0.1, BRAND_LIME, 800)
  ctx.save()
  ctx.shadowColor = BRAND_ORANGE
  ctx.shadowBlur = h * 0.05
  drawMuscleman(ctx, w / 2, h * 0.7, h * 0.52, BRAND_ORANGE)
  ctx.restore()
}
