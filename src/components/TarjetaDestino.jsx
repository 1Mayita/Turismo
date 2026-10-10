import { Link } from 'react-router-dom'
import BotonAgregarAViaje from './BotonAgregarAViaje.jsx'
import BotonFavorito from './BotonFavorito.jsx'
import ImagenSegura from './ImagenSegura.jsx'
import InsigniaCategoria from './InsigniaCategoria.jsx'
import { ResumenCalificacion } from './Estrellas.jsx'
import { useResumenCalificaciones } from '../hooks/useResumenCalificaciones.js'

function IconoUbicacion() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

// Tarjeta reutilizable para mostrar un destino en cualquier listado (catálogo,
// departamento, destacados de inicio, favoritos). El corazón va fuera del
// enlace para no anidar un botón dentro de un <a>.
function TarjetaDestino({ destino, distanciaKm }) {
  const { resumen } = useResumenCalificaciones()
  const calificacion = resumen[destino.id]
  const Contenedor = destino.id ? Link : 'div'
  const props = destino.id ? { to: `/destinos/${destino.id}` } : {}
  const esGratis = !(Number(destino.precio_ingreso) > 0)

  return (
    <div className="group relative h-full">
      <Contenedor
        {...props}
        className="flex h-full flex-col overflow-hidden rounded-3xl cristal transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-18px_rgba(14,116,144,0.5)]"
      >
        <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-2xl bg-white/50">
          <ImagenSegura
            src={destino.imagen_principal}
            alt={destino.nombre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <InsigniaCategoria categoria={destino.categoria} className="absolute left-3 top-3 shadow-sm" />
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold leading-snug text-slate-900">{destino.nombre}</h2>
            <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} compacto className="shrink-0 pt-0.5" />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <IconoUbicacion /> {destino.ubicacion}
          </p>
          {Number.isFinite(distanciaKm) && (
            <p className="mt-1 text-xs font-medium text-brand-700">A {distanciaKm.toFixed(1)} km de tu ubicación</p>
          )}
          {destino.descripcion && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{destino.descripcion}</p>}

          <div className="mt-auto flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              {esGratis ? (
                <span className="font-semibold text-emerald-700">Entrada libre</span>
              ) : (
                <>
                  <span className="text-base font-bold text-slate-900">Bs {destino.precio_ingreso}</span> entrada
                </>
              )}
            </p>
            {destino.id && <span className="text-sm font-semibold text-brand-700 transition group-hover:translate-x-0.5">Ver más →</span>}
          </div>
        </div>
      </Contenedor>
      {destino.id && <BotonFavorito idDestino={destino.id} className="absolute right-3 top-3" />}
      {destino.id && <BotonAgregarAViaje destino={destino} variante="icono" className="absolute right-3 top-[3.75rem]" />}
    </div>
  )
}

export default TarjetaDestino
