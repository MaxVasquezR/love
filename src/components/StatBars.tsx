import type { Stats } from '../core/types'
import { useT } from '../i18n'

export function StatBars({ stats, max = 60 }: { stats: Stats; max?: number }) {
  const { t } = useT()
  const rows: [keyof Stats, string][] = [
    ['str', t('statStr')],
    ['end', t('statEnd')],
    ['tec', t('statTec')],
  ]
  return (
    <div className="stats">
      {rows.map(([k, label]) => (
        <div key={k} className={`stat stat--${k}`}>
          <span>{label}</span>
          <div className="stat__bar">
            <div style={{ width: `${Math.min(100, (stats[k] / max) * 100)}%` }} />
          </div>
          <b>{stats[k]}</b>
        </div>
      ))}
    </div>
  )
}
