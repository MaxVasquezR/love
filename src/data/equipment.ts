import type { EquipmentId, Localized, Stats } from '../core/types'

export interface EquipmentDef {
  id: EquipmentId
  name: Localized
  blurb: Localized
  price: number
  level: number
  bonus: Partial<Stats>
}

export const EQUIPMENT: Record<EquipmentId, EquipmentDef> = {
  chalk: {
    id: 'chalk',
    name: { es: 'Magnesio', en: 'Chalk' },
    blurb: { es: 'Agarre firme, cero resbalones.', en: 'Solid grip, zero slips.' },
    price: 300,
    level: 2,
    bonus: { tec: 2, str: 1 },
  },
  belt: {
    id: 'belt',
    name: { es: 'Cinturón', en: 'Lifting belt' },
    blurb: { es: 'Core blindado para cargas pesadas.', en: 'Armored core for heavy loads.' },
    price: 450,
    level: 3,
    bonus: { str: 3 },
  },
  knees: {
    id: 'knees',
    name: { es: 'Rodilleras', en: 'Knee sleeves' },
    blurb: { es: 'Rodillas calientes, series más largas.', en: 'Warm knees, longer sets.' },
    price: 550,
    level: 4,
    bonus: { end: 3 },
  },
  straps: {
    id: 'straps',
    name: { es: 'Straps', en: 'Wrist straps' },
    blurb: { es: 'Jalones sin que el agarre falle.', en: 'Pulls without grip failure.' },
    price: 700,
    level: 6,
    bonus: { str: 2, tec: 2 },
  },
  shoes: {
    id: 'shoes',
    name: { es: 'Zapatillas de halterofilia', en: 'Lifting shoes' },
    blurb: { es: 'Base estable, técnica de élite.', en: 'Stable base, elite technique.' },
    price: 900,
    level: 8,
    bonus: { tec: 3, end: 1 },
  },
}

export const EQUIPMENT_ORDER: EquipmentId[] = ['chalk', 'belt', 'knees', 'straps', 'shoes']
