import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import ListaNotificaciones from '../../components/ListaNotificaciones.jsx'
import { useNotificaciones } from '../../context/useNotificaciones.js'

function Notificaciones() {
  const { listo, noLeidas, marcarTodasLeidas, error } = useNotificaciones()

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Mi cuenta</p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Notificaciones</h1>
            <p className="mt-2 text-slate-600">{noLeidas > 0 ? `Tienes ${noLeidas} sin leer.` : 'Estás al día.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {noLeidas > 0 && (
              <button type="button" onClick={() => marcarTodasLeidas()} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800">Marcar todas como leídas</button>
            )}
            <Link to="/perfil#ajustes-notificaciones" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-800 ring-1 ring-sky-100">Elegir qué recibir</Link>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-white">
          {listo ? <ListaNotificaciones /> : (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, indice) => <div key={indice} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Notificaciones
