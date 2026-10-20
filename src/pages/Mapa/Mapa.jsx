import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Navbar from '../../components/Navbar.jsx'
import BotonAgregarAViaje from '../../components/BotonAgregarAViaje.jsx'
import { ResumenCalificacion } from '../../components/Estrellas.jsx'
import { estiloDeMarcador, iconoDeMarcador } from '../../components/mapa/iconos.js'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { getAlojamientos } from '../../services/alojamientosService.js'
import { claveDeCalificacion } from '../../services/resenasService.js'
import { useResumenCalificaciones } from '../../hooks/useResumenCalificaciones.js'
import { coordenadasValidas, distanciaEnKm, obtenerUbicacionDelUsuario } from '../../utils/geo.js'
import { coincideConBusqueda } from '../../utils/texto.js'

const CENTRO_BOLIVIA = [-16.5, -64.8]
const ZOOM_INICIAL = 6
const MAXIMO_EN_LISTA = 40

const CAPAS = [
  { id: 'destino', etiqueta: 'Destinos turísticos' },
  { id: 'restaurante', etiqueta: 'Restaurantes' },
  { id: 'alojamiento', etiqueta: 'Alojamientos' },
]

const CLASE_CAMPO = 'mt-1 w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-100'
const CLASE_ETIQUETA = 'block text-xs font-bold uppercase tracking-wider text-slate-500'

// Convierte destinos, restaurantes y alojamientos a un mismo formato de "punto".
function aPuntos({ destinos, restaurantes, alojamientos }) {
  const punto = (tipo, registro, extra) => ({
    clave: `${tipo}-${registro.id || registro.nombre}`,
    tipo,
    id: registro.id,
    nombre: registro.nombre,
    ubicacion: registro.ubicacion || '',
    latitud: Number(registro.latitud),
    longitud: Number(registro.longitud),
    ...extra,
  })
  return [
    ...destinos.map((destino) => punto('destino', destino, { estilo: destino.categoria, categoria: destino.categoria, enlace: destino.id ? `/destinos/${destino.id}` : null, texto: [destino.nombre, destino.ubicacion, destino.categoria] })),
    ...restaurantes.map((restaurante) => punto('restaurante', restaurante, { estilo: 'restaurante', enlace: `/restaurantes/${restaurante.id}`, texto: [restaurante.nombre, restaurante.ubicacion, restaurante.especialidad, restaurante.platos_tipicos] })),
    ...alojamientos.map((alojamiento) => punto('alojamiento', alojamiento, { estilo: 'alojamiento', enlace: `/alojamientos/${alojamiento.id}`, texto: [alojamiento.nombre, alojamiento.ubicacion, alojamiento.tipo] })),
  ].filter((item) => coordenadasValidas(item.latitud, item.longitud))
}

// Mueve el mapa hacia el punto elegido en la lista.
function Enfocar({ objetivo }) {
  const mapa = useMap()
  useEffect(() => {
    if (objetivo) mapa.flyTo([objetivo.latitud, objetivo.longitud], 13, { duration: 0.8 })
  }, [mapa, objetivo])
  return null
}

