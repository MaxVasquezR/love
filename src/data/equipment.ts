import type { EquipmentId, Stats } from '../core/types'

export interface EquipmentDef {
  id: EquipmentId
  name: string
  blurb: string
  price: number
  level: number
  bonus: Partial<Stats>
}

export const EQUIPMENT: Record<EquipmentId, EquipmentDef> = {
  chalk: {
    id: 'chalk',
    name: 'Magnesio',
    blurb: 'Agarre firme, cero resbalones con el sudor.',
    price: 300,
    level: 2,
    bonus: { tec: 2, str: 1 },
  },
  belt: {
    id: 'belt',
    name: 'Cinturón de cuero',
    blurb: 'Core blindado para las cargas pesadas.',
    price: 450,
    level: 3,
    bonus: { str: 3 },
  },
  knees: {
    id: 'knees',
    name: 'Rodilleras',
    blurb: 'Rodillas calientes, series más largas.',
    price: 550,
    level: 4,
    bonus: { end: 3 },
  },
  straps: {
    id: 'straps',
    name: 'Straps',
    blurb: 'Jalones pesados sin que falle el agarre.',
    price: 700,
    level: 6,
    bonus: { str: 2, tec: 2 },
  },
  shoes: {
    id: 'shoes',
    name: 'Zapatillas de halterofilia',
    blurb: 'Base estable, técnica de élite.',
    price: 900,
    level: 8,
    bonus: { tec: 3, end: 1 },
  },
}

export const EQUIPMENT_ORDER: EquipmentId[] = ['chalk', 'belt', 'knees', 'straps', 'shoes']
