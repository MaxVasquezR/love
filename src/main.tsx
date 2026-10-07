import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setupPwa } from './core/pwa.ts'

const root = document.getElementById('root')!
const PLAY_URL = import.meta.env.VITE_PLAY_URL
const params = new URLSearchParams(window.location.search)
const topLevel = window.self === window.top
// Challenge links (?reto=) and ?local play the bundled build so the challenge can be read.
const embed = !!PLAY_URL && topLevel && !params.has('reto') && !params.has('local')

if (embed) {
  const frame = document.createElement('iframe')
  frame.src = PLAY_URL
  frame.title = 'Gym Legends'
  frame.allow = 'autoplay; fullscreen; web-share; clipboard-write'
  frame.setAttribute('allowfullscreen', '')
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;background:#1a1511'
  root.replaceWith(frame)
} else {
  setupPwa()
  import('./App.tsx').then(({ default: App }) => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
