import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import BotonAgregarAViaje from './BotonAgregarAViaje.jsx'
import BotonFavorito from './BotonFavorito.jsx'
import FondoTarjetaFoto from './ui/TarjetaFoto.jsx'
import { claseBotonFoto, claseTarjetaFoto } from './ui/estilos.js'
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
      <Contenedor {...props} className={`tarjeta-hover ${claseTarjetaFoto}`}>
        <FondoTarjetaFoto src={destino.imagen_principal} alt={destino.nombre} />
        {/* Arriba: categoría y calificación (el corazón y la maleta van a la derecha). */}
        <div className="absolute left-4 right-16 top-4 flex flex-wrap items-center gap-2">
          {destino.categoria && <ChipCategoria nombre={destino.categoria} tamano="pequeno" className="shadow-suave" />}
          <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} sobreFoto />
        </div>

        <div className="relative p-6">
          <Titulo className="titulo-display text-[30px] leading-tight text-white">{destino.nombre}</Titulo>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin aria-hidden="true" size={16} className="shrink-0" /> {destino.ubicacion}
          </p>
          {Number.isFinite(distanciaKm) && (
            <p className="mt-1 text-xs font-bold text-white/85">A {distanciaKm.toFixed(1)} km de tu ubicación</p>
          )}
          {destino.descripcion && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{destino.descripcion}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {destino.id && (
              <span className={claseBotonFoto}>
                Ver más <ArrowRight aria-hidden="true" size={16} />
              </span>
            )}
            <p className="text-sm text-white/85">
              {esGratis ? (
                <span className="font-bold text-white">Entrada libre</span>
              ) : (
                <>
                  <span className="text-base font-bold text-white">Bs {destino.precio_ingreso}</span> entrada
                </>
              )}
            </p>
          </div>
        </div>
      </Contenedor>
      {destino.id && <BotonFavorito idDestino={destino.id} className="absolute right-4 top-4" />}
      {destino.id && <BotonAgregarAViaje destino={destino} variante="icono" className="absolute right-4 top-[4.25rem]" />}
    </div>
  )
}

export default TarjetaDestino
