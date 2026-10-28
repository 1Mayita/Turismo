import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import { BedDouble, LocateFixed, MapPin, Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import Navbar from '../../components/Navbar.jsx'
import BotonAgregarAViaje from '../../components/BotonAgregarAViaje.jsx'
import { ResumenCalificacion } from '../../components/Estrellas.jsx'
import { COLOR_POR_TIPO, estiloDeMarcador, iconoDeMarcador } from '../../components/mapa/iconos.js'
import { Chip, ChipCategoria, claseControl, claseEtiqueta, iconoDeCategoria } from '../../components/ui'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { getAlojamientos } from '../../services/alojamientosService.js'
import { claveDeCalificacion } from '../../services/resenasService.js'
import { useResumenCalificaciones } from '../../hooks/useResumenCalificaciones.js'
import { coordenadasValidas, distanciaEnKm, obtenerUbicacionDelUsuario } from '../../utils/geo.js'
import { coincideConBusqueda } from '../../utils/texto.js'

const CENTRO_BOLIVIA = [-16.5, -64.8]
// En escritorio el panel tapa la izquierda: el centro se corre al este para
// que Bolivia quede en la parte visible del mapa.
const CENTRO_CON_PANEL = [-16.5, -61.9]
const ZOOM_INICIAL = 6
const MAXIMO_EN_LISTA = 40

const CAPAS = [
  { id: 'destino', etiqueta: 'Destinos turísticos' },
  { id: 'restaurante', etiqueta: 'Restaurantes' },
  { id: 'alojamiento', etiqueta: 'Alojamientos' },
]

const ICONO_DE_CAPA = { destino: MapPin, restaurante: UtensilsCrossed, alojamiento: BedDouble }

const CLASE_CAMPO = `${claseControl} mt-1.5 text-sm font-normal`
const CLASE_ETIQUETA = claseEtiqueta

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
  const [panelAbierto, setPanelAbierto] = useState(false)
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

  function enfocar(item) {
    setObjetivo({ latitud: item.latitud, longitud: item.longitud })
    // En celular la hoja se baja para que se vea el lugar en el mapa.
    setPanelAbierto(false)
  }

  // Filtros y lista: el mismo contenido va en el panel de escritorio y en la
  // hoja del celular.
  const contenido = (
    <div className="flex flex-col gap-5">
      {aviso && <p className="rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{aviso}</p>}

      <label className={CLASE_ETIQUETA}>
        Buscar en el mapa
        <span className="relative mt-1.5 block">
          <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-piedra" />
          <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej.: Uyuni, hostal, trucha..." className={`${CLASE_CAMPO} mt-0 pl-10`} />
        </span>
      </label>

      <fieldset>
        <legend className={CLASE_ETIQUETA}>Mostrar</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CAPAS.map((capa) => (
            <Chip
              key={capa.id}
              activo={capasActivas.includes(capa.id)}
              onClick={() => alternar(capasActivas, setCapasActivas, capa.id)}
              icono={ICONO_DE_CAPA[capa.id]}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: COLOR_POR_TIPO[capa.id] }} aria-hidden="true" />
              {capa.etiqueta}
            </Chip>
          ))}
        </div>
      </fieldset>

      {capasActivas.includes('destino') && categorias.length > 0 && (
        <fieldset>
          <legend className={CLASE_ETIQUETA}>Categoría del destino</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <ChipCategoria
                key={categoria}
                nombre={categoria}
                activo={categoriasActivas.includes(categoria)}
                onClick={() => alternar(categoriasActivas, setCategoriasActivas, categoria)}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-piedra-texto">Sin ninguna marcada se muestran todas.</p>
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
          className="mt-1.5 flex min-h-11 w-full items-center gap-2 rounded-control border border-borde bg-cielo/50 px-3 text-left text-sm font-bold text-cielo-700 transition hover:bg-cielo disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" size={18} />
          {cargandoUbicacion ? 'Buscando ubicación...' : ubicacionUsuario ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
        </button>
        <select value={distanciaMaxima} onChange={(evento) => setDistanciaMaxima(evento.target.value)} disabled={!ubicacionUsuario} aria-label="Distancia máxima en kilómetros" className={`${CLASE_CAMPO} mt-2`}>
          <option value="">Cualquier distancia</option>
          {[10, 50, 100, 250, 500].map((distancia) => (
            <option key={distancia} value={distancia}>A {distancia} km o menos</option>
          ))}
        </select>
        {errorUbicacion && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{errorUbicacion}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-borde pt-4">
        <p className="text-sm font-bold text-noche" aria-live="polite">
          {visibles.length} {visibles.length === 1 ? 'lugar' : 'lugares'}
        </p>
        <button type="button" onClick={limpiarFiltros} disabled={!hayFiltros} className="min-h-11 px-1 text-sm font-bold text-cielo-700 hover:underline disabled:cursor-not-allowed disabled:text-piedra disabled:no-underline">
          Limpiar filtros
        </button>
      </div>

      {!cargando && visibles.length === 0 ? (
        <p className="rounded-control bg-sal-2 px-4 py-3 text-sm text-piedra-texto">Ningún lugar coincide con estos filtros.</p>
      ) : (
        <ul className="-mx-2 space-y-1">
          {visibles.slice(0, MAXIMO_EN_LISTA).map((item) => {
            const estilo = estiloDeMarcador(item.estilo)
            const Icono = item.tipo === 'destino' ? iconoDeCategoria(item.categoria) : ICONO_DE_CAPA[item.tipo]
            return (
              <li key={item.clave}>
                <button
                  type="button"
                  onClick={() => enfocar(item)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-control px-2 py-2 text-left transition hover:bg-sal-2"
                >
                  <span aria-hidden="true" style={{ backgroundColor: estilo.color }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white">
                    <Icono size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-noche">{item.nombre}</span>
                    <span className="block truncate text-xs text-piedra-texto">
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
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative h-[calc(100dvh-72px)] min-h-[560px] overflow-hidden">
        {/* El mapa ocupa toda la pantalla. "z-0" encierra los z-index de Leaflet. */}
        <div className="absolute inset-0 z-0">
          {cargando ? (
            <div className="h-full w-full animate-pulse bg-sal-2" />
          ) : (
            <MapContainer center={window.matchMedia('(min-width: 1024px)').matches ? CENTRO_CON_PANEL : CENTRO_BOLIVIA} zoom={ZOOM_INICIAL} scrollWheelZoom zoomControl={false} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="topright" />
              <Enfocar objetivo={objetivo} />
              {ubicacionUsuario && (
                <CircleMarker center={[ubicacionUsuario.latitud, ubicacionUsuario.longitud]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#4a5680', fillOpacity: 1 }}>
                  <Popup>Estás aquí</Popup>
                </CircleMarker>
              )}
              {visibles.map((item) => {
                const calificacion = calificacionDe(item)
                return (
                  <Marker key={item.clave} position={[item.latitud, item.longitud]} icon={iconoDeMarcador(item.estilo)} title={item.nombre}>
                    <Popup>
                      <p className="m-0! text-xs font-bold uppercase tracking-wider text-cobre-texto">{estiloDeMarcador(item.estilo).etiqueta}</p>
                      <p className="m-0! font-ui text-base font-bold text-noche">{item.nombre}</p>
                      {item.ubicacion && <p className="m-0! text-xs text-piedra-texto">{item.ubicacion}</p>}
                      <ResumenCalificacion promedio={calificacion?.promedio} total={calificacion?.total} className="mt-1" />
                      {item.enlace && (
                        <Link to={item.enlace} className="mt-1 block font-bold text-cielo-700 underline">
                          Ver más
                        </Link>
                      )}
                      {item.tipo === 'destino' && item.id && (
                        <BotonAgregarAViaje destino={{ id: item.id, nombre: item.nombre }} className="mt-2 min-h-9! px-3! text-xs!" />
                      )}
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}
        </div>

        {/* Escritorio: panel flotante con filtros y resultados. */}
        <aside aria-label="Filtros y lugares" className="absolute bottom-4 left-4 top-4 z-[500] hidden w-[22.5rem] flex-col overflow-hidden rounded-tarjeta border border-borde bg-white shadow-elevada lg:flex">
          <div className="border-b border-borde px-5 pb-4 pt-5">
            <p className="rotulo">Mapa turístico</p>
            <h1 className="titulo-display text-[34px]">Bolivia en el mapa</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{contenido}</div>
        </aside>

        {/* Celular: hoja que sube desde abajo. Cerrada deja ver el mapa. */}
        <section aria-label="Filtros y lugares" className="absolute inset-x-0 bottom-0 z-[500] flex max-h-[72dvh] flex-col rounded-t-tarjeta border-t border-borde bg-white shadow-elevada lg:hidden">
          <button
            type="button"
            onClick={() => setPanelAbierto(!panelAbierto)}
            aria-expanded={panelAbierto}
            aria-controls="hoja-mapa"
            className="flex min-h-14 w-full shrink-0 flex-col items-center gap-1.5 px-5 pb-3 pt-2"
          >
            <span className="h-1.5 w-10 rounded-full bg-borde" aria-hidden="true" />
            <span className="flex w-full items-center justify-between gap-3">
              <span className="text-left">
                <span className="block font-ui text-base font-bold text-noche">Bolivia en el mapa</span>
                <span className="block text-sm text-piedra-texto">{cargando ? 'Cargando lugares…' : `${visibles.length} ${visibles.length === 1 ? 'lugar' : 'lugares'}`}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cielo px-3 py-1.5 text-sm font-bold text-noche">
                <SlidersHorizontal aria-hidden="true" size={16} />
                {panelAbierto ? 'Ver mapa' : 'Lista y filtros'}
              </span>
            </span>
          </button>
          {panelAbierto && <div id="hoja-mapa" className="overflow-y-auto border-t border-borde px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">{contenido}</div>}
        </section>
      </main>
    </div>
  )
}

export default Mapa
