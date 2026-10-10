import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
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
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        {cargando ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-3xl bg-white/50" />
            <div className="h-80 animate-pulse rounded-3xl bg-white/50" />
          </div>
        ) : !viaje ? (
          <div className="mx-auto max-w-xl rounded-[2rem] p-8 text-center cristal">
            <p className="text-4xl" aria-hidden="true">🔒</p>
            <p className="mt-3 text-lg font-bold text-slate-900">{error}</p>
            <Link to="/destinos" className="mt-4 inline-block rounded-xl boton-principal px-5 py-2.5 font-bold">Explorar destinos</Link>
          </div>
        ) : (
          <>
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-[2rem] p-6 cristal sm:p-8">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Viaje compartido · {textoDeFechas(viaje)}</p>
                <h1 className="mt-1 break-words text-3xl font-extrabold text-slate-900 sm:text-4xl">{viaje.nombre}</h1>
                <p className="mt-1 text-sm text-slate-600">Armado por {viaje.nombre_autor || 'un viajero'} · {items.length} {items.length === 1 ? 'destino' : 'destinos'} · Solo lectura</p>
                {viaje.notas && <p className="mt-3 max-w-2xl whitespace-pre-line text-slate-700">{viaje.notas}</p>}
              </div>
              {esMio ? (
                <Link to={`/viajes/${viaje.id_viaje}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-800 ring-1 ring-sky-100">Es tu viaje: editarlo</Link>
              ) : (
                <button type="button" onClick={copiarAMiCuenta} disabled={copiando} className="rounded-xl boton-principal px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                  {copiando ? 'Copiando...' : usuario ? 'Copiar este viaje a mi cuenta' : 'Inicia sesión para copiarlo'}
                </button>
              )}
            </header>
            {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
            {items.length === 0 ? (
              <p className="rounded-2xl p-6 text-slate-600 cristal">Este viaje todavía no tiene destinos.</p>
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
