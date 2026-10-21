import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Car, ChevronDown, ChevronUp, GripVertical, MapPin, Route, X } from 'lucide-react'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { coordenadasValidas, formatearDuracion } from '../../utils/geo.js'
import { calcularTramos } from './utilidades.js'

const MapaRuta = lazy(() => import('../../components/mapa/MapaRuta.jsx'))

// Tramo hacia la parada siguiente, escrito junto a la línea de tiempo.
function Tramo({ tramo }) {
  if (!tramo) return null
  return (
    <p className="flex items-center gap-1.5 py-2.5 text-xs font-bold text-piedra-texto">
      <Car aria-hidden="true" size={14} className="shrink-0 text-cielo-700" />
      ≈ {tramo.km.toFixed(0)} km en línea recta · ~{formatearDuracion(tramo.minutos)} por tierra
    </p>
  )
}

// Una parada del itinerario, colgada de la línea de tiempo vertical. Con
// "editable" se puede arrastrar (mouse, dedo o teclado: Tab hasta el asa,
// Espacio para tomar, flechas y Espacio para soltar) y tiene botones
// subir/bajar/quitar como alternativa. "tramoSiguiente" es la distancia a la
// parada que sigue y se dibuja debajo de esta.
function Parada({ item, indice, total, tramoSiguiente, editable, onMover, onQuitar }) {
  const { parada, destino } = item
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: parada.id_destino, disabled: !editable })
  const estilo = { transform: CSS.Transform.toString(transform), transition }
  const nombre = destino?.nombre || 'Destino que ya no está disponible'
  const esUltima = indice === total - 1

  const claseBoton = 'flex h-11 w-11 items-center justify-center rounded-control border border-borde bg-white text-noche transition hover:bg-cielo disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <li ref={setNodeRef} style={estilo} className={`relative grid grid-cols-[2.5rem_1fr] gap-x-3 ${isDragging ? 'z-10' : ''}`}>
      {/* Número y tramo de línea hasta la parada siguiente. */}
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className="mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-noche text-sm font-extrabold text-white ring-4 ring-sal">
          {indice + 1}
        </span>
        {!esUltima && <span className="w-0.5 flex-1 bg-cielo-600/40" />}
      </div>

      <div className="min-w-0">
        <div className={`flex flex-wrap items-center gap-3 rounded-tarjeta border border-borde bg-white p-3 shadow-suave ${isDragging ? 'shadow-elevada ring-2 ring-cielo-600' : ''}`}>
          {editable && (
            <button type="button" {...attributes} {...listeners} aria-label={`Arrastrar ${nombre} para cambiar el orden`} className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-piedra hover:text-noche active:cursor-grabbing">
              <GripVertical aria-hidden="true" />
            </button>
          )}
          <ImagenSegura src={destino?.imagen_principal} alt="" className="hidden h-14 w-20 shrink-0 rounded-control object-cover text-[0px] sm:block" />
          <div className="min-w-0 flex-1 basis-40">
            {destino ? (
              <Link to={`/destinos/${destino.id}`} className="block truncate font-bold text-noche hover:text-cielo-700">
                <span className="sr-only">Parada {indice + 1}: </span>{nombre}
              </Link>
            ) : (
              <p className="font-bold text-piedra-texto">{nombre}</p>
            )}
            {destino?.ubicacion && (
              <p className="flex items-center gap-1 truncate text-sm text-piedra-texto">
                <MapPin aria-hidden="true" size={14} className="shrink-0 text-piedra" /> {destino.ubicacion}
              </p>
            )}
          </div>
          {editable && (
            <div className="ml-auto flex shrink-0 gap-1.5">
              <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${nombre}`} className={claseBoton}>
                <ChevronUp aria-hidden="true" size={18} />
              </button>
              <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={esUltima} aria-label={`Bajar ${nombre}`} className={claseBoton}>
                <ChevronDown aria-hidden="true" size={18} />
              </button>
              <button type="button" onClick={() => onQuitar(parada.id_destino, nombre)} aria-label={`Quitar ${nombre} del viaje`} className={`${claseBoton} text-red-700 hover:bg-red-50`}>
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          )}
        </div>
        {esUltima ? <div className="h-2" /> : <Tramo tramo={tramoSiguiente} />}
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
    <ol aria-label="Paradas del viaje, en orden">
      {items.map((item, indice) => (
        <Parada key={item.parada.id_destino} item={item} indice={indice} total={items.length} tramoSiguiente={tramos[indice + 1]} editable={editable} onMover={mover} onQuitar={onQuitar} />
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
          <div className="mt-4 rounded-tarjeta border border-borde bg-cielo/50 px-5 py-4 text-sm text-noche">
            <p className="flex items-start gap-2 font-bold">
              <Route aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-atardecer-700" />
              Recorrido total aproximado: {totalKm.toFixed(0)} km en línea recta · ~{formatearDuracion(totalMinutos)} por tierra
            </p>
            <p className="mt-1 pl-[26px] text-xs text-noche/75">Es una estimación orientativa (carretera ≈ 1,3 veces la línea recta, a unos 50 km/h). Consulta horarios reales de buses y vuelos.</p>
          </div>
        )}
      </div>

      <div>
        {puntos.length === 0 ? (
          <div className="flex h-full min-h-60 items-center justify-center rounded-tarjeta border border-dashed border-borde bg-sal-2/60 p-6 text-center text-sm text-piedra-texto">
            Los destinos de este viaje todavía no tienen ubicación en el mapa.
          </div>
        ) : (
          <Suspense fallback={<div className="h-80 animate-pulse rounded-tarjeta bg-sal-2 lg:h-full" />}>
            <MapaRuta puntos={puntos} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default Itinerario
