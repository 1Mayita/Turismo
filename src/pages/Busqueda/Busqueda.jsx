import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import { getAlojamientos } from '../../services/alojamientosService.js'
import { getActividades } from '../../services/actividadesService.js'
import { getDestinos } from '../../services/destinosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'

const TIPOS = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'destino', etiqueta: 'Destinos' },
  { id: 'actividad', etiqueta: 'Actividades' },
  { id: 'restaurante', etiqueta: 'Restaurantes' },
  { id: 'alojamiento', etiqueta: 'Alojamientos' },
]

function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

function coinciden(registro, texto) {
  return normalizar(texto).split(/\s+/).filter(Boolean).every((termino) =>
    normalizar(registro.texto).includes(termino))
}

function crearResultados({ destinos, actividades, restaurantes, alojamientos }) {
  const nombreDestino = new Map(destinos.map((destino) => [destino.id, destino.nombre]))
  const textoPlatos = (restaurante) => Array.isArray(restaurante.platos_tipicos)
    ? restaurante.platos_tipicos.join(' ')
    : restaurante.platos_tipicos || ''
  return [
    ...destinos.map((destino) => ({
      id: `destino-${destino.id}`,
      tipo: 'destino',
      titulo: destino.nombre,
      descripcion: destino.descripcion || '',
      ubicacion: destino.ubicacion || destino.direccion || '',
      texto: `${destino.nombre} ${destino.descripcion} ${destino.ubicacion} ${destino.direccion} ${destino.categoria}`,
      enlace: `/destinos/${destino.id}`,
      accion: 'Ver destino',
    })),
    ...actividades.map((actividad) => ({
      id: `actividad-${actividad.id}`,
      tipo: 'actividad',
      titulo: actividad.nombre,
      descripcion: actividad.descripcion || '',
      ubicacion: nombreDestino.get(actividad.id_destino) || '',
      texto: `${actividad.nombre} ${actividad.descripcion} ${nombreDestino.get(actividad.id_destino) || ''}`,
      enlace: actividad.id_destino ? `/destinos/${actividad.id_destino}` : '/destinos',
      accion: actividad.id_destino ? 'Ver destino' : 'Explorar destinos',
    })),
    ...restaurantes.map((restaurante) => ({
      id: `restaurante-${restaurante.id}`,
      tipo: 'restaurante',
      titulo: restaurante.nombre,
      descripcion: [restaurante.especialidad, restaurante.horario].filter(Boolean).join(' · '),
      ubicacion: restaurante.ubicacion || restaurante.direccion || '',
      texto: `${restaurante.nombre} ${restaurante.especialidad} ${restaurante.horario} ${restaurante.ubicacion} ${restaurante.direccion} ${textoPlatos(restaurante)}`,
      enlace: '/restaurantes',
      accion: 'Ver restaurantes',
    })),
    ...alojamientos.map((alojamiento) => ({
      id: `alojamiento-${alojamiento.id}`,
      tipo: 'alojamiento',
      titulo: alojamiento.nombre,
      descripcion: [alojamiento.tipo, alojamiento.precio_noche != null ? `Bs ${alojamiento.precio_noche} por noche` : ''].filter(Boolean).join(' · '),
      ubicacion: alojamiento.ubicacion || alojamiento.direccion || '',
      texto: `${alojamiento.nombre} ${alojamiento.tipo} ${alojamiento.ubicacion} ${alojamiento.direccion}`,
      enlace: '/alojamientos',
      accion: 'Ver alojamientos',
    })),
  ]
}

function Busqueda() {
  const [parametros] = useSearchParams()
  const consulta = parametros.get('buscar')?.trim() || ''
  const [resultadosBase, setResultadosBase] = useState([])
  const [tipoActivo, setTipoActivo] = useState('todos')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      setCargando(true)
      setError('')
      try {
        const [destinos, actividades, restaurantes, alojamientos] = await Promise.all([
          getDestinos(),
          getActividades(),
          getRestaurantes(),
          getAlojamientos(),
        ])
        if (activo) setResultadosBase(crearResultados({ destinos, actividades, restaurantes, alojamientos }))
      } catch (errorLectura) {
        console.error('Error al consultar catálogos para la búsqueda global:', errorLectura)
        if (activo) {
          setResultadosBase([])
          setError('No se pudo completar la búsqueda. Inténtalo de nuevo más tarde.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarCatalogos()
    return () => { activo = false }
  }, [])

  const coincidencias = useMemo(
    () => consulta ? resultadosBase.filter((resultado) => coinciden(resultado, consulta)) : [],
    [consulta, resultadosBase],
  )
  const resultados = coincidencias.filter((resultado) => tipoActivo === 'todos' || resultado.tipo === tipoActivo)
  const cantidades = TIPOS.reduce((conteo, tipo) => {
    conteo[tipo.id] = tipo.id === 'todos'
      ? coincidencias.length
      : coincidencias.filter((resultado) => resultado.tipo === tipo.id).length
    return conteo
  }, {})

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Explora Bolivia</p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">Resultados de búsqueda</h1>
          {consulta ? (
            <p className="mt-4 text-lg text-slate-600">
              Coincidencias para <span className="font-semibold text-brand-900">“{consulta}”</span> en destinos, actividades, restaurantes y alojamientos.
            </p>
          ) : (
            <p className="mt-4 text-lg text-slate-600">Busca destinos, actividades, restaurantes y alojamientos desde el buscador superior.</p>
          )}
        </div>

        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {consulta && (
          <div className="mb-7 flex flex-wrap gap-2" aria-label="Filtrar resultados por categoría">
            {TIPOS.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                aria-pressed={tipoActivo === tipo.id}
                onClick={() => setTipoActivo(tipo.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tipoActivo === tipo.id
                    ? 'bg-brand-800 text-white shadow-md shadow-brand-900/15'
                    : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
                }`}
              >
                {tipo.etiqueta} <span className={tipoActivo === tipo.id ? 'text-white/70' : 'text-slate-500'}>({cantidades[tipo.id]})</span>
              </button>
            ))}
          </div>
        )}

        {cargando ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => <div key={indice} className="h-48 animate-pulse rounded-2xl bg-white shadow-sm" />)}
          </div>
        ) : !consulta ? (
          <div className="rounded-2xl bg-white p-7 shadow-lg shadow-brand-950/5">
            <p className="text-slate-600">Prueba con el nombre de un lugar, una actividad o un servicio turístico.</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="rounded-2xl bg-white p-7 shadow-lg shadow-brand-950/5">
            <p className="font-semibold text-brand-900">No encontramos resultados en esta categoría.</p>
            <p className="mt-1 text-sm text-slate-600">Prueba otra palabra o cambia el filtro de categoría.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-slate-500">{resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((resultado) => (
                <article key={resultado.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5 ring-1 ring-brand-900/5 transition hover:-translate-y-0.5 hover:shadow-xl">
                  <span className="mb-4 w-fit rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
                    {TIPOS.find((tipo) => tipo.id === resultado.tipo)?.etiqueta}
                  </span>
                  <h2 className="text-xl font-bold text-brand-900">{resultado.titulo}</h2>
                  {resultado.ubicacion && <p className="mt-2 text-sm font-medium text-brand-700">📍 {resultado.ubicacion}</p>}
                  {resultado.descripcion && <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{resultado.descripcion}</p>}
                  <Link
                    to={resultado.tipo === 'restaurante' || resultado.tipo === 'alojamiento'
                      ? `${resultado.enlace}?buscar=${encodeURIComponent(consulta)}`
                      : resultado.enlace}
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900"
                  >
                    {resultado.accion}<span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Busqueda
