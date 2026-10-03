import type { CharacterId, CharacterLook, Localized, SkinId, Stats } from '../core/types'

export interface CharacterDef {
  id: CharacterId
  name: string
  title: Localized
  bio: Localized
  base: Stats
  growth: Stats
  /** Free when the best level among your characters reaches this, or buy with coins. */
  unlock: { free: true } | { level: number; coins: number }
  look: CharacterLook
  skins: Record<SkinId, { top: string; pants: string }>
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  max: {
    id: 'max',
    name: 'Max',
    title: { es: 'El Constante', en: 'The Consistent' },
    bio: {
      es: 'Equilibrado en todo. Nunca falta un lunes.',
      en: 'Balanced at everything. Never skips a Monday.',
    },
    base: { str: 10, end: 10, tec: 10 },
    growth: { str: 2, end: 1.5, tec: 1.5 },
    unlock: { free: true },
    look: {
      skin: '#f0c9a8',
      hair: '#b8956c',
      hairStyle: 'short',
      top: '#2d6a4f',
      pants: '#1b4332',
      shoes: '#111111',
      scale: 1.05,
      bulk: 1.05,
      watch: true,
    },
    skins: {
      classic: { top: '#2d6a4f', pants: '#1b4332' },
      street: { top: '#1d3557', pants: '#212529' },
      night: { top: '#3a0ca3', pants: '#10002b' },
      gold: { top: '#e9c46a', pants: '#3d2b1f' },
    },
  },
  ana: {
    id: 'ana',
    name: 'Ana',
    title: { es: 'La Técnica', en: 'The Technician' },
    bio: {
      es: 'Forma perfecta en cada rep. Sus perfectas valen oro.',
      en: 'Perfect form on every rep. Her perfects are gold.',
    },
    base: { str: 8, end: 10, tec: 14 },
    growth: { str: 1.5, end: 1.5, tec: 2.5 },
    unlock: { free: true },
    look: {
      skin: '#f0c9a8',
      hair: '#f2d04b',
      hairStyle: 'ponytail',
      top: '#e85d75',
      pants: '#22223b',
      shoes: '#f1faee',
      scale: 0.98,
      bulk: 0.9,
      scrunchie: '#ff8fab',
      headphones: true,
    },
    skins: {
      classic: { top: '#e85d75', pants: '#22223b' },
      street: { top: '#9b5de5', pants: '#240046' },
      night: { top: '#00b4d8', pants: '#03045e' },
      gold: { top: '#e9c46a', pants: '#3d2b1f' },
    },
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    title: { es: 'El Toro', en: 'The Bull' },
    bio: {
      es: 'Powerlifter. Si pesa, lo levanta.',
      en: 'Powerlifter. If it is heavy, he lifts it.',
    },
    base: { str: 15, end: 8, tec: 8 },
    growth: { str: 3, end: 1, tec: 1 },
    unlock: { level: 5, coins: 1200 },
    look: {
      skin: '#8d5524',
      hair: '#1a1a1a',
      hairStyle: 'buzz',
      top: '#d62828',
      pants: '#111111',
      shoes: '#e63946',
      scale: 1.1,
      bulk: 1.3,
      beard: '#1a1a1a',
      belt: true,
    },
    skins: {
      classic: { top: '#d62828', pants: '#111111' },
      street: { top: '#495057', pants: '#212529' },
      night: { top: '#6a040f', pants: '#03071e' },
      gold: { top: '#e9c46a', pants: '#3d2b1f' },
    },
  },
  sofi: {
    id: 'sofi',
    name: 'Sofi',
    title: { es: 'La Incansable', en: 'The Relentless' },
    bio: {
      es: 'Crossfitter. Su resistencia no tiene fondo.',
      en: 'Crossfitter. Her stamina has no bottom.',
    },
    base: { str: 9, end: 15, tec: 10 },
    growth: { str: 1.5, end: 3, tec: 1.5 },
    unlock: { level: 10, coins: 2500 },
    look: {
      skin: '#e0ac69',
      hair: '#c1440e',
      hairStyle: 'bun',
      top: '#06d6a0',
      pants: '#073b4c',
      shoes: '#ffd166',
      scale: 1,
      bulk: 0.95,
      kneeSleeves: true,
    },
    skins: {
      classic: { top: '#06d6a0', pants: '#073b4c' },
      street: { top: '#ef476f', pants: '#2b2d42' },
      night: { top: '#8338ec', pants: '#14213d' },
      gold: { top: '#e9c46a', pants: '#3d2b1f' },
    },
  },
}

export const CHARACTER_ORDER: CharacterId[] = ['max', 'ana', 'leo', 'sofi']

export const COACH_LOOK: CharacterLook = {
  skin: '#c68642',
  hair: '#2b2b2b',
  hairStyle: 'short',
  top: '#f77f00',
  pants: '#2b2d42',
  shoes: '#ffffff',
  scale: 1.08,
  bulk: 1.15,
  cap: '#2b2d42',
  whistle: true,
  beard: '#2b2b2b',
}

export const COACH_NAME = 'Coach Rocco'

export const SKINS: Record<SkinId, { name: Localized; price: number }> = {
  classic: { name: { es: 'Clásico', en: 'Classic' }, price: 0 },
  street: { name: { es: 'Urbano', en: 'Street' }, price: 300 },
  night: { name: { es: 'Neón', en: 'Neon' }, price: 600 },
  gold: { name: { es: 'Dorado', en: 'Gold' }, price: 2000 },
}

export const SKIN_ORDER: SkinId[] = ['classic', 'street', 'night', 'gold']

export function skinKey(characterId: CharacterId, skin: SkinId) {
  return `${characterId}:${skin}`
}
