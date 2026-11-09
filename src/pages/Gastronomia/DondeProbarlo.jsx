import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, LocateFixed, Map as IconoMapa, MapPin, Navigation, Store } from 'lucide-react'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { claseBoton } from '../../components/ui/estilos.js'
import { getRestaurantesConPlato } from '../../services/restaurantesService.js'
import { coordenadasValidas, distanciaEnKm, obtenerUbicacionDelUsuario } from '../../utils/geo.js'

const MapaPuntos = lazy(() => import('../../components/mapa/MapaPuntos.jsx'))

function textoDistancia(km) {
  if (km === null || km === undefined) return ''
  return km < 1 ? `a ${Math.round(km * 1000)} m` : `a ${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

// "¿Dónde puedes probarlo?": los restaurantes que ofrecen el plato según la
// relación restaurante ↔ plato (por id). Se consulta cada vez que se abre la
// ficha, así refleja al instante los cambios en la lista de un restaurante.
function DondeProbarlo({ plato, departamentos, municipios }) {
  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ubicacion, setUbicacion] = useState(null)
  const [estadoUbicacion, setEstadoUbicacion] = useState('') // '' | 'buscando' | mensaje de error
  const [verMapa, setVerMapa] = useState(false)

  useEffect(() => {
    let activo = true
    getRestaurantesConPlato(plato)
      .then((lista) => {
        if (activo) setRestaurantes(lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es')))
      })
      .catch((errorLectura) => {
        console.error('Error al buscar restaurantes del plato:', errorLectura)
        if (activo) setError('No pudimos consultar los restaurantes. Revisa tu conexión.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [plato])

  async function ordenarPorCercania() {
    setEstadoUbicacion('buscando')
    try {
      setUbicacion(await obtenerUbicacionDelUsuario())
      setEstadoUbicacion('')
    } catch (errorUbicacion) {
      setEstadoUbicacion(errorUbicacion.message)
    }
  }

  const nombreDe = (lista, id) => lista.find((item) => item.id === id)?.nombre
  const conDistancia = restaurantes.map((restaurante) => ({
    restaurante,
    km: ubicacion ? distanciaEnKm(ubicacion, restaurante) : null,
  }))
  // Con ubicación: primero los más cercanos; los que no tienen coordenadas, al final.
  if (ubicacion) conDistancia.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
  const conMapa = restaurantes.filter((restaurante) => coordenadasValidas(restaurante.latitud, restaurante.longitud))

  return (
    <section aria-labelledby="donde-probarlo">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="donde-probarlo" className="titulo-display text-[28px] leading-tight">¿Dónde puedes probarlo?</h3>
          {!cargando && restaurantes.length > 0 && (
            <p className="text-sm text-piedra-texto">{restaurantes.length} {restaurantes.length === 1 ? 'restaurante lo ofrece' : 'restaurantes lo ofrecen'}</p>
          )}
        </div>
        {restaurantes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {conMapa.length > 0 && (
              <button type="button" onClick={() => setVerMapa(!verMapa)} aria-pressed={verMapa} className={claseBoton('secundario', 'pequeno')}>
                <IconoMapa aria-hidden="true" size={16} /> {verMapa ? 'Ocultar mapa' : 'Ver en el mapa'}
              </button>
            )}
            {restaurantes.length > 1 && conMapa.length > 0 && (
              <button type="button" onClick={ordenarPorCercania} disabled={estadoUbicacion === 'buscando'} className={claseBoton('secundario', 'pequeno')}>
                <LocateFixed aria-hidden="true" size={16} /> {estadoUbicacion === 'buscando' ? 'Buscando...' : ubicacion ? 'Ordenados por cercanía' : 'Más cercanos a mí'}
              </button>
            )}
          </div>
        )}
      </div>

      {estadoUbicacion && estadoUbicacion !== 'buscando' && <p className="mb-3 rounded-control bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">{estadoUbicacion}</p>}

      {cargando ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map((indice) => <div key={indice} className="h-28 animate-pulse rounded-control bg-sal-2" />)}
        </div>
      ) : error ? (
        <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : restaurantes.length === 0 ? (
        <div className="flex items-center gap-3 rounded-control border border-dashed border-borde bg-sal px-4 py-5 text-sm text-piedra-texto">
          <Store aria-hidden="true" size={22} className="shrink-0 text-piedra" />
          Todavía no hay restaurantes registrados que ofrezcan este plato.
        </div>
      ) : (
        <>
          {verMapa && (
            <div className="mb-4 animate-entrar">
              <Suspense fallback={<div className="h-72 animate-pulse rounded-imagen bg-sal-2" />}>
                <MapaPuntos
                  clave="restaurante"
                  usuario={ubicacion}
                  puntos={conMapa.map((restaurante) => ({
                    id: restaurante.id,
                    latitud: restaurante.latitud,
                    longitud: restaurante.longitud,
                    titulo: restaurante.nombre,
                    detalle: restaurante.direccion || restaurante.ubicacion,
                    enlace: `/restaurantes/${restaurante.id}`,
                  }))}
                />
              </Suspense>
            </div>
          )}
          <ul className="space-y-3">
            {conDistancia.map(({ restaurante, km }) => {
              const zona = [nombreDe(municipios, restaurante.id_municipio), nombreDe(departamentos, restaurante.id_departamento)].filter(Boolean).join(', ') || restaurante.ubicacion
              const foto = restaurante.imagen_principal || restaurante.imagenes?.[0]
              return (
                <li key={restaurante.id}>
                  <Link to={`/restaurantes/${restaurante.id}`} className="group flex gap-4 rounded-control border border-borde bg-white p-3 transition hover:border-piedra/50 hover:shadow-suave">
                    <span className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-sal-2 sm:w-32">
                      {foto
                        ? <ImagenSegura src={foto} alt="" loading="lazy" className="zoom-foto h-full w-full object-cover" />
                        : <span className="flex h-full items-center justify-center text-piedra" aria-hidden="true"><Store size={26} /></span>}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-bold leading-tight text-noche">{restaurante.nombre}</span>
                        {km !== null && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cielo px-2 py-0.5 text-xs font-bold text-noche"><Navigation aria-hidden="true" size={11} /> {textoDistancia(km)}</span>}
                      </span>
                      {zona && <span className="mt-1 flex items-center gap-1 text-sm text-piedra-texto"><MapPin aria-hidden="true" size={14} className="shrink-0" /> <span className="truncate">{zona}</span></span>}
                      {restaurante.direccion && <span className="truncate text-sm text-piedra-texto">{restaurante.direccion}</span>}
                      {restaurante.horario && <span className="mt-0.5 flex items-center gap-1 text-xs text-piedra-texto"><Clock aria-hidden="true" size={13} className="shrink-0" /> <span className="truncate">{restaurante.horario}</span></span>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-bold text-cielo-700 transition-[gap] group-hover:gap-2">Ver restaurante <ArrowRight aria-hidden="true" size={15} /></span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

export default DondeProbarlo
