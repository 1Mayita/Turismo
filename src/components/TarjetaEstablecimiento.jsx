import { Link } from 'react-router-dom'
import BotonFavorito from './BotonFavorito.jsx'
import ImagenSegura from './ImagenSegura.jsx'
import { ResumenCalificacion } from './Estrellas.jsx'
import { useResumenCalificaciones } from '../hooks/useResumenCalificaciones.js'
import { claveDeCalificacion } from '../services/resenasService.js'

// Tarjeta con foto para un restaurante o un alojamiento. Toda la tarjeta
// lleva a su página de detalle. tipo: 'restaurante' | 'alojamiento'.
function TarjetaEstablecimiento({ tipo, establecimiento }) {
  const { resumen } = useResumenCalificaciones()
  const calificacion = resumen[claveDeCalificacion(tipo, establecimiento.id)]
  const esRestaurante = tipo === 'restaurante'
  const ruta = `/${esRestaurante ? 'restaurantes' : 'alojamientos'}/${establecimiento.id}`

  return (
    <div className="group relative h-full">
      <Link
        to={ruta}
        className="flex h-full flex-col overflow-hidden rounded-3xl cristal transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-18px_rgba(14,116,144,0.5)]"
      >
        <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-2xl bg-white/50">
          <ImagenSegura
            src={establecimiento.imagen_principal}
            alt={establecimiento.nombre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm">
            {esRestaurante ? 'Restaurante' : establecimiento.tipo || 'Alojamiento'}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold leading-snug text-slate-900">{establecimiento.nombre}</h2>
            <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} compacto className="shrink-0 pt-0.5" />
          </div>
          {esRestaurante && establecimiento.especialidad && (
            <p className="mt-1 text-sm font-semibold text-accent-600">{establecimiento.especialidad}</p>
          )}
          {establecimiento.ubicacion && <p className="mt-1 text-sm text-gray-500">{establecimiento.ubicacion}</p>}
          {establecimiento.descripcion && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{establecimiento.descripcion}</p>}

          <div className="mt-auto flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              {esRestaurante
                ? establecimiento.horario
                : establecimiento.precio_noche != null && (
                  <>
                    <span className="text-base font-bold text-slate-900">Bs {Number(establecimiento.precio_noche).toFixed(0)}</span> por noche
                  </>
                )}
            </p>
            <span className="shrink-0 text-sm font-semibold text-brand-700 transition group-hover:translate-x-0.5">Ver más →</span>
          </div>
        </div>
      </Link>
      <BotonFavorito idElemento={establecimiento.id} tipo={tipo} className="absolute right-5 top-5" />
    </div>
  )
}

export default TarjetaEstablecimiento
