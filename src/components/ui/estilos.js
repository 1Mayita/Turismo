// Clases compartidas de los componentes base del rediseño "Salar cálido"
// (DESIGN.md §3 y §4). Están aquí, y no dentro de cada componente, para que
// un <Link>, un <label> o un <select> que no usa el componente pueda verse
// igual (por ejemplo: <Link className={claseBoton('secundario')}>).

const VARIANTES_DE_BOTON = {
  // Relleno atardecer con texto blanco. Uno solo por vista.
  primario: 'bg-atardecer-700 text-white shadow-suave hover:bg-atardecer-800',
  // Borde suave y fondo transparente; al pasar el mouse, fondo cielo.
  secundario: 'border border-borde bg-transparent text-noche hover:bg-cielo',
  // Sin borde: acciones de poco peso (Cancelar, Ver más).
  fantasma: 'bg-transparent text-noche hover:bg-cielo/70',
}

// Los dos tamaños miden al menos 44px de alto (área táctil mínima).
const TAMANOS_DE_BOTON = {
  normal: 'min-h-11 px-5 py-3 text-base',
  pequeno: 'min-h-11 px-4 py-2 text-sm',
}

export function claseBoton(variante = 'primario', tamano = 'normal', extra = '') {
  return [
    'inline-flex items-center justify-center gap-2 rounded-control font-ui font-bold',
    'transition-colors duration-150 ease-out',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cielo-600',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTES_DE_BOTON[variante] || VARIANTES_DE_BOTON.primario,
    TAMANOS_DE_BOTON[tamano] || TAMANOS_DE_BOTON.normal,
    extra,
  ].join(' ')
}

// Inputs, selects y textareas: fondo blanco, borde suave y anillo cielo al enfocar.
export const claseControl = [
  'block w-full min-h-11 rounded-control border border-borde bg-white px-4 py-2.5',
  'font-ui text-base text-noche placeholder:text-piedra-texto',
  'outline-none transition duration-150 focus:border-cielo-600 focus:ring-3 focus:ring-cielo-600/30',
  'aria-[invalid=true]:border-red-600 disabled:cursor-not-allowed disabled:bg-sal-2 disabled:text-piedra-texto',
].join(' ')

export const claseEtiqueta = 'mb-1.5 block font-ui text-sm font-bold text-noche'

// Tarjeta base: blanca, radio moderado, borde y sombra discretos.
export const claseTarjeta = 'rounded-tarjeta border border-borde bg-white shadow-suave'
export const claseTarjetaInteractiva = 'transition-shadow duration-150 ease-out hover:shadow-elevada'
