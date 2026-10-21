import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { descargarCSV } from '../../../utils/csv.js'

// Un solo color por gráfico (cada uno muestra una sola medida, así que no
// hace falta leyenda: el título dice qué se mide). Validado con el validador
// de paletas: contraste ≥ 3:1 sobre la superficie clara.
const COLOR_SERIE = '#2a78d6'
const COLOR_GRILLA = '#e2e8f0'
const COLOR_TEXTO = '#475569'

function Consejo({ active, payload, unidad }) {
  if (!active || !payload?.length) return null
  const { etiqueta, valor, detalle } = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-slate-900">{etiqueta}</p>
      <p className="text-slate-600">{valor.toLocaleString('es-BO')} {unidad}</p>
      {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
    </div>
  )
}

// Tarjeta de gráfico con vista de tabla (accesible) y exportación a CSV.
// datos: [{ etiqueta, valor, detalle? }]. orientacion "horizontal" = barras
// (rankings con nombres largos); "vertical" = columnas (períodos o escalas).
function Grafico({ titulo, descripcion, datos, unidad, orientacion = 'horizontal', archivo, vacio = 'Todavía no hay datos en este período.' }) {
  const [verTabla, setVerTabla] = useState(false)
  const horizontal = orientacion === 'horizontal'
  const alto = horizontal ? Math.max(180, datos.length * 40 + 30) : 260
  const anchoEtiquetas = horizontal ? Math.min(190, Math.max(80, ...datos.map((dato) => dato.etiqueta.length * 7))) : 0
  const hayDatos = datos.some((dato) => dato.valor > 0)

  return (
    <section className="rounded-tarjeta border border-panel-borde bg-white p-5 sm:p-6" aria-label={titulo}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
          {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
        </div>
        {hayDatos && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setVerTabla(!verTabla)} aria-pressed={verTabla} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200">
              {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </button>
            <button
              type="button"
              onClick={() => descargarCSV(archivo, datos.map((dato) => ({ [horizontal ? 'Nombre' : 'Período']: dato.etiqueta, [unidad]: dato.valor, ...(dato.detalle ? { Detalle: dato.detalle } : {}) })))}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              CSV
            </button>
          </div>
        )}
      </div>

      {!hayDatos ? (
        <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{vacio}</p>
      ) : verTabla ? (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="py-2 pr-4">{horizontal ? 'Nombre' : 'Período'}</th><th className="py-2 text-right">{unidad}</th></tr>
            </thead>
            <tbody>
              {datos.map((dato) => (
                <tr key={dato.etiqueta} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-800">{dato.etiqueta}{dato.detalle ? <span className="block text-xs text-slate-500">{dato.detalle}</span> : null}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{dato.valor.toLocaleString('es-BO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: alto }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: horizontal ? 36 : 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={COLOR_GRILLA} strokeWidth={1} horizontal={!horizontal} vertical={horizontal} />
              {horizontal ? (
                <>
                  <XAxis type="number" allowDecimals={false} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="etiqueta" width={anchoEtiquetas} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis dataKey="etiqueta" tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={{ stroke: COLOR_GRILLA }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                  <YAxis allowDecimals={false} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                </>
              )}
              <Tooltip content={<Consejo unidad={unidad} />} cursor={{ fill: 'rgba(42,120,214,0.08)' }} />
              <Bar dataKey="valor" fill={COLOR_SERIE} maxBarSize={24} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false}>
                {horizontal && <LabelList dataKey="valor" position="right" fill={COLOR_TEXTO} fontSize={12} />}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default Grafico
