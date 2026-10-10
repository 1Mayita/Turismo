import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { coordenadasValidas, formatearDuracion } from '../../utils/geo.js'
import { calcularTramos } from './utilidades.js'

const MapaRuta = lazy(() => import('../../components/mapa/MapaRuta.jsx'))

function IconoArrastrar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  )
}

function Tramo({ tramo }) {
  if (!tramo) return null
  return (
    <p className="ml-14 flex items-center gap-2 py-1 text-xs font-semibold text-slate-500">
      <span aria-hidden="true">↓</span>
      ≈ {tramo.km.toFixed(0)} km en línea recta · ~{formatearDuracion(tramo.minutos)} por tierra
    </p>
  )
}

// Una parada del itinerario. Con "editable" se puede arrastrar (mouse, dedo o
// teclado: Tab hasta el asa, Espacio para tomar, flechas y Espacio para soltar)
// y tiene botones subir/bajar/quitar como alternativa.
function Parada({ item, indice, total, tramo, editable, onMover, onQuitar }) {
  const { parada, destino } = item
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: parada.id_destino, disabled: !editable })
  const estilo = { transform: CSS.Transform.toString(transform), transition }
  const nombre = destino?.nombre || 'Destino que ya no está disponible'

  const claseBoton = 'flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-sky-100 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <li ref={setNodeRef} style={estilo} className={`relative ${isDragging ? 'z-10' : ''}`}>
      {indice > 0 && <Tramo tramo={tramo} />}
      <div className={`flex items-center gap-3 rounded-2xl p-3 cristal ${isDragging ? 'shadow-xl ring-2 ring-brand-400' : ''}`}>
      {editable && (
        <button type="button" {...attributes} {...listeners} aria-label={`Arrastrar ${nombre} para cambiar el orden`} className="flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 hover:text-brand-700 active:cursor-grabbing">
          <IconoArrastrar />
        </button>
      )}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-brand-700 text-sm font-extrabold text-white" aria-hidden="true">
        {indice + 1}
      </span>
      <ImagenSegura src={destino?.imagen_principal} alt="" className="hidden h-14 w-20 shrink-0 rounded-xl object-cover text-[0px] sm:block" />
      <div className="min-w-0 flex-1">
        {destino ? (
          <Link to={`/destinos/${destino.id}`} className="block truncate font-bold text-slate-900 hover:text-brand-700">
            <span className="sr-only">Parada {indice + 1}: </span>{nombre}
          </Link>
        ) : (
          <p className="font-bold text-slate-500">{nombre}</p>
        )}
        {destino?.ubicacion && <p className="truncate text-sm text-gray-500">{destino.ubicacion}</p>}
      </div>
      {editable && (
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${nombre}`} className={claseBoton}>↑</button>
          <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label={`Bajar ${nombre}`} className={claseBoton}>↓</button>
          <button type="button" onClick={() => onQuitar(parada.id_destino, nombre)} aria-label={`Quitar ${nombre} del viaje`} className={`${claseBoton} text-red-600 hover:bg-red-50`}>✕</button>
        </div>
      )}
      </div>
    </li>
  )
}

// Lista de paradas + mapa de la ruta + totales. Si "editable", onReordenar
// recibe la nueva lista de paradas y onQuitar el id del destino a quitar.
function Itinerario({ items, editable = false, onReordenar, onQuitar }) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const tramos = calcularTramos(items)
  const totalKm = tramos.reduce((suma, tramo) => suma + (tramo?.km || 0), 0)
  const totalMinutos = tramos.reduce((suma, tramo) => suma + (tramo?.minutos || 0), 0)
  const puntos = items
    .map(({ destino }, indice) => (destino && coordenadasValidas(destino.latitud, destino.longitud)
      ? { numero: indice + 1, nombre: destino.nombre, posicion: [Number(destino.latitud), Number(destino.longitud)] }
      : null))
    .filter(Boolean)

  function mover(desde, hasta) {
    if (hasta < 0 || hasta >= items.length) return
    onReordenar(arrayMove(items.map((item) => item.parada), desde, hasta))
  }

  function alSoltar({ active, over }) {
    if (!over || active.id === over.id) return
    const ids = items.map((item) => item.parada.id_destino)
    mover(ids.indexOf(active.id), ids.indexOf(over.id))
  }

  const lista = (
    <ol className="space-y-1">
      {items.map((item, indice) => (
        <Parada key={item.parada.id_destino} item={item} indice={indice} total={items.length} tramo={tramos[indice]} editable={editable} onMover={mover} onQuitar={onQuitar} />
      ))}
    </ol>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        {editable ? (
          <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
            <SortableContext items={items.map((item) => item.parada.id_destino)} strategy={verticalListSortingStrategy}>
              {lista}
            </SortableContext>
          </DndContext>
        ) : lista}

        {items.length > 1 && totalKm > 0 && (
          <div className="mt-4 rounded-2xl bg-brand-50 px-5 py-4 text-sm text-brand-900">
            <p className="font-bold">Recorrido total aproximado: {totalKm.toFixed(0)} km en línea recta · ~{formatearDuracion(totalMinutos)} por tierra</p>
            <p className="mt-1 text-xs text-brand-800">Es una estimación orientativa (carretera ≈ 1,3 veces la línea recta, a unos 50 km/h). Consulta horarios reales de buses y vuelos.</p>
          </div>
        )}
      </div>

      <div>
        {puntos.length === 0 ? (
          <div className="flex h-full min-h-60 items-center justify-center rounded-3xl p-6 text-center text-sm text-slate-600 cristal">
            Los destinos de este viaje todavía no tienen ubicación en el mapa.
          </div>
        ) : (
          <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/50 lg:h-full" />}>
            <MapaRuta puntos={puntos} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default Itinerario
