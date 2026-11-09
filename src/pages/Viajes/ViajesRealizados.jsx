import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookHeart, CalendarCheck, ChevronLeft, ChevronRight, Expand, MapPin, Pencil, Plus, Quote, Route, Trash2, Undo2 } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import Modal from '../../components/Modal.jsx'
import VisorImagenes from '../../components/VisorImagenes.jsx'
import { Aparecer, EstadoVacio, claseBoton } from '../../components/ui'
import { useAuth } from '../../context/useAuth.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getDestinos } from '../../services/destinosService.js'
import { formatearFechaEvento } from '../../services/eventosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import {
  devolverAPlanificado,
  editarViajeRealizado,
  eliminarViaje,
  getViajesDeUsuario,
  ordenarHistorial,
  registrarViajeRealizado,
} from '../../services/viajesService.js'
import FormularioRecuerdo from './FormularioRecuerdo.jsx'
import PestanasViajes from './PestanasViajes.jsx'
import { paradasConDestino } from './utilidades.js'

// Galería de un recuerdo: se desliza con el dedo o con las flechas y cada
// foto se puede ampliar a pantalla completa.
function GaleriaRecuerdo({ fotos, titulo, esDelDestino, onAmpliar }) {
  const pista = useRef(null)
  const [actual, setActual] = useState(0)

  function ir(indice) {
    const elemento = pista.current
    if (!elemento) return
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    elemento.scrollTo({ left: indice * elemento.clientWidth, behavior: reducir ? 'auto' : 'smooth' })
  }

  function alDeslizar() {
    const elemento = pista.current
    if (elemento) setActual(Math.round(elemento.scrollLeft / Math.max(1, elemento.clientWidth)))
  }

  const flecha = 'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-noche opacity-0 shadow-suave transition group-hover/galeria:opacity-100 focus-visible:opacity-100 disabled:hidden'

  return (
    <div className="group/galeria relative overflow-hidden bg-noche">
      <div ref={pista} onScroll={alDeslizar} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Fotos de ${titulo}`} role="region" tabIndex={0}>
        {fotos.map((foto, indice) => (
          <button key={foto} type="button" onClick={() => onAmpliar(indice)} className="relative h-64 w-full shrink-0 snap-center sm:h-80" aria-label={`Ampliar foto ${indice + 1} de ${fotos.length}`}>
            <ImagenSegura src={foto} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-noche/60 to-transparent" aria-hidden="true" />
      <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-noche/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
        <Expand aria-hidden="true" size={12} /> {esDelDestino ? 'Foto del destino' : `${actual + 1} / ${fotos.length}`}
      </span>
      {fotos.length > 1 && (
        <>
          <button type="button" onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Foto anterior" className={`${flecha} left-3`}><ChevronLeft aria-hidden="true" size={20} /></button>
          <button type="button" onClick={() => ir(actual + 1)} disabled={actual === fotos.length - 1} aria-label="Foto siguiente" className={`${flecha} right-3`}><ChevronRight aria-hidden="true" size={20} /></button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
            {fotos.map((foto, indice) => <span key={foto} className={`h-1.5 rounded-full bg-white transition-all duration-300 ${indice === actual ? 'w-5' : 'w-1.5 opacity-60'}`} />)}
          </div>
        </>
      )}
    </div>
  )
}

function FechaGrande({ fecha }) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const nombreMes = new Date(anio, mes - 1, dia).toLocaleDateString('es-BO', { month: 'short' }).replace('.', '')
  return (
    <span className="flex flex-col items-end leading-none">
      <span className="titulo-display text-[40px] text-noche">{dia}</span>
      <span className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-cobre-texto">{nombreMes} {anio}</span>
    </span>
  )
}

// Historial "Mis viajes realizados": línea de tiempo vertical, el más reciente arriba.
function ViajesRealizados() {
  const { usuario } = useAuth()
  const [viajes, setViajes] = useState([])
  const [destinos, setDestinos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ventana, setVentana] = useState(null) // { tipo: 'nuevo' | 'editar' | 'eliminar', viaje }
  const [visor, setVisor] = useState(null) // { fotos, indice, titulo }
  const [procesando, setProcesando] = useState(false)
  const [errorVentana, setErrorVentana] = useState('')

  useEffect(() => {
    let activo = true
    Promise.all([
      getViajesDeUsuario(usuario.uid),
      getDestinos(),
      getDepartamentos().catch(() => []),
      getMunicipios().catch(() => []),
    ])
      .then(([listaViajes, listaDestinos, listaDepartamentos, listaMunicipios]) => {
        if (!activo) return
        setViajes(listaViajes)
        setDestinos(listaDestinos)
        setDepartamentos(listaDepartamentos.length ? listaDepartamentos : departamentosDeEjemplo)
        setMunicipios(listaMunicipios.length ? listaMunicipios : municipiosDeEjemplo)
      })
      .catch((errorLectura) => {
        console.error('Error al cargar el historial de viajes:', errorLectura)
        if (activo) setError('No pudimos cargar tu historial. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [usuario.uid])

  const historial = ordenarHistorial(viajes)
  const destinoPorId = new Map(destinos.map((destino) => [destino.id, destino]))
  const nombreDe = (lista, id) => lista.find((item) => item.id === id)?.nombre

  function reemplazar(actualizado) {
    setViajes((lista) => {
      const existe = lista.some((viaje) => viaje.id === actualizado.id)
      return existe ? lista.map((viaje) => (viaje.id === actualizado.id ? actualizado : viaje)) : [actualizado, ...lista]
    })
  }

  async function guardarNuevo(datos) {
    reemplazar(await registrarViajeRealizado(usuario.uid, datos))
    setVentana(null)
    setAviso('¡Listo! Tu viaje quedó guardado en el historial.')
  }

  async function guardarEdicion(datos) {
    reemplazar(await editarViajeRealizado(ventana.viaje, datos))
    setVentana(null)
    setAviso('Cambios guardados.')
  }

  async function confirmarEliminacion() {
    const { viaje } = ventana
    setErrorVentana('')
    setProcesando(true)
    try {
      if (viaje.origen === 'manual') {
        await eliminarViaje(viaje)
        setViajes((lista) => lista.filter((otro) => otro.id !== viaje.id))
        setAviso('Registro eliminado del historial.')
      } else {
        // Sale del historial pero el viaje sigue en el planificador.
        reemplazar(await devolverAPlanificado(viaje))
        setAviso('El viaje volvió a tus viajes planificados.')
      }
      setVentana(null)
    } catch (errorAccion) {
      console.error('Error al quitar el viaje del historial:', errorAccion)
      setErrorVentana('No se pudo completar la acción. Inténtalo de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1100px] py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="rotulo mb-3">Diario de viaje</p>
            <h1 className="titulo-display text-[44px] sm:text-[56px]">Mis viajes realizados</h1>
            <p className="texto-lectura mt-3 text-lg text-piedra-texto">Los lugares que ya conociste, con tus fotos y recuerdos.</p>
          </div>
          <button type="button" onClick={() => setVentana({ tipo: 'nuevo' })} className={claseBoton('primario', 'normal', 'px-6')}>
            <Plus aria-hidden="true" /> Registrar un viaje
          </button>
        </div>
        <PestanasViajes />

        {error && <p className="mb-6 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {aviso && <p className="mb-6 animate-entrar rounded-control bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{aviso}</p>}

        {cargando ? (
          <div className="space-y-8" aria-hidden="true">
            {[0, 1].map((indice) => <div key={indice} className="ml-12 h-96 animate-pulse rounded-tarjeta bg-sal-2 sm:ml-44" />)}
          </div>
        ) : historial.length === 0 ? (
          !error && (
            <EstadoVacio
              icono={BookHeart}
              titulo="Tu diario de viajes está esperando su primera página"
              mensaje="Registra un lugar que ya visitaste (aunque haya sido hace años) o marca como realizado uno de tus viajes planificados."
              accion={
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setVentana({ tipo: 'nuevo' })} className={claseBoton('oscuro')}><Plus aria-hidden="true" size={18} /> Registrar mi primer viaje</button>
                  <Link to="/viajes" className={claseBoton('fantasma')}><Route aria-hidden="true" size={18} /> Ver mis planificados</Link>
                </div>
              }
            />
          )
        ) : (
          <ol className="relative">
            {/* La línea de la línea de tiempo. */}
            <span aria-hidden="true" className="absolute bottom-4 left-[15px] top-2 w-0.5 rounded-full bg-gradient-to-b from-atardecer-700 via-borde to-transparent sm:left-[159px]" />
            {historial.map((viaje, indice) => {
              const anio = viaje.fecha_visita.slice(0, 4)
              const mostrarAnio = indice === 0 || historial[indice - 1].fecha_visita.slice(0, 4) !== anio
              const visitados = (viaje.destinos_visitados || []).map((id) => destinoPorId.get(id)).filter(Boolean)
              const propias = Array.isArray(viaje.fotos) ? viaje.fotos : []
              const fotosDestino = visitados.map((destino) => destino.imagen_principal).filter(Boolean).slice(0, 1)
              const fotos = propias.length > 0 ? propias : fotosDestino
              const titulo = viaje.origen === 'manual' ? visitados[0]?.nombre || 'Destino no disponible' : viaje.nombre
              const esManual = viaje.origen === 'manual'
              return (
                <li key={viaje.id} className="relative">
                  {mostrarAnio && (
                    <p className="relative mb-6 ml-10 pt-2 sm:ml-[184px]">
                      <span className="titulo-display text-[30px] text-piedra-texto">{anio}</span>
                    </p>
                  )}
                  <Aparecer indice={indice} className="relative mb-10 flex gap-4 pl-10 sm:gap-6 sm:pl-0">
                    <span aria-hidden="true" className="absolute left-[8px] top-7 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white bg-atardecer-700 shadow-[0_0_0_4px_rgb(232_150_110/0.25)] sm:left-[152px]" />
                    <div className="hidden w-[132px] shrink-0 pt-4 sm:block">
                      <FechaGrande fecha={viaje.fecha_visita} />
                    </div>
                    <article className="min-w-0 flex-1 overflow-hidden rounded-tarjeta border border-borde bg-white shadow-suave sm:ml-12">
                      {fotos.length > 0 && (
                        <GaleriaRecuerdo
                          fotos={fotos}
                          titulo={titulo}
                          esDelDestino={propias.length === 0}
                          onAmpliar={(posicion) => setVisor({ fotos, indice: posicion, titulo })}
                        />
                      )}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-cobre-texto sm:hidden"><CalendarCheck aria-hidden="true" size={15} /> {formatearFechaEvento(viaje.fecha_visita)}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${esManual ? 'bg-sal-2 text-piedra-texto' : 'bg-cielo text-noche'}`}>
                            {esManual ? 'Registro manual' : 'Desde mi planificador'}
                          </span>
                        </div>
                        <h2 className="titulo-display mt-2 break-words text-[32px] leading-tight">{titulo}</h2>

                        <ul className="mt-3 flex flex-wrap gap-2">
                          {visitados.map((destino) => (
                            <li key={destino.id}>
                              <Link to={`/destinos/${destino.id}`} className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-borde bg-sal px-3 text-sm transition hover:border-piedra/50 hover:bg-white">
                                <MapPin aria-hidden="true" size={14} className="text-atardecer-texto" />
                                {!esManual && <span className="font-bold text-noche">{destino.nombre}</span>}
                                <span className="text-piedra-texto">{[nombreDe(municipios, destino.id_municipio), nombreDe(departamentos, destino.id_departamento)].filter(Boolean).join(', ') || destino.ubicacion}</span>
                                <ArrowRight aria-hidden="true" size={13} className="text-cielo-700 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            </li>
                          ))}
                          {visitados.length === 0 && <li className="text-sm text-piedra-texto">El destino ya no está en el catálogo.</li>}
                        </ul>

                        {viaje.recuerdo && (
                          <blockquote className="relative mt-5 rounded-control bg-sal px-5 py-4 pl-11">
                            <Quote aria-hidden="true" size={18} className="absolute left-4 top-4 text-atardecer-texto" />
                            <p className="texto-lectura whitespace-pre-line text-noche/85">{viaje.recuerdo}</p>
                          </blockquote>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-borde pt-4">
                          <button type="button" onClick={() => setVentana({ tipo: 'editar', viaje })} className={claseBoton('secundario', 'pequeno')}><Pencil aria-hidden="true" size={15} /> Editar</button>
                          {!esManual && <Link to={`/viajes/${viaje.id}`} className={claseBoton('fantasma', 'pequeno')}><Route aria-hidden="true" size={15} /> Ver itinerario</Link>}
                          <button type="button" onClick={() => { setErrorVentana(''); setVentana({ tipo: 'eliminar', viaje }) }} className={claseBoton('fantasma', 'pequeno', 'ml-auto text-red-700 hover:bg-red-50')}>
                            {esManual ? <><Trash2 aria-hidden="true" size={15} /> Eliminar</> : <><Undo2 aria-hidden="true" size={15} /> Quitar del historial</>}
                          </button>
                        </div>
                      </div>
                    </article>
                  </Aparecer>
                </li>
              )
            })}
          </ol>
        )}
      </main>

      {ventana?.tipo === 'nuevo' && (
        <Modal titulo="Registrar un viaje" onCerrar={() => setVentana(null)}>
          <div className="p-6 sm:p-8">
            <h2 className="titulo-display mb-1 pr-12 text-[32px]">Registrar un viaje</h2>
            <p className="mb-5 text-sm text-piedra-texto">Elige el destino del catálogo y guarda tus fotos y recuerdos.</p>
            <FormularioRecuerdo modo="manual" destinos={destinos} textoBoton="Guardar en mi historial" onGuardar={guardarNuevo} onCancelar={() => setVentana(null)} />
          </div>
        </Modal>
      )}

      {ventana?.tipo === 'editar' && (
        <Modal titulo="Editar recuerdo" onCerrar={() => setVentana(null)}>
          <div className="p-6 sm:p-8">
            <h2 className="titulo-display mb-5 pr-12 text-[32px]">Editar recuerdo</h2>
            <FormularioRecuerdo
              modo="editar"
              viaje={ventana.viaje}
              destinos={destinos}
              itemsDelViaje={paradasConDestino(ventana.viaje.paradas, destinos)}
              textoBoton="Guardar cambios"
              onGuardar={guardarEdicion}
              onCancelar={() => setVentana(null)}
            />
          </div>
        </Modal>
      )}

      {ventana?.tipo === 'eliminar' && (
        <Modal titulo="Quitar del historial" onCerrar={() => setVentana(null)}>
          <div className="space-y-4 p-6 sm:p-8">
            <h2 className="titulo-display pr-12 text-[32px]">{ventana.viaje.origen === 'manual' ? '¿Eliminar este registro?' : '¿Quitar del historial?'}</h2>
            <p className="text-piedra-texto">
              {ventana.viaje.origen === 'manual'
                ? 'Se borrarán la fecha, las fotos y el recuerdo de esta visita. El destino del catálogo no cambia. Esta acción no se puede deshacer.'
                : 'El viaje volverá a tus viajes planificados. Tus fotos y tu recuerdo se conservan por si lo vuelves a marcar.'}
            </p>
            {errorVentana && <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{errorVentana}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={procesando} onClick={confirmarEliminacion} className="flex min-h-11 flex-1 items-center justify-center rounded-control bg-red-700 px-4 font-bold text-white transition hover:bg-red-800 disabled:opacity-60">
                {procesando ? 'Procesando...' : ventana.viaje.origen === 'manual' ? 'Sí, eliminar' : 'Sí, quitar'}
              </button>
              <button type="button" onClick={() => setVentana(null)} className={claseBoton('secundario')}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {visor && (
        <VisorImagenes imagenes={visor.fotos} indice={visor.indice} titulo={visor.titulo} onCambiar={(indice) => setVisor({ ...visor, indice })} onCerrar={() => setVisor(null)} />
      )}
    </div>
  )
}

export default ViajesRealizados
