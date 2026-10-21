import { Link } from 'react-router-dom'
import { ArrowRight, BedDouble, Clock, MapPin, UtensilsCrossed } from 'lucide-react'
import BotonFavorito from './BotonFavorito.jsx'
import ImagenSegura from './ImagenSegura.jsx'
import { ResumenCalificacion } from './Estrellas.jsx'
import { useResumenCalificaciones } from '../hooks/useResumenCalificaciones.js'
import { claveDeCalificacion } from '../services/resenasService.js'

// Tarjeta con foto para un restaurante o un alojamiento. Toda la tarjeta
// lleva a su página de detalle. tipo: 'restaurante' | 'alojamiento'.
// "nivelTitulo" permite usar h3 dentro de una sección que ya tiene su h2.
function TarjetaEstablecimiento({ tipo, establecimiento, nivelTitulo: Titulo = 'h2' }) {
  const { resumen } = useResumenCalificaciones()
  const calificacion = resumen[claveDeCalificacion(tipo, establecimiento.id)]
  const esRestaurante = tipo === 'restaurante'
  const ruta = `/${esRestaurante ? 'restaurantes' : 'alojamientos'}/${establecimiento.id}`
  const IconoTipo = esRestaurante ? UtensilsCrossed : BedDouble

  return (
    <div className="group relative h-full">
      <Link
        to={ruta}
        className="flex h-full flex-col rounded-tarjeta border border-borde bg-white p-3 shadow-suave transition-shadow duration-150 hover:shadow-elevada"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-imagen bg-sal-2">
          <ImagenSegura
            src={establecimiento.imagen_principal}
            alt={establecimiento.nombre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-noche shadow-suave">
            <IconoTipo aria-hidden="true" size={14} className="text-cielo-700" />
            {esRestaurante ? 'Restaurante' : establecimiento.tipo || 'Alojamiento'}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <Titulo className="text-lg font-bold leading-snug text-noche">{establecimiento.nombre}</Titulo>
            <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} compacto className="shrink-0 pt-0.5" />
          </div>
          {esRestaurante && establecimiento.especialidad && (
            <p className="mt-1 text-sm font-bold text-cobre-texto">{establecimiento.especialidad}</p>
          )}
          {establecimiento.ubicacion && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-piedra-texto">
              <MapPin aria-hidden="true" size={16} className="shrink-0 text-piedra" /> {establecimiento.ubicacion}
            </p>
          )}
          {establecimiento.descripcion && <p className="mt-3 line-clamp-2 text-sm leading-6 text-piedra-texto">{establecimiento.descripcion}</p>}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-borde pt-3">
            <p className="flex items-center gap-1.5 text-sm text-piedra-texto">
              {esRestaurante
                ? establecimiento.horario && (
                  <>
                    <Clock aria-hidden="true" size={15} className="shrink-0 text-piedra" />
                    <span className="line-clamp-1">{establecimiento.horario}</span>
                  </>
                )
                : establecimiento.precio_noche != null && (
                  <span>
                    <span className="text-base font-bold text-noche">Bs {Number(establecimiento.precio_noche).toFixed(0)}</span> por noche
                  </span>
                )}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-cielo-700">
              Ver más
              <ArrowRight aria-hidden="true" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
      <BotonFavorito idElemento={establecimiento.id} tipo={tipo} className="absolute right-5 top-5" />
    </div>
  )
}

export default TarjetaEstablecimiento
