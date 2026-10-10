import { useNavigate } from 'react-router-dom'
import { useNotificaciones } from '../context/useNotificaciones.js'

const ICONO_POR_TIPO = { eventos: '🎉', destinos: '📍', recomendaciones: '✨', avisos: '📢' }

function tiempoRelativo(fecha) {
  if (typeof fecha?.toDate !== 'function') return ''
  const minutos = Math.round((Date.now() - fecha.toDate().getTime()) / 60000)
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  return fecha.toDate().toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
}

// Lista de notificaciones. Al tocar una, se marca como leída y lleva al contenido.
function ListaNotificaciones({ maximo, onElegir }) {
  const { notificaciones, marcarLeida } = useNotificaciones()
  const navegar = useNavigate()
  const visibles = maximo ? notificaciones.slice(0, maximo) : notificaciones

  function abrir(notificacion) {
    marcarLeida(notificacion.id)
    onElegir?.()
    if (notificacion.enlace) navegar(notificacion.enlace)
  }

  if (visibles.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-slate-600">No tienes notificaciones por ahora. Te avisaremos cuando haya eventos o destinos nuevos.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {visibles.map((notificacion) => (
        <li key={notificacion.id}>
          <button
            type="button"
            onClick={() => abrir(notificacion)}
            className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-brand-50 ${notificacion.leida ? '' : 'bg-sky-50/80'}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">
              {ICONO_POR_TIPO[notificacion.tipoMostrado] || '🔔'}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm ${notificacion.leida ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                {!notificacion.leida && <span className="sr-only">No leída: </span>}
                {notificacion.titulo}
              </span>
              {notificacion.mensaje && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-600">{notificacion.mensaje}</span>}
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">{tiempoRelativo(notificacion.fecha)}</span>
            </span>
            {!notificacion.leida && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ListaNotificaciones
