import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import ListaNotificaciones from './ListaNotificaciones.jsx'
import { useNotificaciones } from '../context/useNotificaciones.js'

// Campana de la barra superior con el número de notificaciones sin leer y
// un panel con las más recientes.
function Campana() {
  const { noLeidas, marcarTodasLeidas, error } = useNotificaciones()
  const [abierta, setAbierta] = useState(false)
  const contenedor = useRef(null)

  useEffect(() => {
    if (!abierta) return
    function alHacerClicFuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setAbierta(false)
    }
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setAbierta(false)
    }
    document.addEventListener('pointerdown', alHacerClicFuera)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('pointerdown', alHacerClicFuera)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [abierta])

  const etiqueta = noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        aria-expanded={abierta}
        aria-label={etiqueta}
        title={etiqueta}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full text-noche transition hover:bg-cielo/70 ${abierta ? 'bg-cielo' : ''}`}
      >
        <Bell aria-hidden="true" size={22} />
        {noLeidas > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-atardecer-700 px-1 text-[11px] font-bold text-white ring-2 ring-sal" aria-hidden="true">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-tarjeta border border-borde bg-white shadow-elevada">
          <div className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3">
            <p className="font-bold text-noche">Notificaciones</p>
            {noLeidas > 0 && (
              <button type="button" onClick={() => marcarTodasLeidas()} className="min-h-11 rounded-control px-2 text-xs font-bold text-cielo-700 hover:bg-sal-2">Marcar todas como leídas</button>
            )}
          </div>
          {error ? <p className="px-4 py-4 text-sm font-semibold text-red-700" role="alert">{error}</p> : (
            <div className="max-h-96 overflow-y-auto">
              <ListaNotificaciones maximo={6} onElegir={() => setAbierta(false)} />
            </div>
          )}
          <Link to="/notificaciones" onClick={() => setAbierta(false)} className="block border-t border-borde px-4 py-3.5 text-center text-sm font-bold text-cielo-700 hover:bg-sal-2">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}

export default Campana
