import { useState } from 'react'
import { useNotificaciones } from '../context/useNotificaciones.js'
import { TIPOS_DE_NOTIFICACION } from '../services/notificacionesService.js'

// Interruptores para elegir qué notificaciones recibir (se guarda al tocar).
function AjustesNotificaciones() {
  const { listo, tipos, cambiarTipos } = useNotificaciones()
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)

  async function alternar(id) {
    setError('')
    setGuardado(false)
    try {
      await cambiarTipos({ ...tipos, [id]: !tipos[id] })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } catch (errorGuardado) {
      console.error('Error al guardar ajustes de notificaciones:', errorGuardado)
      setError('No se pudo guardar el cambio. Inténtalo de nuevo.')
    }
  }

  return (
    <section id="ajustes-notificaciones" className="scroll-mt-24 rounded-[2rem] p-6 cristal sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900">Notificaciones</h2>
        <span className="text-sm font-semibold text-emerald-700" aria-live="polite">{guardado ? '✓ Guardado' : ''}</span>
      </div>
      <p className="mb-4 text-sm text-slate-600">Elige de qué quieres enterarte. Las verás en la campana de la barra superior.</p>
      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      <ul className="space-y-3">
        {TIPOS_DE_NOTIFICACION.map((tipo) => {
          const activo = tipos[tipo.id] !== false
          return (
            <li key={tipo.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-white/80">
              <span>
                <span className="block font-semibold text-slate-900">{tipo.etiqueta}</span>
                <span className="block text-sm text-slate-600">{tipo.descripcion}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={activo}
                aria-label={tipo.etiqueta}
                disabled={!listo}
                onClick={() => alternar(tipo.id)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${activo ? 'bg-brand-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${activo ? 'left-6' : 'left-1'}`} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default AjustesNotificaciones
