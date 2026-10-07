import { headline, parseLink } from './_challenge'

export const config = { runtime: 'edge' }

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Challenge / invite landing (`/r?reto=...&de=...`). WhatsApp and other link previews don't run
 * JavaScript, so this returns per-challenge Open Graph tags and then sends players to the game.
 */
export default function handler(req: Request) {
  const url = new URL(req.url)
  const link = parseLink(url)
  const { title, sub } = headline(link)
  const game = `${url.origin}/${link.query ? `?${link.query}` : ''}`
  const image = `${url.origin}/api/og${link.query ? `?${link.query}` : ''}`
  const self = `${url.origin}/r${link.query ? `?${link.query}` : ''}`

  const html = `<!doctype html>
<html lang="${link.lang === 'en' ? 'en' : 'es-PE'}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} · Gym Legends</title>
<meta name="description" content="${esc(sub)}" />
<meta property="og:site_name" content="Gym Legends" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="${link.lang === 'en' ? 'en_US' : 'es_PE'}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(sub)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${esc(self)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(sub)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta name="theme-color" content="#1a1511" />
<meta http-equiv="refresh" content="0;url=${esc(game)}" />
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1a1511;color:#f6efe6;font-family:system-ui,sans-serif}a{color:#ff7a1a}</style>
</head>
<body>
<p><a href="${esc(game)}">${esc(title)}</a></p>
<script>location.replace(${JSON.stringify(game)})</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
