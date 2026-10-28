// Clases compartidas de los componentes base del rediseño "Salar cálido"
// (DESIGN.md §3 y §4). Están aquí, y no dentro de cada componente, para que
// un <Link>, un <label> o un <select> que no usa el componente pueda verse
// igual (por ejemplo: <Link className={claseBoton('secundario')}>).

const VARIANTES_DE_BOTON = {
  // Relleno atardecer suave con texto azul noche. Uno solo por vista.
  primario: 'bg-atardecer-700 text-noche shadow-[0_1px_2px_rgb(168_85_47/0.22),inset_0_1px_0_rgb(255_255_255/0.25)] hover:bg-atardecer-800',
  // Borde suave sobre blanco; al pasar el mouse se oscurece el borde.
  secundario: 'border border-borde bg-white text-noche shadow-[0_1px_2px_rgb(14_34_51/0.04)] hover:border-piedra/60 hover:bg-sal',
  // Fondo noche: acción importante que no compite con el primario.
  oscuro: 'bg-noche text-white hover:bg-[#1b3448]',
  // Sin borde: acciones de poco peso (Cancelar, Ver más).
  fantasma: 'bg-transparent text-noche hover:bg-noche/[0.06]',
}

// Los dos tamaños miden al menos 44px de alto (área táctil mínima).
const TAMANOS_DE_BOTON = {
  normal: 'min-h-12 px-5 py-3 text-[15px]',
  pequeno: 'min-h-11 px-4 py-2 text-sm',
}

export function claseBoton(variante = 'primario', tamano = 'normal', extra = '') {
  return [
    'inline-flex items-center justify-center gap-2 rounded-control font-ui font-bold tracking-[-0.005em]',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98]',
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
  'outline-none transition duration-150 hover:border-piedra/50 focus:border-cielo-600 focus:ring-3 focus:ring-cielo-600/25',
  'aria-[invalid=true]:border-red-600 disabled:cursor-not-allowed disabled:bg-sal-2 disabled:text-piedra-texto',
].join(' ')

export const claseEtiqueta = 'mb-1.5 block font-ui text-sm font-bold text-noche'

// Tarjeta base: blanca, radio moderado, borde y sombra discretos.
export const claseTarjeta = 'rounded-tarjeta border border-borde bg-white shadow-suave'
export const claseTarjetaInteractiva = 'tarjeta-hover'

// Estilo de tarjeta "a foto completa" (el de departamentos): la foto ocupa toda
// la tarjeta y el texto va en blanco sobre un velo oscuro abajo.
export const claseTarjetaFoto = 'relative flex h-full min-h-[28rem] flex-col justify-end overflow-hidden rounded-tarjeta bg-noche text-white'

// Botón blanco "Ver más" que va dentro de estas tarjetas.
export const claseBotonFoto = 'inline-flex min-h-10 items-center gap-2 rounded-control bg-white px-4 text-sm font-bold text-noche transition-[gap] group-hover:gap-3'

// Etiqueta blanca que flota sobre la foto (tipo, origen, calificación...).
export const claseEtiquetaFoto = 'inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-noche shadow-suave'
