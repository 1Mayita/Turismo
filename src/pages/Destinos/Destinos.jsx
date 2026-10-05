import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { buscarDestinosPorNombre, destinosDeEjemplo, getDestinos, getDestinosFiltrados } from '../../services/destinosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getRegiones, regionesDeEjemplo } from '../../services/regionesService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'
import { useResumenCalificaciones } from '../../hooks/useResumenCalificaciones.js'

const FILTROS_VACIOS = {
  categoria: '',
  idDepartamento: '',
  idMunicipio: '',
  idRegion: '',
  precioMaximo: '',
  valoracionMinima: '',
  distanciaMaxima: '',
}

const CLASE_CAMPO = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-slate-100'
const CLASE_ETIQUETA = 'block text-xs font-bold uppercase tracking-wider text-slate-500'

async function leerCatalogo() {
  const [destinos, categorias, departamentos, municipios, regiones] = await Promise.all([
    getDestinos(),
    getCategorias(),
    getDepartamentos(),
    getMunicipios(),
    getRegiones(),
  ])
  return { destinos, categorias, departamentos, municipios, regiones }
}

const REFERENCIAS_DE_EJEMPLO = {
  categorias: categoriasDeEjemplo,
  departamentos: departamentosDeEjemplo,
  municipios: municipiosDeEjemplo,
  regiones: regionesDeEjemplo,
}

