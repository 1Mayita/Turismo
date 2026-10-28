import { useState } from 'react'
import { ALTO_MAPA, ANCHO_MAPA, DEPARTAMENTOS_MAPA, proyectar } from './boliviaSvg.js'

// Color de cada departamento según su región (DESIGN.md §6.1): altiplano en
// tonos sal y cielo, valles en arena y tierras bajas en verde suave.
const COLOR_REGION = {
  'la-paz': '#e9e7ef',
  oruro: '#eeecf2',
  potosi: '#f2f0f4',
  cochabamba: '#f1dccb',
  chuquisaca: '#f4e3d4',
  tarija: '#efd7c3',
  beni: '#cbd5e2',
  pando: '#c6d1df',
  'santa-cruz': '#d0d9e5',
}

const ACTIVO = '#7d93c8'
const RELIEVE = 5

// Mapa 2D de Bolivia por departamentos. Al pasar el mouse un departamento se
// eleva y se pinta de azul crepúsculo con su nombre y cantidad de destinos; al
// tocarlo llama a alElegir(id). Para teclado, quien lo usa debe ofrecer una
// lista de departamentos que haga lo mismo (el mapa es un apoyo visual).
function MapaBolivia2D({ cantidades = {}, idActivo = '', alElegir, pines = [], className = '' }) {
  const [idSobre, setIdSobre] = useState('')
  const resaltado = DEPARTAMENTOS_MAPA.find((departamento) => departamento.id === (idSobre || idActivo))
  const salar = proyectar(-20.13, -67.49)
  const lago = proyectar(-16.05, -69.05)

  // El departamento resaltado se dibuja al final para que quede encima.
  const ordenados = [...DEPARTAMENTOS_MAPA].sort((a, b) => Number(a.id === resaltado?.id) - Number(b.id === resaltado?.id))

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`-20 -20 ${ANCHO_MAPA + 40} ${ALTO_MAPA + 50}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Mapa de Bolivia con sus nueve departamentos"
        onMouseLeave={() => setIdSobre('')}
      >
        <defs>
          <radialGradient id="brillo-salar">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#dce6ee" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Sombra de relieve: la silueta completa, desplazada hacia abajo. */}
        <g transform={`translate(0 ${RELIEVE})`} aria-hidden="true">
          {DEPARTAMENTOS_MAPA.map((departamento) => (
            <path key={departamento.id} d={departamento.d} fill="#0e2233" fillOpacity="0.12" />
          ))}
        </g>

        {ordenados.map((departamento) => {
          const esResaltado = departamento.id === resaltado?.id
          return (
            <path
              key={departamento.id}
              data-departamento={departamento.id}
              d={departamento.d}
              fill={esResaltado ? ACTIVO : COLOR_REGION[departamento.id]}
              stroke="#f8f9fb"
              strokeWidth="3"
              strokeLinejoin="round"
              transform={esResaltado ? 'translate(0 -4)' : undefined}
              className="cursor-pointer transition-[fill,transform] duration-200 ease-out"
              style={esResaltado ? { filter: 'drop-shadow(0 5px 6px rgb(14 34 51 / 0.12))' } : undefined}
              onMouseEnter={() => setIdSobre(departamento.id)}
              onClick={() => alElegir?.(departamento.id)}
            />
          )
        })}

        {/* Salar de Uyuni y lago Titicaca, como referencia. */}
        <ellipse cx={salar[0]} cy={salar[1]} rx="34" ry="26" fill="url(#brillo-salar)" stroke="#dce6ee" strokeWidth="1.5" pointerEvents="none" />
        <ellipse cx={lago[0]} cy={lago[1]} rx="26" ry="11" transform={`rotate(-38 ${lago[0]} ${lago[1]})`} fill="#9cc3e0" fillOpacity="0.85" pointerEvents="none" />

        {pines.map((pin) => {
          const [x, y] = proyectar(pin.latitud, pin.longitud)
          return (
            <g key={pin.id} pointerEvents="none">
              <circle cx={x} cy={y} r="11" fill="#ffffff" />
              <circle cx={x} cy={y} r="6.5" fill="#1a3c62" />
            </g>
          )
        })}
      </svg>

      {resaltado && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-control bg-noche px-3 py-2 text-center text-white shadow-elevada ring-1 ring-white/20"
          style={{
            left: `${((resaltado.centro[0] + 20) / (ANCHO_MAPA + 40)) * 100}%`,
            top: `${((resaltado.centro[1] + 20 - 24) / (ALTO_MAPA + 50)) * 100}%`,
          }}
        >
          <p className="whitespace-nowrap text-sm font-bold">{resaltado.nombre}</p>
          <p className="whitespace-nowrap text-xs text-admin-muted">
            {cantidades[resaltado.id] ? `${cantidades[resaltado.id]} ${cantidades[resaltado.id] === 1 ? 'destino' : 'destinos'}` : 'Ver el departamento'}
          </p>
        </div>
      )}
    </div>
  )
}

export default MapaBolivia2D
