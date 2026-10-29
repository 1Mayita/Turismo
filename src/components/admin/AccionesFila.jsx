import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'

// Botones de acción de las filas del panel (ver publicado, editar, eliminar)
// como iconos con tooltip. Solo cambia la presentación: cada uno recibe el
// mismo onClick o la misma ruta que tenía el botón de texto.
const ACCIONES = {
  ver: {
    icono: Eye,
    etiqueta: 'Ver publicado',
    color: 'text-panel-muted hover:bg-panel-azul-suave hover:text-panel-azul',
  },
  editar: {
    icono: Pencil,
    etiqueta: 'Editar',
    color: 'text-panel-muted hover:bg-atardecer/15 hover:text-atardecer-texto',
  },
  eliminar: {
    icono: Trash2,
    etiqueta: 'Eliminar',
    color: 'text-red-700 hover:bg-red-50 hover:text-red-800',
  },
}

// 40×40 en celular (área táctil) y 36×36 desde sm.
const CLASE_BASE = [
  'group/accion relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-transparent sm:h-9 sm:w-9',
  'transition-colors duration-150',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panel-azul',
].join(' ')

// tipo: 'ver' | 'editar' | 'eliminar'. Con "a" es un enlace interno; si no,
// un botón con onClick. "nombre" completa el aria-label (ej. "Editar Salar de Uyuni").
export function BotonAccion({ tipo, a, onClick, nombre, etiqueta: etiquetaPropia }) {
  const { icono: Icono, etiqueta: etiquetaBase, color } = ACCIONES[tipo]
  const etiqueta = etiquetaPropia || etiquetaBase
  const props = {
    className: `${CLASE_BASE} ${color}`,
    'aria-label': nombre ? `${etiqueta}: ${nombre}` : etiqueta,
  }
  const contenido = (
    <>
      <Icono aria-hidden="true" size={18} />
      {/* Tooltip: aparece al pasar el mouse o al llegar con el teclado. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-panel-texto px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover/accion:opacity-100 group-focus-visible/accion:opacity-100"
      >
        {etiqueta}
      </span>
    </>
  )

  if (a) return <Link to={a} {...props}>{contenido}</Link>
  return <button type="button" onClick={onClick} {...props}>{contenido}</button>
}

// Contenedor de los botones de una fila: alineados a la derecha, con 6px entre sí.
export function AccionesFila({ children, className = '' }) {
  return <div className={`inline-flex items-center justify-end gap-1.5 ${className}`}>{children}</div>
}
