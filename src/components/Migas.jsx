import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'

// Migas de pan + botón "Volver". pasos: [{ etiqueta, to }]; el último es la
// página actual y no lleva enlace. "Volver" regresa a la página anterior real
// (mapa, favoritos, búsqueda...) y, si se entró directo por un enlace, va al
// penúltimo paso.
function Migas({ pasos }) {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const anterior = [...pasos].reverse().find((paso, indice) => indice > 0 && paso.to)

  function volver() {
    // "default" significa que esta es la primera página del historial de la app.
    if (ubicacion.key !== 'default') navegar(-1)
    else navegar(anterior?.to || '/')
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={volver}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-borde bg-white px-4 text-sm font-bold text-noche transition hover:bg-cielo"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Volver
      </button>
      <nav aria-label="Ruta de navegación">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-piedra-texto">
          {pasos.map((paso, indice) => {
            const esUltimo = indice === pasos.length - 1
            return (
              <li key={paso.etiqueta + indice} className="flex items-center gap-1.5">
                {indice > 0 && <ChevronRight aria-hidden="true" size={16} className="text-piedra" />}
                {paso.to && !esUltimo ? (
                  <Link to={paso.to} className="font-semibold text-cielo-700 hover:underline">{paso.etiqueta}</Link>
                ) : (
                  <span aria-current={esUltimo ? 'page' : undefined} className={esUltimo ? 'font-semibold text-noche' : ''}>{paso.etiqueta}</span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}

export default Migas
