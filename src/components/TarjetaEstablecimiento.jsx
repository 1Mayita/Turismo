import { Link } from 'react-router-dom'
import { ArrowRight, BedDouble, Clock, MapPin, UtensilsCrossed } from 'lucide-react'
import BotonFavorito from './BotonFavorito.jsx'
import FondoTarjetaFoto from './ui/TarjetaFoto.jsx'
import { claseBotonFoto, claseEtiquetaFoto, claseTarjetaFoto } from './ui/estilos.js'
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
      <Link to={ruta} className={`tarjeta-hover ${claseTarjetaFoto}`}>
        <FondoTarjetaFoto src={establecimiento.imagen_principal} alt={establecimiento.nombre} />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2 pr-16">
          <span className={claseEtiquetaFoto}>
            <IconoTipo aria-hidden="true" size={14} className="text-cielo-700" />
            {esRestaurante ? 'Restaurante' : establecimiento.tipo || 'Alojamiento'}
          </span>
          <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} sobreFoto />
        </div>

        <div className="relative p-6">
          {esRestaurante && establecimiento.especialidad && (
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-atardecer">{establecimiento.especialidad}</p>
          )}
          <Titulo className="titulo-display mt-1 text-[30px] leading-tight text-white">{establecimiento.nombre}</Titulo>
          {establecimiento.ubicacion && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin aria-hidden="true" size={16} className="shrink-0" /> {establecimiento.ubicacion}
            </p>
          )}
          {esRestaurante && establecimiento.horario && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <Clock aria-hidden="true" size={15} className="shrink-0" />
              <span className="line-clamp-1">{establecimiento.horario}</span>
            </p>
          )}
          {establecimiento.descripcion && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{establecimiento.descripcion}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className={claseBotonFoto}>
              Ver más <ArrowRight aria-hidden="true" size={16} />
            </span>
            {!esRestaurante && establecimiento.precio_noche != null && (
              <p className="text-sm text-white/85">
                <span className="text-base font-bold text-white">Bs {Number(establecimiento.precio_noche).toFixed(0)}</span> por noche
              </p>
            )}
          </div>
        </div>
      </Link>
      <BotonFavorito idElemento={establecimiento.id} tipo={tipo} className="absolute right-4 top-4" />
    </div>
  )
}

export default TarjetaEstablecimiento
