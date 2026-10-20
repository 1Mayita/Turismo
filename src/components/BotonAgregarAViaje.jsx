import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Luggage } from 'lucide-react'
import Modal from './Modal.jsx'
import { useAuth } from '../context/useAuth.js'
import { MAXIMO_PARADAS, agregarDestinoAViaje, crearViaje, getViajesDeUsuario, validarDatosDeViaje } from '../services/viajesService.js'

function IconoMaleta() {
  return <Luggage aria-hidden="true" className="shrink-0" />
}

// "Agregar a mi viaje": elige uno de tus viajes o crea uno nuevo en el mismo paso.
// variante="icono" es el botón redondo de las tarjetas; "boton" el del detalle.
function BotonAgregarAViaje({ destino, variante = 'boton', className = '' }) {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [viajes, setViajes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [guardandoEn, setGuardandoEn] = useState('')
  const [agregadoEn, setAgregadoEn] = useState(null)
  const [nombreNuevo, setNombreNuevo] = useState('')

  async function abrir() {
    if (!usuario) {
      navegar('/login', { state: { desde: ubicacion.pathname + ubicacion.search, aviso: 'Inicia sesión para armar tus viajes.' } })
      return
    }
    setAbierto(true)
    setError('')
    setAgregadoEn(null)
    setNombreNuevo('')
    setCargando(true)
    try {
      setViajes(await getViajesDeUsuario(usuario.uid))
    } catch (errorLectura) {
      console.error('Error al cargar los viajes:', errorLectura)
      setError('No pudimos cargar tus viajes. Inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  async function agregarA(viaje) {
    setError('')
    setGuardandoEn(viaje.id)
    try {
      const actualizado = await agregarDestinoAViaje(viaje, destino.id)
      setViajes((anteriores) => anteriores.map((item) => (item.id === viaje.id ? actualizado : item)))
      setAgregadoEn(actualizado)
    } catch (errorEscritura) {
      console.error('Error al agregar el destino al viaje:', errorEscritura)
      setError(errorEscritura.message || 'No se pudo agregar el destino.')
    } finally {
      setGuardandoEn('')
    }
  }

  async function crearYAgregar(evento) {
    evento.preventDefault()
    setError('')
    const datos = { nombre: nombreNuevo }
    const mensaje = validarDatosDeViaje(datos)
    if (mensaje) {
      setError(mensaje)
      return
    }
    setGuardandoEn('nuevo')
    try {
      const viaje = await crearViaje(usuario.uid, datos, [{ id_destino: destino.id, nota: '' }])
      setViajes((anteriores) => [viaje, ...anteriores])
      setAgregadoEn(viaje)
      setNombreNuevo('')
    } catch (errorEscritura) {
      console.error('Error al crear el viaje:', errorEscritura)
      setError(errorEscritura.message || 'No se pudo crear el viaje.')
    } finally {
      setGuardandoEn('')
    }
  }

  const estaEn = (viaje) => (viaje.paradas || []).some((parada) => parada.id_destino === destino.id)

  return (
    <>
      {variante === 'icono' ? (
        <button
          type="button"
          onClick={abrir}
          aria-label={`Agregar ${destino.nombre} a un viaje`}
          title="Agregar a un viaje"
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-cielo-700 shadow-suave backdrop-blur transition duration-150 hover:scale-105 hover:text-noche active:scale-95 ${className}`}
        >
          <IconoMaleta />
        </button>
      ) : (
        <button type="button" onClick={abrir} className={`inline-flex items-center gap-2 rounded-xl boton-principal px-4 py-2.5 text-sm font-bold ${className}`}>
          <IconoMaleta /> Agregar a mi viaje
        </button>
      )}

      {abierto && (
        <Modal titulo="Agregar a mi viaje" onCerrar={() => setAbierto(false)}>
          <div className="p-6 sm:p-8">
            <h2 className="pr-10 text-2xl font-bold text-slate-900">Agregar a mi viaje</h2>
            <p className="mt-1 text-sm text-slate-600">{destino.nombre}</p>

            {agregadoEn && (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
                <p className="font-semibold">✓ Agregado a “{agregadoEn.nombre}”.</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <Link to={`/viajes/${agregadoEn.id}`} className="font-bold text-emerald-800 underline">Ver el viaje</Link>
                  <button type="button" onClick={() => setAbierto(false)} className="font-semibold text-emerald-800 underline">Seguir explorando</button>
                </div>
              </div>
            )}
            {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

            <h3 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wider text-slate-500">Mis viajes</h3>
            {cargando ? (
              <div className="space-y-2">
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : viajes.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Aún no tienes viajes. Crea el primero aquí abajo.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {viajes.map((viaje) => {
                  const yaEsta = estaEn(viaje)
                  const lleno = (viaje.paradas || []).length >= MAXIMO_PARADAS
                  return (
                    <li key={viaje.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">{viaje.nombre}</span>
                        <span className="text-xs text-slate-500">{(viaje.paradas || []).length} {(viaje.paradas || []).length === 1 ? 'destino' : 'destinos'}</span>
                      </span>
                      {yaEsta ? (
                        <span className="shrink-0 text-sm font-semibold text-emerald-700">✓ Ya está</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => agregarA(viaje)}
                          disabled={Boolean(guardandoEn) || lleno}
                          title={lleno ? `Este viaje ya tiene ${MAXIMO_PARADAS} destinos` : undefined}
                          className="shrink-0 rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {guardandoEn === viaje.id ? 'Agregando...' : lleno ? 'Lleno' : 'Agregar'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            <form onSubmit={crearYAgregar} className="mt-6 rounded-2xl border border-dashed border-sky-300 p-4">
              <label className="block text-sm font-semibold text-slate-700">
                O crea un viaje nuevo con este destino
                <span className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={nombreNuevo}
                    onChange={(evento) => setNombreNuevo(evento.target.value)}
                    maxLength={80}
                    placeholder="Ej.: Vacaciones en el altiplano"
                    className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-4 py-2.5 font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                  />
                  <button disabled={Boolean(guardandoEn)} className="rounded-xl boton-principal px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                    {guardandoEn === 'nuevo' ? 'Creando...' : 'Crear y agregar'}
                  </button>
                </span>
              </label>
            </form>
          </div>
        </Modal>
      )}
    </>
  )
}

export default BotonAgregarAViaje
