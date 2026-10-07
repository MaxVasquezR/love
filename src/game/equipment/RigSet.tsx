import type { RigId } from '../../core/types'
import { RIGS } from '../rigs'
import {
  AdjustableBench,
  DipPullTower,
  DumbbellRack,
  FlatBench,
  LatPulldown,
  LegPress45,
  Platform,
  PowerRack,
  type MachineProps,
} from './Machines'

const MACHINE: Record<RigId, (p: MachineProps) => React.ReactElement> = {
  bench: FlatBench,
  adjustable: AdjustableBench,
  dumbbells: DumbbellRack,
  platform: Platform,
  cable: LatPulldown,
  rack: PowerRack,
  legpress: LegPress45,
  tower: DipPullTower,
}

/** What each machine shows loaded when nobody is training on it. */
const IDLE_KG: Record<RigId, number> = {
  bench: 60,
  adjustable: 12.5,
  dumbbells: 12.5,
  platform: 100,
  cable: 40,
  rack: 80,
  legpress: 120,
  tower: 0,
}

export type RigFocus = { rig: RigId; kg: number }

export function RigSet({ focus, lifting }: { focus: RigFocus | null; lifting: boolean }) {
  return (
    <>
      {(Object.keys(RIGS) as RigId[]).map((id) => {
        const r = RIGS[id]
        const Machine = MACHINE[id]
        const active = focus?.rig === id
        return (
          <group key={id} position={[r.pos[0], 0, r.pos[1]]} rotation={[0, r.face, 0]}>
            <Machine kg={active ? focus.kg : IDLE_KG[id]} active={active} lifting={active && lifting} />
          </group>
        )
      })}
    </>
  )
}
