import { useSyncExternalStore } from 'react'
import { es, type Dict } from './es'
import { en } from './en'

export type TKey = keyof Dict
export type Lang = 'es' | 'en'

const DICTS: Record<Lang, Dict> = { es, en }

/** English challenge links carry `?hl=en`; that visit opens in English. */
export function urlLang(): Lang | null {
  const hl = new URLSearchParams(window.location.search).get('hl')
  return hl === 'en' || hl === 'es' ? hl : null
}

/** Spanish unless the link or the Settings choice says otherwise. */
let lang: Lang = urlLang() ?? 'es'
const listeners = new Set<() => void>()

function apply(l: Lang) {
  document.documentElement.lang = l === 'es' ? 'es-PE' : 'en'
}
apply(lang)

export function getLang() {
  return lang
}

export function setLang(next: Lang) {
  if (next === lang) return
  lang = next
  apply(lang)
  listeners.forEach((l) => l())
}

/** Picks the text for the current language: `L('Hola', 'Hello')`. */
export function L<T>(esText: T, enText: T): T {
  return lang === 'en' ? enText : esText
}

export function fmtNum(n: number) {
  return n.toLocaleString(lang === 'en' ? 'en-US' : 'es-PE')
}

/** Runs before screens re-render on a language change (used to swap game content). */
export function onLangChange(fn: (l: Lang) => void) {
  const run = () => fn(lang)
  listeners.add(run)
  return () => listeners.delete(run)
}

export function translate(key: TKey, vars?: Record<string, string | number>) {
  const text: string = DICTS[lang][key] ?? es[key] ?? key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Re-renders the screen when the language changes. */
export function useT() {
  const current = useSyncExternalStore(subscribe, getLang)
  return { t: translate, lang: current }
}

export function useLang() {
  return useSyncExternalStore(subscribe, getLang)
}
