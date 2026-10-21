import { useState } from 'react'
import { Check, Copy, Mail, MessageCircle, Share, Share2 } from 'lucide-react'
import Modal from './Modal.jsx'
import { claseBoton, claseControl, claseEtiqueta } from './ui/estilos.js'

function IconoCompartir() {
  return <Share2 aria-hidden="true" className="shrink-0" />
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

  const claseOpcion = 'flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-bold transition'

  return (
    <div className="space-y-3">
      <label className={claseEtiqueta}>
        Enlace
        <span className="mt-2 flex gap-2">
          <input readOnly value={url} onFocus={(evento) => evento.target.select()} className={`${claseControl} min-w-0 flex-1 bg-sal text-sm font-normal`} />
          <button type="button" onClick={copiar} className={`${claseOpcion} shrink-0 ${copiado ? 'bg-emerald-700 text-white' : 'bg-noche text-white hover:bg-noche/90'}`} aria-live="polite">
            {copiado ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </span>
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className={`${claseOpcion} bg-[#1f8a4c] text-white hover:brightness-110`}>
          <MessageCircle aria-hidden="true" size={18} />
          WhatsApp
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(mensaje)}`} className={`${claseOpcion} border border-borde bg-white text-noche hover:bg-cielo`}>
          <Mail aria-hidden="true" size={18} />
          Correo
        </a>
        {puedeCompartirNativo && (
          <button type="button" onClick={compartirNativo} className={`${claseOpcion} border border-borde bg-white text-noche hover:bg-cielo`}>
            <Share aria-hidden="true" size={18} />
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
      <button type="button" onClick={() => setAbierto(true)} className={claseBoton('secundario', 'pequeno', `bg-white ${className}`)}>
        <IconoCompartir /> Compartir
      </button>
      {abierto && (
        <Modal titulo={`Compartir ${titulo}`} onCerrar={() => setAbierto(false)}>
          <div className="p-6 sm:p-8">
            <h2 className="titulo-display mb-1 pr-12 text-[32px]">Compartir</h2>
            <p className="mb-5 text-sm text-piedra-texto">{titulo}</p>
            <OpcionesCompartir titulo={titulo} texto={texto} url={url} />
          </div>
        </Modal>
      )}
    </>
  )
}

export default BotonCompartir