function coordenadasValidas(latitud, longitud) {
  const lat = Number(latitud)
  const lon = Number(longitud)
  return latitud !== null && latitud !== undefined && latitud !== ''
    && longitud !== null && longitud !== undefined && longitud !== ''
    && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

function distanciaEnKm(origen, destino) {
  if (!coordenadasValidas(destino.latitud, destino.longitud)) return null
  const radianes = (grados) => grados * (Math.PI / 180)
  const deltaLatitud = radianes(Number(destino.latitud) - origen.latitud)
  const deltaLongitud = radianes(Number(destino.longitud) - origen.longitud)
  const a = Math.sin(deltaLatitud / 2) ** 2
    + Math.cos(radianes(origen.latitud)) * Math.cos(radianes(Number(destino.latitud)))
    * Math.sin(deltaLongitud / 2) ** 2
  const segura = Math.min(1, Math.max(0, a))
  return 6371 * 2 * Math.atan2(Math.sqrt(segura), Math.sqrt(1 - segura))
}

// Los filtros de igualdad se resuelven en Firestore; los rangos y la
// distancia desde la ubicación concedida por el usuario se aplican aquí.
function cumpleFiltros(destino, filtros, resumen, ubicacionUsuario) {
  const precio = Number(destino.precio_ingreso) || 0
  const promedio = resumen[destino.id]?.promedio || 0
  const distancia = filtros.distanciaMaxima && ubicacionUsuario
    ? distanciaEnKm(ubicacionUsuario, destino)
    : null
  return (!filtros.categoria || destino.categoria === filtros.categoria)
    && (!filtros.idDepartamento || destino.id_departamento === filtros.idDepartamento)
    && (!filtros.idMunicipio || destino.id_municipio === filtros.idMunicipio)
    && (!filtros.idRegion || destino.id_region === filtros.idRegion)
    && (filtros.precioMaximo === '' || precio <= Number(filtros.precioMaximo))
    && (!filtros.valoracionMinima || promedio >= Number(filtros.valoracionMinima))
    && (!filtros.distanciaMaxima || !ubicacionUsuario
      || (distancia !== null && distancia <= Number(filtros.distanciaMaxima)))
}

function Destinos() {
  const [parametros, setParametros] = useSearchParams()
  const textoBuscado = parametros.get('buscar') || ''

  const [referencias, setReferencias] = useState({ categorias: [], departamentos: [], municipios: [], regiones: [] })
  const [modoEjemplo, setModoEjemplo] = useState(false)
  const [referenciasListas, setReferenciasListas] = useState(false)
  const [destinosBase, setDestinosBase] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null)
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState('')
  const { resumen, error: errorCalificaciones } = useResumenCalificaciones()

  // 1) Listas para los selects (y sembrado inicial si Firestore está vacío).
  useEffect(() => {
    async function cargarReferencias() {
      try {
        let datos = await leerCatalogo()
        if (datos.destinos.length === 0 || datos.categorias.length === 0) {
          try {
            await sembrarCatalogoDeEjemplo()
            datos = await leerCatalogo()
          } catch (errorSembrado) {
            console.error('Error al sembrar el catálogo de ejemplo:', errorSembrado)
            datos = REFERENCIAS_DE_EJEMPLO
            setModoEjemplo(true)
            setAviso('Mostrando destinos de ejemplo. Configura las reglas de escritura de Firestore para guardarlos.')
          }
        }
        setReferencias(datos)
      } catch (errorLectura) {
        console.error('Error al consultar el catálogo en Firestore:', errorLectura)
        setReferencias(REFERENCIAS_DE_EJEMPLO)
        setModoEjemplo(true)
        setAviso('No se pudo consultar Firestore. Mostramos destinos de ejemplo para la demo.')
      } finally {
        setReferenciasListas(true)
      }
    }

    cargarReferencias()
  }, [])

  // 2) Destinos desde Firestore: por nombre si hay búsqueda, si no por los
  // filtros de igualdad (categoría, departamento, municipio, región).
  const { categoria, idDepartamento, idMunicipio, idRegion } = filtros
  useEffect(() => {
    if (!referenciasListas) return
    let activo = true

    async function cargarDestinos() {
      setCargando(true)
      setError('')
      try {
        let resultado
        if (modoEjemplo) resultado = destinosDeEjemplo
        else if (textoBuscado) resultado = await buscarDestinosPorNombre(textoBuscado)
        else resultado = await getDestinosFiltrados({ categoria, idDepartamento, idMunicipio, idRegion })
        if (activo) setDestinosBase(resultado)
      } catch (errorLectura) {
        console.error('Error al consultar destinos en Firestore:', errorLectura)
        if (activo) {
          setDestinosBase([])
          setError('No se pudieron cargar los destinos. Revisa tu conexión e inténtalo de nuevo.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarDestinos()
    return () => {
      activo = false
    }
  }, [referenciasListas, modoEjemplo, textoBuscado, categoria, idDepartamento, idMunicipio, idRegion])

  const destinosFiltrados = destinosBase.filter((destino) => cumpleFiltros(destino, filtros, resumen, ubicacionUsuario))
  const municipiosDisponibles = referencias.municipios.filter((municipio) => municipio.id_departamento === filtros.idDepartamento)
  const regionesDisponibles = referencias.regiones.filter((region) => region.id_municipio === filtros.idMunicipio)
  const cantidadFiltrosActivos = Object.values(filtros).filter(Boolean).length + (textoBuscado ? 1 : 0)

  function cambiarFiltro(evento) {
    const { name, value } = evento.target
    // Al cambiar un nivel geográfico se limpian los niveles de abajo.
    if (name === 'idDepartamento') setFiltros({ ...filtros, idDepartamento: value, idMunicipio: '', idRegion: '' })
    else if (name === 'idMunicipio') setFiltros({ ...filtros, idMunicipio: value, idRegion: '' })
    else setFiltros({ ...filtros, [name]: value })
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS)
    setErrorUbicacion('')
    if (textoBuscado) setParametros({})
  }

  function quitarBusqueda() {
    setParametros({})
  }

  function obtenerUbicacion() {
    setErrorUbicacion('')
    if (!navigator.geolocation) {
      setErrorUbicacion('Tu navegador no permite consultar la ubicación. Puedes seguir usando los demás filtros.')
      return
    }

    setCargandoUbicacion(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUbicacionUsuario({ latitud: coords.latitude, longitud: coords.longitude })
        setCargandoUbicacion(false)
      },
      (errorGeolocalizacion) => {
        const mensajes = {
          1: 'No se autorizó el acceso a la ubicación. Puedes permitirlo en los ajustes del navegador.',
          2: 'No se pudo determinar tu ubicación. Inténtalo de nuevo o continúa sin el filtro de distancia.',
          3: 'La consulta de ubicación tardó demasiado. Inténtalo de nuevo.',
        }
        setErrorUbicacion(mensajes[errorGeolocalizacion.code] || 'No se pudo obtener tu ubicación.')
        setCargandoUbicacion(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  let mensajeVacio = 'No hay destinos que coincidan con estos filtros.'
  if (textoBuscado && destinosBase.length === 0) mensajeVacio = `No se encontraron destinos con ese nombre ("${textoBuscado}").`

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Catálogo de experiencias</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Encuentra tu próximo paisaje</h1>
          <p className="mt-4 text-lg text-slate-600">Desde el altiplano hasta la Amazonía, Bolivia te espera.</p>
        </div>

        {aviso && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{aviso}</p>}
        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {textoBuscado && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <p className="text-lg text-slate-700">
              Resultados para <span className="font-bold text-brand-900">"{textoBuscado}"</span>
            </p>
            <button type="button" onClick={quitarBusqueda} className="text-sm font-semibold text-brand-700 underline">
              Quitar búsqueda
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setPanelAbierto(!panelAbierto)}
          aria-expanded={panelAbierto}
          className="mb-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-900/10 transition hover:bg-brand-100 lg:hidden"
        >
          {panelAbierto ? 'Ocultar filtros' : 'Mostrar filtros'}
          {cantidadFiltrosActivos > 0 && ` (${cantidadFiltrosActivos})`}
        </button>

        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
          <aside className={`${panelAbierto ? 'block' : 'hidden'} mb-8 lg:mb-0 lg:block`}>
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-lg shadow-brand-950/5 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-brand-900">Filtros</h2>

              <label className={CLASE_ETIQUETA}>
                Categoría
                <select name="categoria" value={filtros.categoria} onChange={cambiarFiltro} className={CLASE_CAMPO}>
                  <option value="">Todas</option>
                  {referencias.categorias.map((item) => (
                    <option key={item.id || item.nombre} value={item.nombre}>{item.nombre}</option>
                  ))}
                </select>
              </label>

              <label className={CLASE_ETIQUETA}>
                Departamento
                <select name="idDepartamento" value={filtros.idDepartamento} onChange={cambiarFiltro} className={CLASE_CAMPO}>
                  <option value="">Todos</option>
                  {referencias.departamentos.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre}</option>
                  ))}
                </select>
              </label>

              <label className={CLASE_ETIQUETA}>
                Municipio
                <select name="idMunicipio" value={filtros.idMunicipio} onChange={cambiarFiltro} disabled={!filtros.idDepartamento} className={CLASE_CAMPO}>
                  <option value="">Todos</option>
                  {municipiosDisponibles.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre}</option>
                  ))}
                </select>
              </label>

              <label className={CLASE_ETIQUETA}>
                Región
                <select name="idRegion" value={filtros.idRegion} onChange={cambiarFiltro} disabled={!filtros.idMunicipio} className={CLASE_CAMPO}>
                  <option value="">Todas</option>
                  {regionesDisponibles.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre}</option>
                  ))}
                </select>
              </label>

              <label className={CLASE_ETIQUETA}>
                Precio máximo (Bs)
                <input name="precioMaximo" type="number" min="0" value={filtros.precioMaximo} onChange={cambiarFiltro} placeholder="Sin límite" className={CLASE_CAMPO} />
              </label>

              <div>
                <p className={CLASE_ETIQUETA}>Distancia máxima</p>
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  disabled={cargandoUbicacion}
                  className="mt-1 w-full rounded-xl border border-brand-800/15 bg-brand-50 px-3 py-2 text-left text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-60"
                >
                  {cargandoUbicacion ? 'Buscando ubicación...' : ubicacionUsuario ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
                </button>
                <select
                  name="distanciaMaxima"
                  value={filtros.distanciaMaxima}
                  onChange={cambiarFiltro}
                  disabled={!ubicacionUsuario}
                  className={CLASE_CAMPO}
                  aria-label="Distancia máxima en kilómetros"
                >
                  <option value="">Cualquier distancia</option>
                  {[5, 10, 25, 50, 100, 250].map((distancia) => (
                    <option key={distancia} value={distancia}>A {distancia} km o menos</option>
                  ))}
                </select>
                {!ubicacionUsuario && <p className="mt-2 text-xs leading-5 text-slate-500">Permite el acceso a tu ubicación para filtrar destinos cercanos.</p>}
                {errorUbicacion && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{errorUbicacion}</p>}
              </div>

              <label className={CLASE_ETIQUETA}>
                Valoración mínima
                <select name="valoracionMinima" value={filtros.valoracionMinima} onChange={cambiarFiltro} className={CLASE_CAMPO}>
                  <option value="">Cualquiera</option>
                  {[1, 2, 3, 4, 5].map((estrellas) => (
                    <option key={estrellas} value={estrellas}>{'★'.repeat(estrellas)} {estrellas === 5 ? '(5)' : `(${estrellas} o más)`}</option>
                  ))}
                </select>
              </label>
              {filtros.valoracionMinima && errorCalificaciones && (
                <p className="text-xs font-semibold text-red-700" role="alert">{errorCalificaciones} El filtro de valoración puede no ser exacto.</p>
              )}

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={cantidadFiltrosActivos === 0}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpiar filtros
              </button>
            </div>
          </aside>

          <section>
            {cargando ? (
              <GrillaEsqueleto />
            ) : destinosFiltrados.length === 0 ? (
              !error && <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">{mensajeVacio}</p>
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-500">
                  {destinosFiltrados.length} {destinosFiltrados.length === 1 ? 'destino encontrado' : 'destinos encontrados'}
                </p>
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                  {destinosFiltrados.map((destino) => (
                    <TarjetaDestino
                      key={destino.id || destino.nombre}
                      destino={destino}
                      distanciaKm={ubicacionUsuario ? distanciaEnKm(ubicacionUsuario, destino) : null}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Destinos
