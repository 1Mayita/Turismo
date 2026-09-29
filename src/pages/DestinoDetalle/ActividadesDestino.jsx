import { useEffect, useState } from 'react'
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
    <section className="mb-10">
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Actividades disponibles</p>
      {cargando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-2xl bg-white" />
          <div className="h-20 animate-pulse rounded-2xl bg-white" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : actividades.length === 0 ? (
        <p className="text-slate-600">Todavía no hay actividades registradas para este destino.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actividades.map((actividad) => (
            <div key={actividad.id} className="rounded-2xl bg-white p-5 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
              <p className="font-bold text-brand-900">{actividad.nombre}</p>
              {actividad.descripcion && <p className="mt-1 text-sm text-slate-600">{actividad.descripcion}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default ActividadesDestino
