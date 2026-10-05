import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import { getAlojamientos } from '../../services/alojamientosService.js'

function Alojamientos() {
  const [parametros] = useSearchParams()
  const [alojamientos, setAlojamientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState(parametros.get('buscar') || '')

  useEffect(() => {
    setBusqueda(parametros.get('buscar') || '')
  }, [parametros])

  useEffect(() => {
    async function cargarAlojamientos() {
      try {
        setAlojamientos(await getAlojamientos())
      } catch (errorLectura) {
        console.error('Error al consultar alojamientos en Firestore:', errorLectura)
        setError('No se pudieron cargar los alojamientos. Inténtalo de nuevo más tarde.')
      } finally {
        setCargando(false)
      }
    }

    cargarAlojamientos()
  }, [])

  const alojamientosVisibles = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase('es')
    if (!consulta) return alojamientos
    return alojamientos.filter((alojamiento) => [
      alojamiento.nombre,
      alojamiento.ubicacion,
      alojamiento.direccion,
      alojamiento.tipo,
    ].some((valor) => String(valor || '').toLocaleLowerCase('es').includes(consulta)))
  }, [alojamientos, busqueda])

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Planifica tu estadía</p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">Hoteles y alojamientos</h1>
          <p className="mt-4 text-lg text-slate-600">Consulta opciones de hospedaje, ubicación y precio por noche.</p>
        </div>

        <label className="mb-8 block max-w-xl text-sm font-semibold text-slate-700">
          Buscar por nombre, ubicación o tipo
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Ej.: hostal, Uyuni..."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </label>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => <div key={indice} className="h-52 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : alojamientosVisibles.length === 0 ? (
          !error && <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">{busqueda ? 'No hay alojamientos que coincidan con tu búsqueda.' : 'Aún no hay alojamientos registrados.'}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {alojamientosVisibles.map((alojamiento) => (
              <article key={alojamiento.id} className="relative rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5 ring-1 ring-brand-900/5">
                <div className="flex items-start justify-between gap-3 pr-12">
                  <div>
                    {alojamiento.tipo && <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent-700">{alojamiento.tipo}</p>}
                    <h2 className="text-xl font-bold text-brand-900">{alojamiento.nombre}</h2>
                  </div>
                  {alojamiento.precio_noche != null && (
                    <p className="whitespace-nowrap rounded-xl bg-brand-100 px-3 py-2 text-sm font-bold text-brand-800">
                      Bs {Number(alojamiento.precio_noche).toFixed(2)} <span className="font-normal">/ noche</span>
                    </p>
                  )}
                </div>
                <BotonFavorito idElemento={alojamiento.id} tipo="alojamiento" className="absolute right-4 top-4" />
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  {(alojamiento.ubicacion || alojamiento.direccion) && (
                    <div><dt className="inline font-bold text-brand-800">Ubicación: </dt><dd className="inline">{[alojamiento.ubicacion, alojamiento.direccion].filter(Boolean).join(' · ')}</dd></div>
                  )}
                  {alojamiento.telefono && <div><dt className="inline font-bold text-brand-800">Teléfono: </dt><dd className="inline">{alojamiento.telefono}</dd></div>}
                </dl>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Alojamientos
