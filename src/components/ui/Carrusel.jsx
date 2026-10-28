import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Fila horizontal que se desliza con el dedo, la rueda o las flechas.
// Cada hijo directo es una "diapositiva"; su ancho lo decide quien la usa.
// En celular se ve un pedacito de la siguiente tarjeta para invitar a deslizar.
function Carrusel({ etiqueta, children, className = '' }) {
  const pista = useRef(null)

  function mover(direccion) {
    const elemento = pista.current
    if (!elemento) return
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    elemento.scrollBy({ left: direccion * elemento.clientWidth * 0.85, behavior: reducir ? 'auto' : 'smooth' })
  }

  const claseFlecha = 'flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-white text-noche transition hover:border-noche hover:bg-noche hover:text-white active:scale-95'

  return (
    <div className={className}>
      <div className="mb-4 hidden justify-end gap-2 sm:flex">
        <button type="button" onClick={() => mover(-1)} aria-label={`Anterior: ${etiqueta}`} className={claseFlecha}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={() => mover(1)} aria-label={`Siguiente: ${etiqueta}`} className={claseFlecha}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div
        ref={pista}
        role="region"
        aria-label={etiqueta}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:thin] focus-visible:outline-3 focus-visible:outline-cielo-600 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {children}
      </div>
    </div>
  )
}

export default Carrusel