function Mapa() {
  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [capasActivas, setCapasActivas] = useState(['destino'])
  const [categoriasActivas, setCategoriasActivas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [valoracionMinima, setValoracionMinima] = useState('')
  const [distanciaMaxima, setDistanciaMaxima] = useState('')
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null)
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState('')
  const [objetivo, setObjetivo] = useState(null)
  const [panelAbierto, setPanelAbierto] = useState(true)
  const { resumen } = useResumenCalificaciones()

  useEffect(() => {
    async function cargar() {
      try {
        // Cada lista falla por su cuenta: si no hay restaurantes, igual se ven los destinos.
        const [destinos, restaurantes, alojamientos] = await Promise.all([
          getDestinos(),
          getRestaurantes().catch(() => []),
          getAlojamientos().catch(() => []),
        ])
        setPuntos(aPuntos({ destinos: destinos.length > 0 ? destinos : destinosDeEjemplo, restaurantes, alojamientos }))
      } catch (errorLectura) {
        console.error('Error al consultar los lugares para el mapa:', errorLectura)
        setPuntos(aPuntos({ destinos: destinosDeEjemplo, restaurantes: [], alojamientos: [] }))
        setAviso('No pudimos conectar con el servidor. El mapa muestra destinos de ejemplo.')
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [])

  const categorias = useMemo(
    () => [...new Set(puntos.filter((item) => item.tipo === 'destino' && item.categoria).map((item) => item.categoria))].sort((a, b) => a.localeCompare(b, 'es')),
    [puntos],
  )

  const calificacionDe = (item) => resumen[claveDeCalificacion(item.tipo, item.id)]

  const visibles = puntos
    .filter((item) => capasActivas.includes(item.tipo))
    .filter((item) => item.tipo !== 'destino' || categoriasActivas.length === 0 || categoriasActivas.includes(item.categoria))
    .filter((item) => !busqueda.trim() || coincideConBusqueda(item.texto, busqueda))
    .filter((item) => !valoracionMinima || (calificacionDe(item)?.promedio || 0) >= Number(valoracionMinima))
    .map((item) => ({ ...item, distancia: ubicacionUsuario ? distanciaEnKm(ubicacionUsuario, item) : null }))
    .filter((item) => !distanciaMaxima || !ubicacionUsuario || (item.distancia !== null && item.distancia <= Number(distanciaMaxima)))
    .sort((a, b) => (ubicacionUsuario ? (a.distancia ?? Infinity) - (b.distancia ?? Infinity) : a.nombre.localeCompare(b.nombre, 'es')))

  const hayFiltros = Boolean(busqueda || valoracionMinima || distanciaMaxima || categoriasActivas.length > 0 || capasActivas.length !== 1 || capasActivas[0] !== 'destino')

  function alternar(lista, setLista, valor) {
    setLista(lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor])
  }

  function limpiarFiltros() {
    setCapasActivas(['destino'])
    setCategoriasActivas([])
    setBusqueda('')
    setValoracionMinima('')
    setDistanciaMaxima('')
  }

  async function usarMiUbicacion() {
    setErrorUbicacion('')
    setCargandoUbicacion(true)
    try {
      const ubicacion = await obtenerUbicacionDelUsuario()
      setUbicacionUsuario(ubicacion)
      setObjetivo({ ...ubicacion })
    } catch (errorGeolocalizacion) {
      setErrorUbicacion(errorGeolocalizacion.message)
    } finally {
      setCargandoUbicacion(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-7xl py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-2">
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Mapa turístico</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Bolivia en el mapa</h1>
          </div>
          <button
            type="button"
            onClick={() => setPanelAbierto(!panelAbierto)}
            aria-expanded={panelAbierto}
            className="rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold text-brand-800 ring-1 ring-white/80 transition hover:bg-white lg:hidden"
          >
            {panelAbierto ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
        </div>

        {aviso && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{aviso}</p>}

        <div className="lg:grid lg:grid-cols-[21rem_1fr] lg:gap-5">
          {/* Panel de filtros y resultados, al estilo de Google Maps. */}
          <aside className={`${panelAbierto ? 'block' : 'hidden'} mb-4 lg:mb-0 lg:block`}>
            <div className="flex flex-col gap-4 rounded-3xl cristal p-5 lg:h-[78vh] lg:overflow-y-auto">
              <label className={CLASE_ETIQUETA}>
                Buscar en el mapa
                <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej.: Uyuni, hostal, trucha..." className={CLASE_CAMPO} />
              </label>

              <fieldset>
                <legend className={CLASE_ETIQUETA}>Mostrar</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CAPAS.map((capa) => {
                    const activa = capasActivas.includes(capa.id)
                    const estilo = estiloDeMarcador(capa.id === 'destino' ? 'Naturaleza' : capa.id)
                    return (
                      <button
                        key={capa.id}
                        type="button"
                        aria-pressed={activa}
                        onClick={() => alternar(capasActivas, setCapasActivas, capa.id)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${activa ? 'bg-brand-700 text-white' : 'bg-white/70 text-slate-700 ring-1 ring-white/80 hover:bg-white'}`}
                      >
                        <span aria-hidden="true">{capa.id === 'destino' ? '📍' : estilo.simbolo}</span> {capa.etiqueta}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {capasActivas.includes('destino') && categorias.length > 0 && (
                <fieldset>
                  <legend className={CLASE_ETIQUETA}>Categoría del destino</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categorias.map((categoria) => {
                      const activa = categoriasActivas.includes(categoria)
                      const estilo = estiloDeMarcador(categoria)
                      return (
                        <button
                          key={categoria}
                          type="button"
                          aria-pressed={activa}
                          onClick={() => alternar(categoriasActivas, setCategoriasActivas, categoria)}
                          style={activa ? { backgroundColor: estilo.color } : undefined}
                          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${activa ? 'text-white' : 'bg-white/70 text-slate-700 ring-1 ring-white/80 hover:bg-white'}`}
                        >
                          <span aria-hidden="true">{estilo.simbolo}</span> {categoria}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Sin ninguna marcada se muestran todas.</p>
                </fieldset>
              )}

              <label className={CLASE_ETIQUETA}>
                Valoración mínima
                <select value={valoracionMinima} onChange={(evento) => setValoracionMinima(evento.target.value)} className={CLASE_CAMPO}>
                  <option value="">Cualquiera</option>
                  {[1, 2, 3, 4, 5].map((estrellas) => (
                    <option key={estrellas} value={estrellas}>{'★'.repeat(estrellas)} {estrellas === 5 ? '(5)' : `(${estrellas} o más)`}</option>
                  ))}
                </select>
              </label>

              <div>
                <p className={CLASE_ETIQUETA}>Distancia desde mi ubicación</p>
                <button
                  type="button"
                  onClick={usarMiUbicacion}
                  disabled={cargandoUbicacion}
                  className="mt-1 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-left text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-60"
                >
                  {cargandoUbicacion ? 'Buscando ubicación...' : ubicacionUsuario ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
                </button>
                <select value={distanciaMaxima} onChange={(evento) => setDistanciaMaxima(evento.target.value)} disabled={!ubicacionUsuario} aria-label="Distancia máxima en kilómetros" className={CLASE_CAMPO}>
                  <option value="">Cualquier distancia</option>
                  {[10, 50, 100, 250, 500].map((distancia) => (
                    <option key={distancia} value={distancia}>A {distancia} km o menos</option>
                  ))}
                </select>
                {errorUbicacion && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{errorUbicacion}</p>}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/80 pt-3">
                <p className="text-sm font-semibold text-slate-700" aria-live="polite">
                  {visibles.length} {visibles.length === 1 ? 'lugar' : 'lugares'}
                </p>
                <button type="button" onClick={limpiarFiltros} disabled={!hayFiltros} className="text-sm font-semibold text-brand-700 underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
                  Limpiar filtros
                </button>
              </div>

              {!cargando && visibles.length === 0 ? (
                <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-slate-600">Ningún lugar coincide con estos filtros.</p>
              ) : (
                <ul className="space-y-2">
                  {visibles.slice(0, MAXIMO_EN_LISTA).map((item) => {
                    const estilo = estiloDeMarcador(item.estilo)
                    return (
                      <li key={item.clave}>
                        <button
                          type="button"
                          onClick={() => setObjetivo({ latitud: item.latitud, longitud: item.longitud })}
                          className="flex w-full items-start gap-3 rounded-xl bg-white/60 px-3 py-2.5 text-left transition hover:bg-white"
                        >
                          <span aria-hidden="true" style={{ backgroundColor: estilo.color }} className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm">{estilo.simbolo}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-900">{item.nombre}</span>
                            <span className="block truncate text-xs text-gray-500">
                              {estilo.etiqueta}{item.ubicacion ? ` · ${item.ubicacion}` : ''}
                              {item.distancia !== null && ` · ${item.distancia.toFixed(0)} km`}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* "relative z-0" encierra los z-index de Leaflet para que no tapen la Navbar. */}
          <div className="relative z-0 h-[70vh] min-h-96 overflow-hidden rounded-3xl shadow-xl shadow-brand-950/10 ring-1 ring-white/80 lg:h-[78vh]">
            {cargando ? (
              <div className="h-full w-full animate-pulse bg-sal-2" />
            ) : (
              <MapContainer center={CENTRO_BOLIVIA} zoom={ZOOM_INICIAL} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Enfocar objetivo={objetivo} />
                {ubicacionUsuario && (
                  <CircleMarker center={[ubicacionUsuario.latitud, ubicacionUsuario.longitud]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
                    <Popup>Estás aquí</Popup>
                  </CircleMarker>
                )}
                {visibles.map((item) => {
                  const calificacion = calificacionDe(item)
                  return (
                    <Marker key={item.clave} position={[item.latitud, item.longitud]} icon={iconoDeMarcador(item.estilo)} title={item.nombre}>
                      <Popup>
                        <p className="m-0! text-xs font-bold uppercase tracking-wider text-slate-500">{estiloDeMarcador(item.estilo).etiqueta}</p>
                        <p className="m-0! text-base font-bold text-slate-900">{item.nombre}</p>
                        {item.ubicacion && <p className="m-0! text-xs text-slate-600">{item.ubicacion}</p>}
                        <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} className="mt-1" />
                        {item.enlace && (
                          <Link to={item.enlace} className="mt-1 block font-semibold text-brand-700 underline">
                            Ver más
                          </Link>
                        )}
                        {item.tipo === 'destino' && item.id && (
                          <BotonAgregarAViaje destino={{ id: item.id, nombre: item.nombre }} className="mt-2 px-3! py-1.5! text-xs!" />
                        )}
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Mapa
