import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Ventana modal accesible: se cierra con Esc, con el botón × o al hacer clic
// fuera; bloquea el scroll del fondo y devuelve el foco a quien la abrió.
// Se dibuja al final de <body> (portal) para que no quede atrapada dentro de
// otro elemento, como la ventanita de un marcador del mapa.
function Modal({ titulo, onCerrar, children }) {
  const panel = useRef(null)
  // Se guarda la función más reciente para que el efecto de abajo corra una
  // sola vez (al abrir) aunque el padre pase una función nueva en cada render.
  const cerrar = useRef(onCerrar)
  useEffect(() => {
    cerrar.current = onCerrar
  })

  useEffect(() => {
    const elementoAnterior = document.activeElement
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()

    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') cerrar.current()
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => {
      window.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = desbordeAnterior
      elementoAnterior?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-brand-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onCerrar}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-700 shadow-md transition hover:bg-white"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
