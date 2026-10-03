import { useCallback } from 'react'
import { useGame } from '../core/store'
import type { Lang, Localized } from '../core/types'
import { es, type Dict } from './es'
import { en } from './en'

const DICTS: Record<Lang, Dict> = { es, en }

export type TKey = keyof Dict

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>) {
  const text = DICTS[lang][key] ?? key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

export function useT() {
  const lang = useGame((s) => s.lang)
  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )
  const L = useCallback((v: Localized) => v[lang], [lang])
  return { t, L, lang }
}
