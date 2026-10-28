import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LocateFixed, SearchX, SlidersHorizontal, X } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { Chip, EstadoVacio, EsqueletoTarjetaBase, claseBoton, claseControl, claseEtiqueta } from '../../components/ui'
import { buscarDestinosPorNombre, destinosDeEjemplo, getDestinos, getDestinosFiltrados } from '../../services/destinosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getRegiones, regionesDeEjemplo } from '../../services/regionesService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'
import { useResumenCalificaciones } from '../../hooks/useResumenCalificaciones.js'
import { distanciaEnKm, obtenerUbicacionDelUsuario } from '../../utils/geo.js'

// Cada filtro se guarda en la URL con este nombre (ej. ?categoria=Naturaleza):
// así sobreviven al entrar a un destino y volver, y el enlace se puede compartir.
const PARAMETRO_DE_FILTRO = {
  categoria: 'categoria',
  idDepartamento: 'departamento',
  idMunicipio: 'municipio',
  idRegion: 'region',
  precioMaximo: 'precio',
  valoracionMinima: 'valoracion',
  distanciaMaxima: 'distancia',
}

const CLASE_CAMPO = `${claseControl} mt-1.5 text-sm font-normal`
const CLASE_ETIQUETA = claseEtiqueta

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
  const filtros = Object.fromEntries(
    Object.entries(PARAMETRO_DE_FILTRO).map(([campo, parametro]) => [campo, parametros.get(parametro) || '']),
  )

  function setFiltros(siguientes) {
    const nuevos = new URLSearchParams()
    if (textoBuscado) nuevos.set('buscar', textoBuscado)
    Object.entries(PARAMETRO_DE_FILTRO).forEach(([campo, parametro]) => {
      if (siguientes[campo]) nuevos.set(parametro, siguientes[campo])
    })
    setParametros(nuevos, { replace: true })
  }
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
    setErrorUbicacion('')
    setParametros({}, { replace: true })
  }

  function quitarBusqueda() {
    const sinBusqueda = new URLSearchParams(parametros)
    sinBusqueda.delete('buscar')
    setParametros(sinBusqueda, { replace: true })
  }

  async function obtenerUbicacion() {
    setErrorUbicacion('')
    setCargandoUbicacion(true)
    try {
      setUbicacionUsuario(await obtenerUbicacionDelUsuario())
    } catch (errorUbicacion) {
      console.error('No se pudo obtener la ubicación del usuario:', errorUbicacion)
      setErrorUbicacion(`${errorUbicacion.message} Puedes seguir usando los demás filtros.`)
    } finally {
      setCargandoUbicacion(false)
    }
  }

  let mensajeVacio = 'No hay destinos que coincidan con estos filtros.'
  if (textoBuscado && destinosBase.length === 0) mensajeVacio = `No se encontraron destinos con ese nombre ("${textoBuscado}").`

  // Filtros activos como chips que se pueden quitar uno por uno.
  const nombreDe = (lista, id) => lista.find((item) => item.id === id)?.nombre || id
  const chipsActivos = [
    textoBuscado && { clave: 'buscar', texto: `“${textoBuscado}”`, quitar: quitarBusqueda },
    filtros.categoria && { clave: 'categoria', texto: filtros.categoria, quitar: () => setFiltros({ ...filtros, categoria: '' }) },
    filtros.idDepartamento && { clave: 'departamento', texto: nombreDe(referencias.departamentos, filtros.idDepartamento), quitar: () => setFiltros({ ...filtros, idDepartamento: '', idMunicipio: '', idRegion: '' }) },
    filtros.idMunicipio && { clave: 'municipio', texto: nombreDe(referencias.municipios, filtros.idMunicipio), quitar: () => setFiltros({ ...filtros, idMunicipio: '', idRegion: '' }) },
    filtros.idRegion && { clave: 'region', texto: nombreDe(referencias.regiones, filtros.idRegion), quitar: () => setFiltros({ ...filtros, idRegion: '' }) },
    filtros.precioMaximo && { clave: 'precio', texto: `Hasta Bs ${filtros.precioMaximo}`, quitar: () => setFiltros({ ...filtros, precioMaximo: '' }) },
    filtros.distanciaMaxima && { clave: 'distancia', texto: `A ${filtros.distanciaMaxima} km o menos`, quitar: () => setFiltros({ ...filtros, distanciaMaxima: '' }) },
    filtros.valoracionMinima && { clave: 'valoracion', texto: `${filtros.valoracionMinima}★ o más`, quitar: () => setFiltros({ ...filtros, valoracionMinima: '' }) },
  ].filter(Boolean)

  const campos = (
    <>
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
          className="mt-1.5 flex min-h-11 w-full items-center gap-2 rounded-control border border-borde bg-cielo/50 px-3 text-left text-sm font-bold text-cielo-700 transition hover:bg-cielo disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" size={18} />
          {cargandoUbicacion ? 'Buscando ubicación...' : ubicacionUsuario ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
        </button>
        <select
          name="distanciaMaxima"
          value={filtros.distanciaMaxima}
          onChange={cambiarFiltro}
          disabled={!ubicacionUsuario}
          className={`${CLASE_CAMPO} mt-2`}
          aria-label="Distancia máxima en kilómetros"
        >
          <option value="">Cualquier distancia</option>
          {[5, 10, 25, 50, 100, 250].map((distancia) => (
            <option key={distancia} value={distancia}>A {distancia} km o menos</option>
          ))}
        </select>
        {!ubicacionUsuario && <p className="mt-2 text-xs leading-5 text-piedra-texto">Permite el acceso a tu ubicación para filtrar destinos cercanos.</p>}
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
    </>
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 rotulo">Catálogo de experiencias</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">Encuentra tu próximo paisaje</h1>
          <p className="texto-lectura mt-3 text-lg text-piedra-texto">Desde el altiplano hasta la Amazonía, Bolivia te espera.</p>
        </div>

        {aviso && <p className="mb-8 rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{aviso}</p>}
        {error && <p className="mb-8 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {textoBuscado && (
          <p className="mb-4 text-lg text-noche/80">
            Resultados para <span className="font-bold text-noche">"{textoBuscado}"</span>
          </p>
        )}

        {/* Celular: los filtros se abren en una hoja que sube desde abajo. */}
        <button
          type="button"
          onClick={() => setPanelAbierto(true)}
          aria-expanded={panelAbierto}
          aria-controls="hoja-filtros"
          className={claseBoton('secundario', 'normal', 'mb-5 bg-white lg:hidden')}
        >
          <SlidersHorizontal aria-hidden="true" size={18} />
          Filtros
          {cantidadFiltrosActivos > 0 && <span className="rounded-full bg-noche px-2 py-0.5 text-xs text-white">{cantidadFiltrosActivos}</span>}
        </button>

        <div className="lg:grid lg:grid-cols-[16.5rem_1fr] lg:gap-8">
          {/* Escritorio: panel lateral fijo. */}
          <aside className="hidden lg:block" aria-label="Filtros">
            <div className="space-y-4 rounded-tarjeta border border-borde bg-white p-5 shadow-suave lg:sticky lg:top-24">
              <h2 className="flex items-center gap-2 text-lg font-bold text-noche">
                <SlidersHorizontal aria-hidden="true" size={18} className="text-cielo-700" />
                Filtros
              </h2>
              {campos}
              <button type="button" onClick={limpiarFiltros} disabled={cantidadFiltrosActivos === 0} className={claseBoton('fantasma', 'pequeno', 'w-full')}>
                Limpiar filtros
              </button>
            </div>
          </aside>

          <section aria-label="Resultados">
            {chipsActivos.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
                {chipsActivos.map((chip) => (
                  <Chip key={chip.clave} activo onQuitar={chip.quitar} etiquetaQuitar={`Quitar el filtro ${chip.texto}`}>{chip.texto}</Chip>
                ))}
                <button type="button" onClick={limpiarFiltros} className="min-h-11 px-2 text-sm font-bold text-cielo-700 hover:underline">
                  Limpiar todo
                </button>
              </div>
            )}

            {cargando ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, indice) => <EsqueletoTarjetaBase key={indice} className={indice > 1 ? 'hidden sm:block' : ''} />)}
              </div>
            ) : destinosFiltrados.length === 0 ? (
              !error && (
                <EstadoVacio
                  icono={SearchX}
                  titulo={mensajeVacio}
                  mensaje="Prueba con otra categoría, otro departamento o quita algunos filtros."
                  accion={cantidadFiltrosActivos > 0 && (
                    <button type="button" onClick={limpiarFiltros} className={claseBoton('secundario', 'normal', 'bg-white')}>
                      Quitar los filtros y ver todos los destinos
                    </button>
                  )}
                />
              )
            ) : (
              <>
                <p className="mb-4 text-sm text-piedra-texto" aria-live="polite">
                  {destinosFiltrados.length} {destinosFiltrados.length === 1 ? 'destino encontrado' : 'destinos encontrados'}
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

      {panelAbierto && (
        <div className="fixed inset-0 z-[900] lg:hidden">
          <div className="absolute inset-0 bg-noche/45" onClick={() => setPanelAbierto(false)} aria-hidden="true" />
          <div
            id="hoja-filtros"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            onKeyDown={(evento) => {
              if (evento.key === 'Escape') setPanelAbierto(false)
            }}
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-tarjeta bg-white shadow-elevada"
          >
            <div className="flex items-center justify-between border-b border-borde px-5 py-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-noche">
                <SlidersHorizontal aria-hidden="true" size={18} className="text-cielo-700" />
                Filtros
              </h2>
              <button type="button" autoFocus onClick={() => setPanelAbierto(false)} aria-label="Cerrar filtros" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sal-2">
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto px-5 py-4">{campos}</div>
            <div className="grid grid-cols-2 gap-3 border-t border-borde px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={limpiarFiltros} disabled={cantidadFiltrosActivos === 0} className={claseBoton('secundario')}>
                Limpiar
              </button>
              <button type="button" onClick={() => setPanelAbierto(false)} className={claseBoton('primario')}>
                Ver {cargando ? '' : destinosFiltrados.length} {destinosFiltrados.length === 1 ? 'destino' : 'destinos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Destinos
