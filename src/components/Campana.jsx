import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-white/70 hover:text-brand-700"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white" aria-hidden="true">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="font-bold text-slate-900">Notificaciones</p>
            {noLeidas > 0 && (
              <button type="button" onClick={() => marcarTodasLeidas()} className="text-xs font-bold text-brand-700 hover:underline">Marcar todas como leídas</button>
            )}
          </div>
          {error ? <p className="px-4 py-4 text-sm font-semibold text-red-700" role="alert">{error}</p> : (
            <div className="max-h-96 overflow-y-auto">
              <ListaNotificaciones maximo={6} onElegir={() => setAbierta(false)} />
            </div>
          )}
          <Link to="/notificaciones" onClick={() => setAbierta(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-brand-700 hover:bg-brand-50">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}

export default Campana
