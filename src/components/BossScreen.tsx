import { useEffect, useMemo } from 'react'

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const HEAD = ['Partida', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Total']
const ROWS = [
  'Planilla',
  'Alquiler oficina',
  'Servicios',
  'Marketing digital',
  'Viáticos',
  'Licencias software',
  'Capacitación',
  'Mantenimiento',
  'Logística',
  'Útiles de oficina',
  'Seguros',
  'Imprevistos',
  'Consultoría',
  'Telefonía',
  'Movilidad',
]

/** "Modo jefe": a boring spreadsheet that covers the game until you tap it again. */
export function BossScreen({ onClose }: { onClose: () => void }) {
  const data = useMemo(
    () =>
      ROWS.map((name, r) => {
        const months = Array.from({ length: 6 }, (_, m) => Math.round(1200 + ((r * 7919 + m * 104729) % 9000)))
        return { name, months, total: months.reduce((a, b) => a + b, 0) }
      }),
    [],
  )
  useEffect(() => {
    const prev = document.title
    document.title = 'Presupuesto_Q4_v3_FINAL.xlsx - Excel'
    return () => {
      document.title = prev
    }
  }, [])
  const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <div className="boss" onDoubleClick={onClose} role="presentation">
      <div className="boss__ribbon">
        <b>Archivo</b>
        <span>Inicio</span>
        <span>Insertar</span>
        <span>Fórmulas</span>
        <span>Datos</span>
        <span>Revisar</span>
        <span>Vista</span>
      </div>
      <div className="boss__formula">
        <span className="boss__cell">H17</span>
        <span>fx</span>
        <span>=SUMA(H2:H16)</span>
      </div>
      <div className="boss__grid">
        <table>
          <thead>
            <tr>
              <th />
              {COLS.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>1</th>
              {HEAD.map((h) => (
                <td key={h} className="boss__head">
                  {h}
                </td>
              ))}
            </tr>
            {data.map((row, i) => (
              <tr key={row.name}>
                <th>{i + 2}</th>
                <td>{row.name}</td>
                {row.months.map((v, m) => (
                  <td key={m} className="num">
                    {fmt(v)}
                  </td>
                ))}
                <td className="num boss__total">{fmt(row.total)}</td>
              </tr>
            ))}
            <tr>
              <th>{data.length + 2}</th>
              <td className="boss__head">TOTAL</td>
              {Array.from({ length: 6 }, (_, m) => (
                <td key={m} className="num boss__head">
                  {fmt(data.reduce((a, r) => a + r.months[m], 0))}
                </td>
              ))}
              <td className="num boss__head boss__sel">{fmt(data.reduce((a, r) => a + r.total, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="boss__tabs">
        <span className="on">Presupuesto</span>
        <span>Proyección</span>
        <span>Hoja3</span>
        <small>Listo · doble toque o Esc para volver</small>
      </div>
    </div>
  )
}
