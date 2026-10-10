import { useState } from 'react'
import Modal from './Modal.jsx'

function IconoCompartir() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

// Opciones para compartir un enlace: copiar, WhatsApp, correo y, si el
// navegador lo permite (celulares), el menú de compartir del sistema.
export function OpcionesCompartir({ titulo, texto, url }) {
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState('')
  const mensaje = `${texto} ${url}`
  const puedeCompartirNativo = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copiar() {
    setError('')
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setError('Tu navegador no dejó copiar automáticamente. Selecciona el enlace y cópialo a mano.')
    }
  }

  async function compartirNativo() {
    try {
      await navigator.share({ title: titulo, text: texto, url })
    } catch (errorCompartir) {
      // Cancelar el menú del sistema no es un error.
      if (errorCompartir?.name !== 'AbortError') setError('No se pudo abrir el menú para compartir.')
    }
  }

  const claseOpcion = 'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition'

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Enlace
        <span className="mt-2 flex gap-2">
          <input readOnly value={url} onFocus={(evento) => evento.target.select()} className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700" />
          <button type="button" onClick={copiar} className={`${claseOpcion} shrink-0 ${copiado ? 'bg-emerald-600 text-white' : 'bg-brand-700 text-white hover:bg-brand-800'}`} aria-live="polite">
            {copiado ? '✓ Copiado' : 'Copiar'}
          </button>
        </span>
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className={`${claseOpcion} bg-[#25D366] text-white hover:brightness-95`}>
          WhatsApp
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(mensaje)}`} className={`${claseOpcion} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
          Correo
        </a>
        {puedeCompartirNativo && (
          <button type="button" onClick={compartirNativo} className={`${claseOpcion} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Más opciones
          </button>
        )}
      </div>
      {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  )
}

// Botón "Compartir" que abre las opciones en una ventana. Para un destino
// basta con la página actual; para un viaje se pasa el enlace público.
function BotonCompartir({ titulo, texto, url = typeof window !== 'undefined' ? window.location.href : '', className = '' }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={`inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-sky-100 transition hover:bg-brand-50 ${className}`}>
        <IconoCompartir /> Compartir
      </button>
      {abierto && (
        <Modal titulo={`Compartir ${titulo}`} onCerrar={() => setAbierto(false)}>
          <div className="p-6 sm:p-8">
            <h2 className="mb-1 pr-10 text-2xl font-bold text-slate-900">Compartir</h2>
            <p className="mb-5 text-sm text-slate-600">{titulo}</p>
            <OpcionesCompartir titulo={titulo} texto={texto} url={url} />
          </div>
        </Modal>
      )}
    </>
  )
}

export default BotonCompartir
