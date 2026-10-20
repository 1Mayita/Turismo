import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// Foto ampliada a pantalla completa. Se maneja con teclado: Esc cierra y las
// flechas pasan de foto. Al cerrar, el foco vuelve al elemento que lo abrió.
function VisorImagenes({ imagenes, indice, titulo, onCambiar, onCerrar }) {
  const botonCerrar = useRef(null)
  const total = imagenes.length

  useEffect(() => {
    const elementoAnterior = document.activeElement
    botonCerrar.current?.focus()
    return () => elementoAnterior?.focus?.()
  }, [])

  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') onCerrar()
      else if (evento.key === 'ArrowRight' && total > 1) onCambiar((indice + 1) % total)
      else if (evento.key === 'ArrowLeft' && total > 1) onCambiar((indice - 1 + total) % total)
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [indice, total, onCambiar, onCerrar])

  const claseFlecha = 'absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${titulo}`}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-noche/95 p-6"
      onClick={onCerrar}
    >
      <button
        ref={botonCerrar}
        type="button"
        onClick={onCerrar}
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
        aria-label="Cerrar"
      >
        <X aria-hidden="true" />
      </button>

      <img
        src={imagenes[indice]}
        alt={`${titulo}, foto ${indice + 1} de ${total}`}
        onClick={(evento) => evento.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-imagen object-contain sm:max-w-4xl"
      />

      {total > 1 && (
        <>
          <button type="button" aria-label="Foto anterior" onClick={(evento) => { evento.stopPropagation(); onCambiar((indice - 1 + total) % total) }} className={`${claseFlecha} left-3 sm:left-6`}><ChevronLeft aria-hidden="true" size={26} /></button>
          <button type="button" aria-label="Foto siguiente" onClick={(evento) => { evento.stopPropagation(); onCambiar((indice + 1) % total) }} className={`${claseFlecha} right-3 sm:right-6`}><ChevronRight aria-hidden="true" size={26} /></button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1 text-sm font-bold text-white" aria-hidden="true">
            {indice + 1} / {total}
          </p>
        </>
      )}
    </div>
  )
}

export default VisorImagenes
