import type { CharacterId, CharacterLook, OutfitId, Stats } from '../core/types'

export type BaseLook = Omit<CharacterLook, 'muscle'>

export interface CharacterDef {
  id: CharacterId
  name: string
  title: string
  bio: string
  base: Stats
  growth: Stats
  /** Free when the best level among your athletes reaches this, or buy with lucas. */
  unlock: { free: true } | { level: number; coins: number }
  look: BaseLook
  /** Muscle at level 1 and how much it grows per level (0..1 scale). */
  muscleBase: number
  muscleGrowth: number
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  max: {
    id: 'max',
    name: 'Max',
    title: 'El Constante',
    bio: 'De Surco. Equilibrado en todo y nunca falta un lunes de pecho.',
    base: { str: 10, end: 10, tec: 10 },
    growth: { str: 2, end: 1.5, tec: 1.5 },
    unlock: { free: true },
    look: {
      build: 'male',
      skin: '#e6b48f',
      hair: '#9c7048',
      hairStyle: 'short',
      top: '#2d6a4f',
      topStyle: 'tank',
      bottom: '#1b1b1b',
      bottomStyle: 'shorts',
      shoes: '#f1f1f1',
      shoeStripe: '#2d6a4f',
      socks: '#ffffff',
      height: 1,
      watch: true,
    },
    muscleBase: 0.25,
    muscleGrowth: 0.018,
  },
  ana: {
    id: 'ana',
    name: 'Ana',
    title: 'La Técnica',
    bio: 'De Miraflores. Forma perfecta en cada rep: sus perfectas valen oro.',
    base: { str: 8, end: 10, tec: 14 },
    growth: { str: 1.5, end: 1.5, tec: 2.5 },
    unlock: { free: true },
    look: {
      build: 'female',
      skin: '#f0c9a8',
      hair: '#e8c547',
      hairStyle: 'ponytail',
      top: '#e85d75',
      topStyle: 'bra',
      bottom: '#22223b',
      bottomStyle: 'leggings',
      shoes: '#ffffff',
      shoeStripe: '#e85d75',
      socks: '#ffffff',
      height: 0.94,
      scrunchie: '#ff8fab',
      headphones: true,
    },
    muscleBase: 0.2,
    muscleGrowth: 0.016,
  },
  bruno: {
    id: 'bruno',
    name: 'Bruno',
    title: 'El Fierro',
    bio: 'Del Callao. Powerlifter de corazón: si pesa, lo levanta.',
    base: { str: 15, end: 8, tec: 8 },
    growth: { str: 3, end: 1, tec: 1 },
    unlock: { level: 4, coins: 900 },
    look: {
      build: 'male',
      skin: '#a86f45',
      hair: '#141414',
      hairStyle: 'buzz',
      top: '#c1121f',
      topStyle: 'stringer',
      bottom: '#111111',
      bottomStyle: 'joggers',
      shoes: '#111111',
      shoeStripe: '#c1121f',
      socks: '#111111',
      height: 1.04,
      beard: '#141414',
      belt: true,
    },
    muscleBase: 0.5,
    muscleGrowth: 0.012,
  },
  kiara: {
    id: 'kiara',
    name: 'Kiara',
    title: 'La Imparable',
    bio: 'De San Juan de Lurigancho. Reina del día de pierna, no conoce el cansancio.',
    base: { str: 9, end: 15, tec: 10 },
    growth: { str: 1.5, end: 3, tec: 1.5 },
    unlock: { level: 7, coins: 1800 },
    look: {
      build: 'female',
      skin: '#c48a5c',
      hair: '#2a1a12',
      hairStyle: 'bun',
      top: '#06d6a0',
      topStyle: 'bra',
      bottom: '#073b4c',
      bottomStyle: 'leggings',
      shoes: '#ffd166',
      shoeStripe: '#073b4c',
      socks: '#ffffff',
      height: 0.96,
      kneeSleeves: true,
    },
    muscleBase: 0.3,
    muscleGrowth: 0.016,
  },
  lucho: {
    id: 'lucho',
    name: 'Don Lucho',
    title: 'El Veterano',
    bio: 'De Breña. 55 años y 35 de fierro. Técnica impecable y consejos gratis.',
    base: { str: 11, end: 13, tec: 16 },
    growth: { str: 1.5, end: 2, tec: 2.5 },
    unlock: { level: 12, coins: 3000 },
    look: {
      build: 'male',
      skin: '#d49b6e',
      hair: '#b8b8b8',
      hairStyle: 'short',
      top: '#1d3557',
      topStyle: 'tee',
      bottom: '#495057',
      bottomStyle: 'joggers',
      shoes: '#e9ecef',
      shoeStripe: '#1d3557',
      socks: '#ffffff',
      height: 0.98,
      mustache: '#c9c9c9',
      watch: true,
    },
    muscleBase: 0.4,
    muscleGrowth: 0.01,
  },
}

