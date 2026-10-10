// Color de la insignia según la familia de la categoría:
// verde = naturaleza y aventura, ámbar = cultura e historia, naranja = gastronomía.
const COLORES = {
  Naturaleza: 'bg-emerald-100 text-emerald-800',
  Aventura: 'bg-emerald-100 text-emerald-800',
  Cultura: 'bg-amber-100 text-amber-800',
  Historia: 'bg-amber-100 text-amber-800',
  Religioso: 'bg-amber-100 text-amber-800',
  Entretenimiento: 'bg-amber-100 text-amber-800',
  Gastronomía: 'bg-orange-100 text-orange-800',
}
const COLOR_POR_DEFECTO = 'bg-brand-100 text-brand-800'

function InsigniaCategoria({ categoria, className = '' }) {
  if (!categoria) return null
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${COLORES[categoria] || COLOR_POR_DEFECTO} ${className}`}>
      {categoria}
    </span>
  )
}

export default InsigniaCategoria
