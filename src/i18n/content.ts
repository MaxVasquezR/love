import { getLang, onLangChange, type Lang } from '.'
import { EXERCISES, GOALS, STATIONS } from '../data/exercises'
import { CHARACTERS, OUTFITS } from '../data/characters'
import { EQUIPMENT } from '../data/equipment'
import { ACHIEVEMENTS } from '../data/achievements'
import { ROUTINES } from '../data/routines'
import { QUIZ } from '../data/quiz'
import { relocalizeLessons } from '../data/lessons'
import { EXERCISES_EN, GOALS_EN, STATIONS_EN } from './exercises.en'
import { ACHIEVEMENTS_EN, CHARACTERS_EN, EQUIPMENT_EN, OUTFITS_EN, QUIZ_EN, ROUTINES_EN } from './content.en'

/** Original Spanish values of every field an English overlay replaces. */
const spanish = new Map<object, Record<string, unknown>>()

/** Swaps the translated fields of a game-data object in place, so every screen keeps its references. */
function overlay(target: object, en: object | undefined, lang: Lang) {
  if (!en) return
  if (!spanish.has(target)) {
    const t = target as Record<string, unknown>
    spanish.set(target, Object.fromEntries(Object.keys(en).map((k) => [k, t[k]])))
  }
  Object.assign(target, lang === 'en' ? en : spanish.get(target))
}

function localizeContent(lang: Lang) {
  for (const ex of EXERCISES) overlay(ex, EXERCISES_EN[ex.id], lang)
  for (const [id, st] of Object.entries(STATIONS)) overlay(st, STATIONS_EN[id as keyof typeof STATIONS_EN], lang)
  for (const [id, g] of Object.entries(GOALS)) overlay(g, GOALS_EN[id as keyof typeof GOALS_EN], lang)
  for (const [id, c] of Object.entries(CHARACTERS)) overlay(c, CHARACTERS_EN[id as keyof typeof CHARACTERS_EN], lang)
  for (const [id, o] of Object.entries(OUTFITS)) overlay(o, OUTFITS_EN[id as keyof typeof OUTFITS_EN], lang)
  for (const [id, e] of Object.entries(EQUIPMENT)) overlay(e, EQUIPMENT_EN[id as keyof typeof EQUIPMENT_EN], lang)
  for (const a of ACHIEVEMENTS) overlay(a, ACHIEVEMENTS_EN[a.id] ? { name: ACHIEVEMENTS_EN[a.id] } : undefined, lang)
  for (const r of ROUTINES) overlay(r, ROUTINES_EN[r.id], lang)
  for (const q of QUIZ) overlay(q, QUIZ_EN[q.id], lang)
  relocalizeLessons()
}

localizeContent(getLang())
onLangChange(localizeContent)
