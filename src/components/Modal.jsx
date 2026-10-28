import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

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
    <div className="fixed inset-0 z-[1000] flex animate-fundido items-end justify-center bg-noche/45 p-0 sm:items-center sm:p-6" onClick={onCerrar}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-2xl animate-subir overflow-y-auto rounded-t-tarjeta bg-white shadow-flotante outline-none sm:rounded-tarjeta"
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-noche shadow-suave transition hover:rotate-90 hover:bg-sal-2"
        >
          <X aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
