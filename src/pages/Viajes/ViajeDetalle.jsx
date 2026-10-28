import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarRange, Compass, Link2, Map as IconoMapa, Pencil, Plus, Share2, Trash2 } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { EstadoVacio, claseBoton } from '../../components/ui'
import Migas from '../../components/Migas.jsx'
import Modal from '../../components/Modal.jsx'
import { OpcionesCompartir } from '../../components/BotonCompartir.jsx'
import { useAuth } from '../../context/useAuth.js'
import { useTituloPagina } from '../../hooks/useTituloPagina.js'
import { getDestinos } from '../../services/destinosService.js'
import {
  activarEnlaceCompartido,
  desactivarEnlaceCompartido,
  editarDatosDeViaje,
  eliminarViaje,
  enlaceDeViajeCompartido,
  getViaje,
  guardarParadas,
  quitarDestinoDeViaje,
} from '../../services/viajesService.js'
import FormularioViaje from './FormularioViaje.jsx'
import Itinerario from './Itinerario.jsx'
import { paradasConDestino, textoDeFechas } from './utilidades.js'

function ViajeDetalle() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [viaje, setViaje] = useState(null)
  const [destinos, setDestinos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [estadoGuardado, setEstadoGuardado] = useState('')
  const [ventana, setVentana] = useState(null) // 'editar' | 'compartir' | 'eliminar'
  const [procesando, setProcesando] = useState(false)
  const [errorVentana, setErrorVentana] = useState('')

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        const [encontrado, listaDestinos] = await Promise.all([getViaje(id), getDestinos()])
        if (!activo) return
        // Las reglas de Firestore ya impiden leer viajes ajenos; esto cubre el caso
        // de un documento que existe pero no es de esta persona.
        if (!encontrado || encontrado.id_usuario !== usuario.uid) setError('No encontramos este viaje en tu cuenta.')
        else setViaje(encontrado)
        setDestinos(listaDestinos)
      } catch (errorLectura) {
        console.error('Error al cargar el viaje:', errorLectura)
        if (activo) setError(errorLectura.code === 'permission-denied' ? 'No encontramos este viaje en tu cuenta.' : 'No pudimos cargar el viaje. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [id, usuario.uid])

  useTituloPagina(viaje?.nombre || 'Mis viajes')

  // Cambia la pantalla al instante y, si Firestore falla, vuelve atrás.
  async function guardarConRespaldo(cambio) {
    const anterior = viaje
    setEstadoGuardado('Guardando...')
    try {
      const actualizado = await cambio()
      setViaje(actualizado)
      setEstadoGuardado('✓ Guardado')
      setTimeout(() => setEstadoGuardado(''), 2000)
    } catch (errorGuardado) {
      console.error('Error al guardar el viaje:', errorGuardado)
      setViaje(anterior)
      setEstadoGuardado('')
      setError(errorGuardado.message || 'No se pudo guardar el cambio. Inténtalo de nuevo.')
    }
  }

  function reordenar(paradas) {
    setError('')
    setViaje({ ...viaje, paradas })
    guardarConRespaldo(() => guardarParadas(viaje, paradas))
  }

  function quitar(idDestino, nombre) {
    if (!window.confirm(`¿Quitar "${nombre}" de este viaje?`)) return
    setError('')
    guardarConRespaldo(() => quitarDestinoDeViaje(viaje, idDestino))
  }

  async function guardarDatos(datos) {
    const actualizado = await editarDatosDeViaje(viaje, datos)
    setViaje(actualizado)
    setVentana(null)
  }

  async function ejecutar(accion) {
    setErrorVentana('')
    setProcesando(true)
    try {
      await accion()
    } catch (errorAccion) {
      console.error('Error en la acción del viaje:', errorAccion)
      setErrorVentana('No se pudo completar la acción. Inténtalo de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  const items = viaje ? paradasConDestino(viaje.paradas, destinos) : []
  const migas = [
    { etiqueta: 'Inicio', to: '/' },
    { etiqueta: 'Mis viajes', to: '/viajes' },
    { etiqueta: viaje?.nombre || 'Viaje' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] py-10">
        <Migas pasos={migas} />

        {cargando ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-tarjeta bg-sal-2" />
            <div className="h-80 animate-pulse rounded-tarjeta bg-sal-2" />
          </div>
        ) : !viaje ? (
          <EstadoVacio icono={IconoMapa} titulo={error} accion={<Link to="/viajes" className={claseBoton('secundario', 'normal', 'bg-white')}>Ir a mis viajes</Link>} />
        ) : (
          <>
            <header className="mb-10 flex flex-wrap items-start justify-between gap-5 rounded-tarjeta border border-borde bg-white p-6 shadow-suave sm:p-8">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 rotulo">
                  <CalendarRange aria-hidden="true" size={15} /> Mi viaje · {textoDeFechas(viaje)}
                </p>
                <h1 className="titulo-display mt-1 break-words text-[40px] sm:text-[52px]">{viaje.nombre}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-piedra-texto">
                  {items.length} {items.length === 1 ? 'destino' : 'destinos'}
                  {viaje.token_compartido && <><span aria-hidden="true">·</span><Link2 aria-hidden="true" size={14} /> Compartido con enlace</>}
                </p>
                {viaje.notas && <p className="texto-lectura mt-3 whitespace-pre-line text-noche/85">{viaje.notas}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setErrorVentana(''); setVentana('compartir') }} className={claseBoton('primario', 'pequeno')}>
                  <Share2 aria-hidden="true" size={16} /> Compartir
                </button>
                <button type="button" onClick={() => setVentana('editar')} className={claseBoton('secundario', 'pequeno', 'bg-white')}>
                  <Pencil aria-hidden="true" size={16} /> Editar
                </button>
                <button type="button" onClick={() => { setErrorVentana(''); setVentana('eliminar') }} className={claseBoton('fantasma', 'pequeno', 'text-red-700 hover:bg-red-50')}>
                  <Trash2 aria-hidden="true" size={16} /> Eliminar
                </button>
              </div>
            </header>

            {error && <p className="mb-4 rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="titulo-display text-[36px]">Itinerario</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-emerald-700" aria-live="polite">{estadoGuardado}</span>
                <Link to="/destinos" className={claseBoton('secundario', 'pequeno', 'bg-white')}>
                  <Plus aria-hidden="true" size={16} /> Agregar destinos
                </Link>
              </div>
            </div>

            {items.length === 0 ? (
              <EstadoVacio
                icono={Compass}
                titulo="Tu viaje todavía no tiene destinos"
                mensaje="Busca lugares en el catálogo o el mapa y toca “Agregar a mi viaje”."
                accion={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/destinos" className={claseBoton('secundario', 'normal', 'bg-white')}>Explorar destinos</Link>
                    <Link to="/mapa" className={claseBoton('fantasma')}>Abrir el mapa</Link>
                  </div>
                }
              />
            ) : (
              <>
                <p className="mb-4 text-sm text-piedra-texto">Arrastra cada parada desde su asa (los seis puntos) o usa las flechas para ordenarlas. Los cambios se guardan solos.</p>
                <Itinerario items={items} editable onReordenar={reordenar} onQuitar={quitar} />
              </>
            )}
          </>
        )}
      </main>

      {ventana === 'editar' && (
        <Modal titulo="Editar viaje" onCerrar={() => setVentana(null)}>
          <div className="p-6 sm:p-8">
            <h2 className="titulo-display mb-5 pr-12 text-[32px]">Editar viaje</h2>
            <FormularioViaje inicial={viaje} textoBoton="Guardar cambios" onGuardar={guardarDatos} onCancelar={() => setVentana(null)} />
          </div>
        </Modal>
      )}

      {ventana === 'compartir' && (
        <Modal titulo="Compartir viaje" onCerrar={() => setVentana(null)}>
          <div className="space-y-5 p-6 sm:p-8">
            <h2 className="titulo-display pr-12 text-[32px]">Compartir “{viaje.nombre}”</h2>
            {errorVentana && <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{errorVentana}</p>}
            {viaje.token_compartido ? (
              <>
                <p className="text-sm text-piedra-texto">Quien tenga este enlace verá el itinerario en modo solo lectura y podrá copiarlo a su cuenta. Los cambios que hagas se verán en el enlace.</p>
                <OpcionesCompartir
                  titulo={viaje.nombre}
                  texto={`Mira mi viaje "${viaje.nombre}" en Rutas de Bolivia:`}
                  url={enlaceDeViajeCompartido(viaje.token_compartido)}
                />
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => ejecutar(async () => setViaje(await desactivarEnlaceCompartido(viaje)))}
                  className="flex min-h-11 w-full items-center justify-center rounded-control bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {procesando ? 'Desactivando...' : 'Desactivar el enlace (dejará de funcionar para todos)'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-piedra-texto">Tu viaje es privado. Crea un enlace para compartirlo en modo solo lectura; podrás desactivarlo cuando quieras.</p>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => ejecutar(async () => setViaje(await activarEnlaceCompartido(viaje, usuario.displayName?.split(' ')[0])))}
                  className={claseBoton('primario', 'normal', 'w-full')}
                >
                  {procesando ? 'Creando enlace...' : 'Crear enlace para compartir'}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {ventana === 'eliminar' && (
        <Modal titulo="Eliminar viaje" onCerrar={() => setVentana(null)}>
          <div className="space-y-4 p-6 sm:p-8">
            <h2 className="titulo-display pr-12 text-[32px]">¿Eliminar este viaje?</h2>
            <p className="text-piedra-texto">Se borrará “{viaje.nombre}” con sus {items.length} paradas{viaje.token_compartido ? ' y el enlace compartido dejará de funcionar' : ''}. Esta acción no se puede deshacer.</p>
            {errorVentana && <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{errorVentana}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={procesando}
                onClick={() => ejecutar(async () => { await eliminarViaje(viaje); navegar('/viajes', { replace: true }) })}
                className="flex min-h-11 flex-1 items-center justify-center rounded-control bg-red-700 px-4 font-bold text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {procesando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button type="button" onClick={() => setVentana(null)} className={claseBoton('secundario')}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ViajeDetalle
