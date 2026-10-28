import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Copy, Lock, Pencil } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { EstadoVacio, claseBoton } from '../../components/ui'
import { useAuth } from '../../context/useAuth.js'
import { useTituloPagina } from '../../hooks/useTituloPagina.js'
import { getDestinos } from '../../services/destinosService.js'
import { copiarViajeCompartido, getViajeCompartido } from '../../services/viajesService.js'
import Itinerario from './Itinerario.jsx'
import { paradasConDestino, textoDeFechas } from './utilidades.js'

// Itinerario abierto desde un enlace compartido: solo lectura, sin pedir cuenta.
function ViajeCompartido() {
  const { token } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [viaje, setViaje] = useState(null)
  const [destinos, setDestinos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [copiando, setCopiando] = useState(false)

  useEffect(() => {
    let activo = true
    Promise.all([getViajeCompartido(token), getDestinos()])
      .then(([encontrado, listaDestinos]) => {
        if (!activo) return
        if (!encontrado) setError('Este enlace ya no está disponible: puede que su dueño lo haya desactivado.')
        else setViaje(encontrado)
        setDestinos(listaDestinos)
      })
      .catch((errorLectura) => {
        console.error('Error al abrir el viaje compartido:', errorLectura)
        if (activo) setError('No pudimos abrir este viaje. Revisa el enlace e inténtalo de nuevo.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [token])

  useTituloPagina(viaje?.nombre || 'Viaje compartido')

  async function copiarAMiCuenta() {
    if (!usuario) {
      navegar('/login', { state: { desde: ubicacion.pathname, aviso: 'Inicia sesión para copiar este viaje a tu cuenta.' } })
      return
    }
    setCopiando(true)
    setError('')
    try {
      const copia = await copiarViajeCompartido(viaje, usuario.uid)
      navegar(`/viajes/${copia.id}`)
    } catch (errorCopia) {
      console.error('Error al copiar el viaje:', errorCopia)
      setError('No se pudo copiar el viaje. Inténtalo de nuevo.')
      setCopiando(false)
    }
  }

  const items = viaje ? paradasConDestino(viaje.paradas, destinos).filter((item) => item.destino) : []
  const esMio = viaje && usuario && viaje.id_usuario === usuario.uid

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] py-10">
        {cargando ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-tarjeta bg-sal-2" />
            <div className="h-80 animate-pulse rounded-tarjeta bg-sal-2" />
          </div>
        ) : !viaje ? (
          <EstadoVacio
            icono={Lock}
            titulo={error}
            className="mx-auto max-w-xl"
            accion={<Link to="/destinos" className={claseBoton('secundario', 'normal', 'bg-white')}>Explorar destinos</Link>}
          />
        ) : (
          <>
            <header className="mb-10 flex flex-wrap items-start justify-between gap-5 rounded-tarjeta border border-borde bg-white p-6 shadow-suave sm:p-8">
              <div className="min-w-0">
                <p className="rotulo">Viaje compartido · {textoDeFechas(viaje)}</p>
                <h1 className="titulo-display mt-1 break-words text-[40px] sm:text-[52px]">{viaje.nombre}</h1>
                <p className="mt-1 text-sm text-piedra-texto">Armado por {viaje.nombre_autor || 'un viajero'} · {items.length} {items.length === 1 ? 'destino' : 'destinos'} · Solo lectura</p>
                {viaje.notas && <p className="texto-lectura mt-3 whitespace-pre-line text-noche/85">{viaje.notas}</p>}
              </div>
              {esMio ? (
                <Link to={`/viajes/${viaje.id_viaje}`} className={claseBoton('secundario', 'pequeno', 'bg-white')}><Pencil aria-hidden="true" size={16} /> Es tu viaje: editarlo</Link>
              ) : (
                <button type="button" onClick={copiarAMiCuenta} disabled={copiando} className={claseBoton('primario', 'pequeno')}>
                  <Copy aria-hidden="true" size={16} />
                  {copiando ? 'Copiando...' : usuario ? 'Copiar este viaje a mi cuenta' : 'Inicia sesión para copiarlo'}
                </button>
              )}
            </header>
            {error && <p className="mb-4 rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
            {items.length === 0 ? (
              <p className="rounded-control bg-sal-2 px-5 py-4 text-piedra-texto">Este viaje todavía no tiene destinos.</p>
            ) : (
              <Itinerario items={items} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ViajeCompartido
