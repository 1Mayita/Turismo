import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import BotonAgregarAViaje from './BotonAgregarAViaje.jsx'
import BotonFavorito from './BotonFavorito.jsx'
import ImagenSegura from './ImagenSegura.jsx'
import { ChipCategoria } from './ui/Chip.jsx'
import { ResumenCalificacion } from './Estrellas.jsx'
import { useResumenCalificaciones } from '../hooks/useResumenCalificaciones.js'

// Tarjeta reutilizable para mostrar un destino en cualquier listado (catálogo,
// departamento, destacados de inicio, favoritos). El corazón va fuera del
// enlace para no anidar un botón dentro de un <a>.
// "nivelTitulo" permite usar h3 cuando la tarjeta está dentro de una sección
// que ya tiene su propio h2.
function TarjetaDestino({ destino, distanciaKm, nivelTitulo: Titulo = 'h2' }) {
  const { resumen } = useResumenCalificaciones()
  const calificacion = resumen[destino.id]
  const Contenedor = destino.id ? Link : 'div'
  const props = destino.id ? { to: `/destinos/${destino.id}` } : {}
  const esGratis = !(Number(destino.precio_ingreso) > 0)

  return (
    <div className="group relative h-full">
      <Contenedor
        {...props}
        className="flex h-full flex-col rounded-tarjeta border border-borde bg-white p-3 shadow-suave transition duration-200 ease-salida hover:-translate-y-1 hover:shadow-elevada"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-imagen bg-sal-2">
          <ImagenSegura
            src={destino.imagen_principal}
            alt={destino.nombre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 ease-salida group-hover:scale-[1.04]"
          />
        </div>

        <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <Titulo className="text-lg font-bold leading-snug text-noche">{destino.nombre}</Titulo>
            <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} compacto className="shrink-0 pt-0.5" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-piedra-texto">
            <MapPin aria-hidden="true" size={16} className="shrink-0 text-piedra" /> {destino.ubicacion}
          </p>
          {Number.isFinite(distanciaKm) && (
            <p className="mt-1 text-xs font-bold text-cielo-700">A {distanciaKm.toFixed(1)} km de tu ubicación</p>
          )}
          {destino.categoria && <ChipCategoria nombre={destino.categoria} tamano="pequeno" className="mt-3 self-start" />}
          {destino.descripcion && <p className="mt-3 line-clamp-2 text-sm leading-6 text-piedra-texto">{destino.descripcion}</p>}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-borde pt-3">
            <p className="text-sm text-piedra-texto">
              {esGratis ? (
                <span className="font-bold text-emerald-700">Entrada libre</span>
              ) : (
                <>
                  <span className="text-base font-bold text-noche">Bs {destino.precio_ingreso}</span> entrada
                </>
              )}
            </p>
            {destino.id && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-cielo-700">
                Ver más
                <ArrowRight aria-hidden="true" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        </div>
      </Contenedor>
      {destino.id && <BotonFavorito idDestino={destino.id} className="absolute right-5 top-5" />}
      {destino.id && <BotonAgregarAViaje destino={destino} variante="icono" className="absolute right-5 top-[4.5rem]" />}
    </div>
  )
}

export default TarjetaDestino
