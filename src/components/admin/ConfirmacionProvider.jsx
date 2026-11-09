import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleHelp, TriangleAlert } from 'lucide-react'
import { ConfirmacionContext } from './confirmacionContext.js'

// Diálogo de confirmación propio (nunca el "localhost dice..." del navegador).
// Se abre con confirmar() desde cualquier página del sitio o del panel.
// tono "peligro" (eliminar, desactivar) pinta el botón en rojo; "normal", en azul noche.
// Esc o "Cancelar" cancelan; el foco empieza en "Cancelar" (la opción segura)
// y vuelve al botón que lo abrió al cerrarse.
function DialogoConfirmacion({ titulo, mensaje, textoConfirmar, tono, alResponder }) {
  const peligro = tono !== 'normal'
  const idTitulo = useId()
  const idMensaje = useId()
  const cancelar = useRef(null)
  const aceptar = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    const desborde = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelar.current?.focus()
    return () => {
      document.body.style.overflow = desborde
      anterior?.focus?.()
    }
  }, [])

  function alPresionarTecla(evento) {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      alResponder(false)
    }
    // El foco se queda entre los dos botones del diálogo.
    if (evento.key === 'Tab') {
      evento.preventDefault()
      const siguiente = document.activeElement === cancelar.current ? aceptar.current : cancelar.current
      siguiente?.focus()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-noche/40 p-4 sm:items-center" onClick={() => alResponder(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensaje}
        onKeyDown={alPresionarTecla}
        onClick={(evento) => evento.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-panel-borde bg-panel-superficie p-6 shadow-[0_18px_48px_rgb(14_34_51/0.18)]"
      >
        <div className="flex gap-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${peligro ? 'bg-red-50 text-red-700' : 'bg-cielo text-cielo-700'}`} aria-hidden="true">
            {peligro ? <TriangleAlert size={20} /> : <CircleHelp size={20} />}
          </span>
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-lg font-bold text-panel-texto">{titulo}</h2>
            <p id={idMensaje} className="mt-1.5 text-sm leading-6 text-panel-muted">{mensaje}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelar}
            type="button"
            onClick={() => alResponder(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-panel-borde bg-white px-4 text-sm font-bold text-panel-texto transition-colors duration-150 hover:bg-panel-fondo"
          >
            Cancelar
          </button>
          <button
            ref={aceptar}
            type="button"
            onClick={() => alResponder(true)}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-white transition-colors duration-150 ${peligro ? 'bg-red-700 hover:bg-red-800' : 'bg-noche hover:bg-[#1b3448]'}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Envuelve toda la app (ver main.jsx) y le da confirmar().
function ConfirmacionProvider({ children }) {
  const [pedido, setPedido] = useState(null)

  const confirmar = useCallback(({ titulo, mensaje = 'Esta acción no se puede deshacer.', textoConfirmar = 'Eliminar', tono = 'peligro' }) => (
    new Promise((resolver) => {
      setPedido({ titulo, mensaje, textoConfirmar, tono, resolver })
    })
  ), [])

  function responder(respuesta) {
    pedido?.resolver(respuesta)
    setPedido(null)
  }

  return (
    <ConfirmacionContext.Provider value={confirmar}>
      {children}
      {pedido && (
        <DialogoConfirmacion
          titulo={pedido.titulo}
          mensaje={pedido.mensaje}
          textoConfirmar={pedido.textoConfirmar}
          tono={pedido.tono}
          alResponder={responder}
        />
      )}
    </ConfirmacionContext.Provider>
  )
}

export default ConfirmacionProvider
