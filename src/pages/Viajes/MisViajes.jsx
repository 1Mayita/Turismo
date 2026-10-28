import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarRange, Link2, Luggage, Map as IconoMapa, Plus } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { EstadoVacio, claseBoton } from '../../components/ui'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import Modal from '../../components/Modal.jsx'
import RecomendadoParaTi from '../../components/RecomendadoParaTi.jsx'
import { useAuth } from '../../context/useAuth.js'
import { getDestinos } from '../../services/destinosService.js'
import { crearViaje, getViajesDeUsuario } from '../../services/viajesService.js'
import FormularioViaje from './FormularioViaje.jsx'
import { paradasConDestino, textoDeFechas } from './utilidades.js'

function MisViajes() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [viajes, setViajes] = useState([])
  const [destinos, setDestinos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)
  const [parametros, setParametros] = useSearchParams()
  // "/viajes?nuevo=1" (accesos rápidos del menú y del panel) abre directo el
  // formulario de viaje nuevo; al cerrarlo se quita el parámetro.
  const formularioAbierto = creando || parametros.get('nuevo') === '1'

  function cerrarFormulario() {
    setCreando(false)
    if (parametros.has('nuevo')) setParametros({}, { replace: true })
  }

  useEffect(() => {
    let activo = true
    Promise.all([getViajesDeUsuario(usuario.uid), getDestinos()])
      .then(([listaViajes, listaDestinos]) => {
        if (!activo) return
        setViajes(listaViajes)
        setDestinos(listaDestinos)
      })
      .catch((errorLectura) => {
        console.error('Error al cargar los viajes:', errorLectura)
        if (activo) setError('No pudimos cargar tus viajes. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [usuario.uid])

  async function crear(datos) {
    const viaje = await crearViaje(usuario.uid, datos)
    navegar(`/viajes/${viaje.id}`)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-borde pb-8">
          <div className="max-w-2xl">
            <p className="rotulo mb-3">Planificador</p>
            <h1 className="titulo-display text-[44px] sm:text-[56px]">Mis viajes</h1>
            <p className="texto-lectura mt-3 text-lg text-piedra-texto">Arma tus recorridos, ordena las paradas y compártelos.</p>
          </div>
          <button type="button" onClick={() => setCreando(true)} className={claseBoton('primario', 'normal', 'px-6')}>
            <Plus aria-hidden="true" /> Nuevo viaje
          </button>
        </div>

        {error && <p className="mb-6 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => <div key={indice} className="h-64 animate-pulse rounded-tarjeta bg-sal-2" />)}
          </div>
        ) : viajes.length === 0 ? (
          !error && (
            <EstadoVacio
              icono={Luggage}
              titulo="Aún no tienes viajes"
              mensaje="Crea tu primer viaje y ve agregando los lugares que quieres conocer desde el catálogo, el mapa o tus favoritos."
              accion={
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setCreando(true)} className={claseBoton('oscuro')}><Plus aria-hidden="true" size={18} /> Crear mi primer viaje</button>
                  <Link to="/destinos" className={claseBoton('fantasma')}>Explorar destinos</Link>
                </div>
              }
            />
          )
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {viajes.map((viaje) => {
              const items = paradasConDestino(viaje.paradas, destinos)
              const portadas = items.map((item) => item.destino?.imagen_principal).filter(Boolean).slice(0, 3)
              return (
                <Link key={viaje.id} to={`/viajes/${viaje.id}`} className="group tarjeta-hover flex flex-col rounded-tarjeta border border-borde bg-white p-3">
                  <div className="grid h-40 grid-cols-3 gap-1 overflow-hidden rounded-imagen bg-cielo">
                    {portadas.length > 0
                      ? portadas.map((url, indice) => (
                        <ImagenSegura key={url} src={url} alt="" loading="lazy" className={`zoom-foto h-full w-full object-cover ${portadas.length === 1 ? 'col-span-3' : portadas.length === 2 && indice === 0 ? 'col-span-2' : ''}`} />
                      ))
                      : <span className="col-span-3 flex items-center justify-center text-cielo-700" aria-hidden="true"><IconoMapa size={40} strokeWidth={1.5} /></span>}
                  </div>
                  <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-cobre-texto"><CalendarRange aria-hidden="true" size={14} /> {textoDeFechas(viaje)}</p>
                    <h2 className="titulo-display mt-1.5 text-[28px] leading-tight">{viaje.nombre}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-piedra-texto">
                      {items.length === 0 ? 'Sin destinos todavía' : items.map((item) => item.destino?.nombre || 'Destino no disponible').join(' → ')}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-borde pt-3 text-sm">
                      <span className="flex items-center gap-1.5 font-bold text-piedra-texto">
                        {items.length} {items.length === 1 ? 'destino' : 'destinos'}
                        {viaje.token_compartido && <><span aria-hidden="true">·</span><Link2 aria-hidden="true" size={14} /> Compartido</>}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-cielo-700">Abrir <ArrowRight aria-hidden="true" size={16} /></span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <RecomendadoParaTi titulo="Ideas para tu próximo viaje" className="mt-14" />
      </main>

      {formularioAbierto && (
        <Modal titulo="Nuevo viaje" onCerrar={cerrarFormulario}>
          <div className="p-6 sm:p-8">
            <h2 className="titulo-display mb-5 pr-12 text-[32px]">Nuevo viaje</h2>
            <FormularioViaje textoBoton="Crear viaje" onGuardar={crear} onCancelar={cerrarFormulario} />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MisViajes
