import { useEffect, useState } from 'react'
import { Mountain } from 'lucide-react'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import TituloSeccion from '../../components/ui/TituloSeccion.jsx'
import { getActividadesPorDestino } from '../../services/actividadesService.js'

function ActividadesDestino({ idDestino }) {
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarActividades() {
      try {
        setActividades(await getActividadesPorDestino(idDestino))
      } catch (errorLectura) {
        console.error('Error al consultar actividades del destino:', errorLectura)
        setError('No se pudieron cargar las actividades de este destino.')
      } finally {
        setCargando(false)
      }
    }

    cargarActividades()
  }, [idDestino])

  return (
    <section className="mb-14" aria-labelledby="titulo-actividades">
      <TituloSeccion id="titulo-actividades">Actividades disponibles</TituloSeccion>
      {cargando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-tarjeta bg-sal-2" />
          <div className="h-20 animate-pulse rounded-tarjeta bg-sal-2" />
        </div>
      ) : error ? (
        <p className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : actividades.length === 0 ? (
        <p className="rounded-control bg-sal-2 px-4 py-3 text-sm text-piedra-texto">Todavía no hay actividades registradas para este destino.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actividades.map((actividad) => (
            <li key={actividad.id} className="relative flex gap-3 rounded-tarjeta border border-borde bg-white p-4 pr-16 shadow-suave">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true">
                <Mountain />
              </span>
              <div>
                <h3 className="font-bold text-noche">{actividad.nombre}</h3>
                {actividad.descripcion && <p className="mt-1 text-sm text-piedra-texto">{actividad.descripcion}</p>}
              </div>
              <BotonFavorito idElemento={actividad.id} tipo="actividad" className="absolute right-3 top-3" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ActividadesDestino
