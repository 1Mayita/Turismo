import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { descargarCSV } from '../../../utils/csv.js'

// Un solo color por gráfico (cada uno muestra una sola medida, así que no
// hace falta leyenda: el título dice qué se mide). Validado con el validador
// de paletas: contraste ≥ 3:1 sobre la superficie clara.
const COLOR_SERIE = '#626d96'
const COLOR_GRILLA = '#e2e5e7'
const COLOR_TEXTO = '#4b5964'
// Dona: hasta 5 categorías en orden fijo + "Otros" en gris neutro. Paleta
// validada (validate_palette.js, modo claro): pasa CVD y separación normal;
// el contraste bajo 3:1 de algunos tonos se compensa con la leyenda con
// valores y la vista de tabla.
const COLORES_DONA = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const COLOR_OTROS = '#9aa3ab'
const COLOR_SUPERFICIE = '#ffffff'

function colorDona(dato, indice) {
  return dato.clave === 'otros' ? COLOR_OTROS : COLORES_DONA[indice % COLORES_DONA.length]
}

function Consejo({ active, payload, unidad, formatear }) {
  if (!active || !payload?.length) return null
  const { etiqueta, valor, detalle } = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-slate-900">{etiqueta}</p>
      <p className="text-slate-600">{formatear(valor)} {unidad}</p>
      {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
    </div>
  )
}

// Tarjeta de gráfico con vista de tabla (accesible) y exportación a CSV.
// datos: [{ etiqueta, valor, detalle? }]. orientacion "horizontal" = barras
// (rankings con nombres largos); "vertical" = columnas (períodos o escalas).
// tipo: "barras" (por defecto), "linea" (evolución en el tiempo) o "dona"
// (reparto de un total; máximo 6 porciones, ver conOtros()).
// decimales: muestra los valores con un decimal (ej. calificaciones) y
// "maximo" fija el tope del eje (ej. 5 estrellas).
function Grafico({ titulo, descripcion, datos, unidad, orientacion = 'horizontal', tipo = 'barras', columna, decimales = false, maximo, archivo, vacio = 'Todavía no hay datos en este período.', className = '' }) {
  const [verTabla, setVerTabla] = useState(false)
  const formatear = (valor) => (decimales
    ? Number(valor).toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : Number(valor).toLocaleString('es-BO'))
  const horizontal = tipo === 'barras' && orientacion === 'horizontal'
  const alto = horizontal ? Math.max(180, datos.length * 40 + 30) : 260
  const total = datos.reduce((suma, dato) => suma + dato.valor, 0)
  const nombreColumna = columna || (tipo === 'linea' || (tipo === 'barras' && !horizontal) ? 'Período' : 'Nombre')
  const anchoEtiquetas = horizontal ? Math.min(190, Math.max(80, ...datos.map((dato) => dato.etiqueta.length * 7))) : 0
  const hayDatos = datos.some((dato) => dato.valor > 0)

  return (
    <section className={`rounded-xl border border-panel-borde bg-white p-5 sm:p-6 ${className}`} aria-label={titulo}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
          {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
        </div>
        {hayDatos && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setVerTabla(!verTabla)} aria-pressed={verTabla} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200">
              {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </button>
            <button
              type="button"
              onClick={() => descargarCSV(archivo, datos.map((dato) => ({ [nombreColumna]: dato.etiqueta, [unidad]: dato.valor, ...(dato.detalle ? { Detalle: dato.detalle } : {}) })))}
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
              <tr><th className="py-2 pr-4">{nombreColumna}</th><th className="py-2 text-right">{unidad}</th></tr>
            </thead>
            <tbody>
              {datos.map((dato) => (
                <tr key={dato.etiqueta} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-800">{dato.etiqueta}{dato.detalle ? <span className="block text-xs text-slate-500">{dato.detalle}</span> : null}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{formatear(dato.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tipo === 'linea' ? (
        <div style={{ height: alto }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={COLOR_GRILLA} strokeWidth={1} vertical={false} />
              <XAxis dataKey="etiqueta" tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={{ stroke: COLOR_GRILLA }} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis allowDecimals={false} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<Consejo unidad={unidad} formatear={formatear} />} cursor={{ stroke: COLOR_TEXTO, strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Line type="monotone" dataKey="valor" stroke={COLOR_SERIE} strokeWidth={2} dot={datos.length <= 24 ? { r: 3, fill: COLOR_SERIE, strokeWidth: 0 } : false} activeDot={{ r: 5, fill: COLOR_SERIE, stroke: COLOR_SUPERFICIE, strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : tipo === 'dona' ? (
        <div className="grid items-center gap-4 sm:grid-cols-[220px_1fr]">
          <div className="relative mx-auto h-[220px] w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<Consejo unidad={unidad} formatear={formatear} />} />
                <Pie data={datos} dataKey="valor" nameKey="etiqueta" innerRadius={62} outerRadius={100} stroke={COLOR_SUPERFICIE} strokeWidth={2} isAnimationActive={false}>
                  {datos.map((dato, indice) => <Cell key={dato.etiqueta} fill={colorDona(dato, indice)} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-slate-900">{total.toLocaleString('es-BO')}</span>
              <span className="text-xs text-slate-500">{unidad}</span>
            </div>
          </div>
          {/* Leyenda con valor y porcentaje: la identidad no depende solo del color. */}
          <ul className="space-y-2 text-sm">
            {datos.map((dato, indice) => (
              <li key={dato.etiqueta} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: colorDona(dato, indice) }} />
                <span className="min-w-0 flex-1 truncate text-slate-800">{dato.etiqueta}</span>
                <span className="font-semibold tabular-nums text-slate-900">{formatear(dato.valor)}</span>
                <span className="w-11 text-right tabular-nums text-slate-500">{total ? Math.round((dato.valor / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ height: alto }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: horizontal ? 36 : 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={COLOR_GRILLA} strokeWidth={1} horizontal={!horizontal} vertical={horizontal} />
              {horizontal ? (
                <>
                  <XAxis type="number" allowDecimals={decimales} domain={maximo ? [0, maximo] : undefined} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="etiqueta" width={anchoEtiquetas} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  {columna ? (
                    // Categorías (ej. departamentos): se muestran todas, inclinadas si no caben.
                    <XAxis dataKey="etiqueta" interval={0} angle={-30} textAnchor="end" height={64} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={{ stroke: COLOR_GRILLA }} tickLine={false} />
                  ) : (
                    <XAxis dataKey="etiqueta" tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={{ stroke: COLOR_GRILLA }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                  )}
                  <YAxis allowDecimals={decimales} domain={maximo ? [0, maximo] : undefined} tick={{ fill: COLOR_TEXTO, fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                </>
              )}
              <Tooltip content={<Consejo unidad={unidad} formatear={formatear} />} cursor={{ fill: 'rgba(42,120,214,0.08)' }} />
              <Bar dataKey="valor" fill={COLOR_SERIE} maxBarSize={24} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false}>
                {horizontal && <LabelList dataKey="valor" position="right" fill={COLOR_TEXTO} fontSize={12} formatter={formatear} />}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default Grafico
