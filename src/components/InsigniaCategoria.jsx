// Color de la insignia según la familia de la categoría, en tonos suaves de
// la foto del atardecer: azul crepúsculo = naturaleza y aventura, ámbar =
// cultura e historia, durazno = gastronomía.
const CREPUSCULO = 'bg-brand-50 text-brand-800'
const AMBAR = 'bg-accent-50 text-cobre-texto'
const COLORES = {
  Naturaleza: CREPUSCULO,
  Aventura: CREPUSCULO,
  Cultura: AMBAR,
  Historia: AMBAR,
  Religioso: AMBAR,
  Entretenimiento: AMBAR,
  Gastronomía: 'bg-atardecer-50 text-atardecer-texto',
}
const COLOR_POR_DEFECTO = 'bg-cielo text-cielo-700'

function InsigniaCategoria({ categoria, className = '' }) {
  if (!categoria) return null
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${COLORES[categoria] || COLOR_POR_DEFECTO} ${className}`}>
      {categoria}
    </span>
  )
}

export default InsigniaCategoria
