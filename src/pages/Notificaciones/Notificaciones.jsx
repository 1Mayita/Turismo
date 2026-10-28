import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import { claseBoton } from '../../components/ui/estilos.js'
import ListaNotificaciones from '../../components/ListaNotificaciones.jsx'
import { useNotificaciones } from '../../context/useNotificaciones.js'

function Notificaciones() {
  const { listo, noLeidas, marcarTodasLeidas, error } = useNotificaciones()

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-3xl py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 rotulo">Mi cuenta</p>
            <h1 className="titulo-display text-[44px] sm:text-[52px]">Notificaciones</h1>
            <p className="mt-2 text-piedra-texto">{noLeidas > 0 ? `Tienes ${noLeidas} sin leer.` : 'Estás al día.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {noLeidas > 0 && (
              <button type="button" onClick={() => marcarTodasLeidas()} className={claseBoton('secundario', 'pequeno', 'bg-white')}>Marcar todas como leídas</button>
            )}
            <Link to="/perfil#ajustes-notificaciones" className={claseBoton('fantasma', 'pequeno')}>Elegir qué recibir</Link>
          </div>
        </div>

        {error && <p className="mb-4 rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <div className="overflow-hidden rounded-tarjeta border border-borde bg-white shadow-suave">
          {listo ? <ListaNotificaciones /> : (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, indice) => <div key={indice} className="h-16 animate-pulse rounded-control bg-sal-2" />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Notificaciones
