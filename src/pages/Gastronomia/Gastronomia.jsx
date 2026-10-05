import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import { getRestaurantes } from '../../services/restaurantesService.js'

function Gastronomia() {
  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargarRestaurantes() {
      try {
        setRestaurantes(await getRestaurantes())
      } catch (errorLectura) {
        console.error('Error al consultar gastronomía en Firestore:', errorLectura)
        setError('No se pudo cargar la gastronomía típica. Inténtalo de nuevo más tarde.')
      } finally {
        setCargando(false)
      }
    }

    cargarRestaurantes()
  }, [])

  const platos = useMemo(() => {
    const porNombre = new Map()
    restaurantes.forEach((restaurante) => {
      const lista = Array.isArray(restaurante.platos_tipicos) ? restaurante.platos_tipicos : []
      lista.forEach((plato) => {
        const nombre = typeof plato === 'string' ? plato.trim() : plato?.nombre?.trim()
        if (!nombre) return
        const clave = nombre.toLocaleLowerCase('es')
        const registro = porNombre.get(clave) || { nombre, restaurantes: [] }
        registro.restaurantes.push(restaurante)
        porNombre.set(clave, registro)
      })
    })
    return [...porNombre.values()]
  }, [restaurantes])

  const platosVisibles = platos.filter(({ nombre, restaurantes: lugares }) => {
    const texto = `${nombre} ${lugares.map((lugar) => `${lugar.nombre} ${lugar.ubicacion || ''}`).join(' ')}`
    return texto.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))
  })

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Sabores de Bolivia</p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">Gastronomía típica</h1>
          <p className="mt-4 text-lg text-slate-600">
            Descubre platos tradicionales y los restaurantes donde puedes probarlos.
          </p>
        </div>

        <label className="mb-8 block max-w-xl text-sm font-semibold text-slate-700">
          Buscar un plato o lugar
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Ej.: silpancho, La Paz..."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </label>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => <div key={indice} className="h-48 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : platosVisibles.length === 0 ? (
          !error && (
            <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-lg shadow-brand-950/5">
              <p>{busqueda ? 'No encontramos platos que coincidan con tu búsqueda.' : 'Aún no hay platos típicos registrados.'}</p>
              <Link to="/restaurantes" className="mt-3 inline-block font-semibold text-brand-700 underline">Explorar restaurantes</Link>
            </div>
          )
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {platosVisibles.map(({ nombre, restaurantes: lugares }) => (
              <article key={nombre} className="rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5 ring-1 ring-brand-900/5">
                <span className="mb-4 inline-flex rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-700">Plato típico</span>
                <h2 className="text-xl font-bold text-brand-900">{nombre}</h2>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Dónde probarlo</p>
                <ul className="mt-2 space-y-2">
                  {lugares.map((lugar) => (
                    <li key={`${nombre}-${lugar.id}`} className="text-sm text-slate-700">
                      <span className="font-semibold">{lugar.nombre}</span>
                      {lugar.ubicacion && <span className="text-slate-500"> · {lugar.ubicacion}</span>}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Gastronomia
