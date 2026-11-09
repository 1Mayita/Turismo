import { useId, useState } from 'react'
import { Check, Plus, Search, Soup, X } from 'lucide-react'
import ImagenSegura from './ImagenSegura.jsx'
import { claseControl } from './ui/estilos.js'
import { coincideConBusqueda } from '../utils/texto.js'

// Selector múltiple de platos típicos del catálogo, con búsqueda por nombre.
// Guarda ids, nunca texto libre: así el restaurante queda relacionado con el
// plato y aparece en su ficha de "¿Dónde puedes probarlo?".
//   platos: catálogo [{ id, nombre, imagen, origen }]
//   seleccionados: [ids]   onChange(ids)
//   onPlatoFaltante(textoBuscado): qué hacer si el plato no está en el catálogo
//     (ir a registrarlo). Opcional.
//   preguntaFaltante / textoFaltante: textos de esa opción.
function SelectorPlatos({ platos, seleccionados, onChange, onPlatoFaltante, preguntaFaltante = '¿No está el plato que quieres registrar?', textoFaltante = 'Registrar nuevo plato', maximo = 60, etiqueta = 'Platos típicos que ofrece' }) {
  const [busqueda, setBusqueda] = useState('')
  const idLista = useId()
  const elegidos = new Set(seleccionados)
  const porId = new Map(platos.map((plato) => [plato.id, plato]))
  const visibles = platos
    .filter((plato) => coincideConBusqueda([plato.nombre, plato.origen], busqueda))
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))

  function alternar(id) {
    if (elegidos.has(id)) onChange(seleccionados.filter((otro) => otro !== id))
    else if (seleccionados.length < maximo) onChange([...seleccionados, id])
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 block text-sm font-bold text-noche">{etiqueta}</legend>
      <p className="mb-3 text-xs text-piedra-texto">Elige del catálogo los platos que se sirven aquí. {seleccionados.length > 0 && <strong className="text-noche">{seleccionados.length} seleccionados.</strong>}</p>

      {/* Seleccionados: se pueden quitar antes de guardar. */}
      {seleccionados.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2" aria-label="Platos seleccionados">
          {seleccionados.map((id) => (
            <li key={id} className="inline-flex animate-entrar items-center gap-1.5 rounded-full bg-cielo py-1 pl-3 pr-1 text-sm font-bold text-noche">
              {porId.get(id)?.nombre || 'Plato no disponible'}
              <button type="button" onClick={() => alternar(id)} aria-label={`Quitar ${porId.get(id)?.nombre || 'plato'}`} className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white">
                <X aria-hidden="true" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-control border border-borde bg-white">
        <div className="relative border-b border-borde">
          <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-piedra" />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar plato por nombre..."
            aria-controls={idLista}
            className={`${claseControl} rounded-none border-0 pl-10 text-sm focus:ring-0`}
          />
        </div>
        <ul id={idLista} className="max-h-64 overflow-y-auto p-1.5" aria-label="Catálogo de platos típicos">
          {visibles.map((plato) => {
            const marcado = elegidos.has(plato.id)
            return (
              <li key={plato.id}>
                <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors ${marcado ? 'bg-cielo/60' : 'hover:bg-sal-2'}`}>
                  <input type="checkbox" checked={marcado} onChange={() => alternar(plato.id)} className="sr-only" />
                  <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${marcado ? 'border-noche bg-noche text-white' : 'border-borde bg-white'}`}>
                    {marcado && <Check size={13} strokeWidth={3} />}
                  </span>
                  {plato.imagen
                    ? <ImagenSegura src={plato.imagen} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                    : <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sal-2 text-piedra"><Soup size={16} /></span>}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-noche">{plato.nombre}</span>
                    {plato.origen && <span className="block truncate text-xs text-piedra-texto">{plato.origen}</span>}
                  </span>
                </label>
              </li>
            )
          })}
          {visibles.length === 0 && (
            <li className="px-3 py-5 text-center text-sm text-piedra-texto">No hay platos con “{busqueda}” en el catálogo.</li>
          )}
        </ul>
        {onPlatoFaltante && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde bg-sal px-3 py-2.5">
            <span className="text-sm text-piedra-texto">{preguntaFaltante}</span>
            <button
              type="button"
              onClick={() => onPlatoFaltante(busqueda.trim())}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-control px-3 text-sm font-bold text-cielo-700 transition hover:bg-white"
            >
              <Plus aria-hidden="true" size={16} /> {textoFaltante}
            </button>
          </div>
        )}
      </div>
    </fieldset>
  )
}

export default SelectorPlatos