export const CHARACTER_ORDER: CharacterId[] = ['max', 'ana', 'bruno', 'kiara', 'lucho']

export const COACH_LOOK: CharacterLook = {
  build: 'female',
  skin: '#9c6a3f',
  hair: '#1f1f1f',
  hairStyle: 'ponytail',
  top: '#f77f00',
  topStyle: 'tee',
  topPrint: true,
  bottom: '#1f2937',
  bottomStyle: 'leggings',
  shoes: '#ffffff',
  shoeStripe: '#f77f00',
  socks: '#ffffff',
  height: 0.98,
  muscle: 0.6,
  cap: '#111111',
  whistle: true,
  watch: true,
}

export const COACH_NAME = 'Profe Maribel'

export interface OutfitDef {
  name: string
  blurb: string
  price: number
  apply: (look: BaseLook) => Partial<BaseLook>
}

export const OUTFITS: Record<OutfitId, OutfitDef> = {
  base: { name: 'De siempre', blurb: 'Su ropa de batalla.', price: 0, apply: () => ({}) },
  bonnetty: {
    name: 'Polo Bonnetty',
    blurb: 'El polo oficial de Bonnetty Fitness.',
    price: 250,
    apply: () => ({ top: '#111111', topStyle: 'tee', topPrint: true, shoeStripe: '#ff6b4a' }),
  },
  stringer: {
    name: 'Stringer Bonnetty',
    blurb: 'Para lucir los hombros que tanto te costaron.',
    price: 500,
    apply: (l) =>
      l.build === 'female'
        ? { top: '#c8f542', topStyle: 'bra', topPrint: true, bottom: '#111111', bottomStyle: 'leggings' }
        : { top: '#c8f542', topStyle: 'stringer', topPrint: true, bottom: '#111111', bottomStyle: 'shorts' },
  },
  neon: {
    name: 'Neón nocturno',
    blurb: 'Para el turno de las 10 p. m.',
    price: 400,
    apply: (l) =>
      l.build === 'female'
        ? { top: '#3a0ca3', bottom: '#f72585', bottomStyle: 'leggings', shoeStripe: '#4cc9f0' }
        : { top: '#3a0ca3', topStyle: 'tank', bottom: '#4cc9f0', bottomStyle: 'shorts', shoeStripe: '#f72585' },
  },
  hoodie: {
    name: 'Hoodie oversize',
    blurb: 'Para las mañanas de garúa limeña.',
    price: 700,
    apply: () => ({ top: '#6c757d', topStyle: 'hoodie', topPrint: true, bottom: '#212529', bottomStyle: 'joggers' }),
  },
  oro: {
    name: 'Edición Oro',
    blurb: 'Solo para leyendas. Brilla en todo el gym.',
    price: 2000,
    apply: (l) => ({
      top: '#e9c46a',
      topStyle: l.build === 'female' ? 'bra' : 'stringer',
      topPrint: true,
      bottom: '#1b1b1b',
      shoes: '#e9c46a',
      shoeStripe: '#1b1b1b',
    }),
  },
}

export const OUTFIT_ORDER: OutfitId[] = ['base', 'bonnetty', 'stringer', 'neon', 'hoodie', 'oro']

export function outfitKey(characterId: CharacterId, outfit: OutfitId) {
  return `${characterId}:${outfit}`
}
