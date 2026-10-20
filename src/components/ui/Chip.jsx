import { X } from 'lucide-react'
import { iconoDeCategoria } from './iconosCategoria.js'

const BASE = 'inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 font-ui text-sm font-bold transition duration-150'
const INACTIVO = 'bg-cielo text-noche'
const ACTIVO = 'bg-noche text-white'

// Píldora para categorías y filtros.
//  - Con onClick es un botón que se activa/desactiva (aria-pressed).
//  - Con onQuitar muestra una ✕ para quitarla (filtros activos).
//  - Sin ninguno de los dos es solo una etiqueta.
function Chip({ activo = false, icono: Icono, onClick, onQuitar, etiquetaQuitar, className = '', children }) {
  const colores = activo ? ACTIVO : INACTIVO
  const icono = Icono && <Icono aria-hidden="true" size={18} className="shrink-0" />

  if (onQuitar) {
    return (
      <span className={`${BASE} pr-1.5 ${colores} ${className}`}>
        {icono}
        {children}
        <button
          type="button"
          onClick={onQuitar}
          aria-label={etiquetaQuitar || `Quitar ${typeof children === 'string' ? children : 'filtro'}`}
          className="-my-1 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-cielo-600"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </span>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={activo}
        className={`${BASE} ${colores} ${activo ? '' : 'hover:bg-cielo-600/25'} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cielo-600 ${className}`}
      >
        {icono}
        {children}
      </button>
    )
  }

  return <span className={`${BASE} ${colores} ${className}`}>{icono}{children}</span>
}

// Chip de una categoría del catálogo con su icono.
export function ChipCategoria({ nombre, ...resto }) {
  return <Chip icono={iconoDeCategoria(nombre)} {...resto}>{nombre}</Chip>
}

export default Chip
