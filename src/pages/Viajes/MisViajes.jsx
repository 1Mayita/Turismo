import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
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
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Planificador</p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Mis viajes</h1>
            <p className="mt-3 text-lg text-slate-600">Arma tus recorridos, ordena las paradas y compártelos.</p>
          </div>
          <button type="button" onClick={() => setCreando(true)} className="rounded-xl boton-principal px-5 py-3 font-bold">+ Nuevo viaje</button>
        </div>

        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => <div key={indice} className="h-64 animate-pulse rounded-3xl bg-sal-2" />)}
          </div>
        ) : viajes.length === 0 ? (
          !error && (
            <div className="rounded-[2rem] p-10 text-center cristal">
              <p className="text-5xl" aria-hidden="true">🧳</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Aún no tienes viajes</h2>
              <p className="mx-auto mt-2 max-w-md text-slate-600">Crea tu primer viaje y ve agregando los lugares que quieres conocer desde el catálogo, el mapa o tus favoritos.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => setCreando(true)} className="rounded-xl boton-principal px-5 py-3 font-bold">Crear mi primer viaje</button>
                <Link to="/destinos" className="rounded-xl bg-white px-5 py-3 font-bold text-brand-800 ring-1 ring-sky-100">Explorar destinos</Link>
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {viajes.map((viaje) => {
              const items = paradasConDestino(viaje.paradas, destinos)
              const portadas = items.map((item) => item.destino?.imagen_principal).filter(Boolean).slice(0, 3)
              return (
                <Link key={viaje.id} to={`/viajes/${viaje.id}`} className="group flex flex-col overflow-hidden rounded-3xl cristal transition hover:-translate-y-1 hover:shadow-[0_22px_44px_-18px_rgba(14,116,144,0.5)]">
                  <div className="m-2 grid h-40 grid-cols-3 gap-1 overflow-hidden rounded-2xl bg-linear-to-br from-sky-400 to-brand-700">
                    {portadas.length > 0
                      ? portadas.map((url, indice) => (
                        <ImagenSegura key={url} src={url} alt="" loading="lazy" className={`h-full w-full object-cover ${portadas.length === 1 ? 'col-span-3' : portadas.length === 2 && indice === 0 ? 'col-span-2' : ''}`} />
                      ))
                      : <span className="col-span-3 flex items-center justify-center text-4xl" aria-hidden="true">🗺️</span>}
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent-600">{textoDeFechas(viaje)}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{viaje.nombre}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {items.length === 0 ? 'Sin destinos todavía' : items.map((item) => item.destino?.nombre || 'Destino no disponible').join(' → ')}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                      <span className="font-semibold text-slate-600">{items.length} {items.length === 1 ? 'destino' : 'destinos'}{viaje.token_compartido ? ' · 🔗 Compartido' : ''}</span>
                      <span className="font-semibold text-brand-700">Abrir →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <RecomendadoParaTi titulo="Ideas para tu próximo viaje" className="mt-14" />
      </main>

      {creando && (
        <Modal titulo="Nuevo viaje" onCerrar={() => setCreando(false)}>
          <div className="p-6 sm:p-8">
            <h2 className="mb-5 pr-10 text-2xl font-bold text-slate-900">Nuevo viaje</h2>
            <FormularioViaje textoBoton="Crear viaje" onGuardar={crear} onCancelar={() => setCreando(false)} />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MisViajes
