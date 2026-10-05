import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import { ResumenCalificacion } from '../../components/Estrellas.jsx'
import { getRestaurantes } from '../../services/restaurantesService.js'

function Restaurantes() {
  const [parametros] = useSearchParams()
  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState(parametros.get('buscar') || '')

  useEffect(() => {
    setBusqueda(parametros.get('buscar') || '')
  }, [parametros])

  useEffect(() => {
    async function cargarRestaurantes() {
      try {
        setRestaurantes(await getRestaurantes())
      } catch (errorLectura) {
        console.error('Error al consultar restaurantes en Firestore:', errorLectura)
        setError('No se pudieron cargar los restaurantes. Inténtalo de nuevo más tarde.')
      } finally {
        setCargando(false)
      }
    }

    cargarRestaurantes()
  }, [])

  const restaurantesVisibles = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase('es')
    if (!consulta) return restaurantes
    return restaurantes.filter((restaurante) => [
      restaurante.nombre,
      restaurante.ubicacion,
      restaurante.direccion,
      restaurante.especialidad,
      ...(Array.isArray(restaurante.platos_tipicos) ? restaurante.platos_tipicos : []),
    ].some((valor) => String(valor || '').toLocaleLowerCase('es').includes(consulta)))
  }, [busqueda, restaurantes])

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Sabores locales</p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">Restaurantes</h1>
          <p className="mt-4 text-lg text-slate-600">Encuentra dónde comer y conoce su especialidad, horarios y ubicación.</p>
        </div>

        <label className="mb-8 block max-w-xl text-sm font-semibold text-slate-700">
          Buscar por nombre, ubicación o especialidad
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Ej.: comida tradicional, Sucre..."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </label>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => <div key={indice} className="h-56 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : restaurantesVisibles.length === 0 ? (
          !error && <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">{busqueda ? 'No hay restaurantes que coincidan con tu búsqueda.' : 'Aún no hay restaurantes registrados.'}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantesVisibles.map((restaurante) => (
              <article key={restaurante.id} className="relative rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5 ring-1 ring-brand-900/5">
                <div className="mb-4 flex items-start justify-between gap-3 pr-12">
                  <h2 className="text-xl font-bold text-brand-900">{restaurante.nombre}</h2>
                  <ResumenCalificacion promedio={Number(restaurante.promedio_valoracion) || 0} total={Number(restaurante.total_valoraciones) || 0} />
                </div>
                <BotonFavorito idElemento={restaurante.id} tipo="restaurante" className="absolute right-4 top-4" />
                {restaurante.especialidad && (
                  <p className="mb-3 rounded-lg bg-accent-50 px-3 py-2 text-sm font-semibold text-accent-700">{restaurante.especialidad}</p>
                )}
                <dl className="space-y-2 text-sm text-slate-600">
                  {(restaurante.ubicacion || restaurante.direccion) && (
                    <div><dt className="inline font-bold text-brand-800">Ubicación: </dt><dd className="inline">{[restaurante.ubicacion, restaurante.direccion].filter(Boolean).join(' · ')}</dd></div>
                  )}
                  {restaurante.horario && <div><dt className="inline font-bold text-brand-800">Horario: </dt><dd className="inline">{restaurante.horario}</dd></div>}
                  {restaurante.telefono && <div><dt className="inline font-bold text-brand-800">Teléfono: </dt><dd className="inline">{restaurante.telefono}</dd></div>}
                </dl>
                {Array.isArray(restaurante.platos_tipicos) && restaurante.platos_tipicos.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Platos típicos</p>
                    <ul className="flex flex-wrap gap-2">
                      {restaurante.platos_tipicos.map((plato) => <li key={plato} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">{plato}</li>)}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Restaurantes
