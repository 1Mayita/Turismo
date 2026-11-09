import { NavLink } from 'react-router-dom'
import { BookOpenCheck, Route } from 'lucide-react'

const PESTANAS = [
  { to: '/viajes', etiqueta: 'Planificados', icono: Route, end: true },
  { to: '/viajes/realizados', etiqueta: 'Realizados', icono: BookOpenCheck },
]

// Navegación entre las dos vistas de "Mis viajes": el planificador y el
// historial de viajes realizados.
function PestanasViajes() {
  return (
    <nav aria-label="Secciones de mis viajes" className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="inline-flex gap-1 rounded-full border border-borde bg-white p-1 shadow-suave">
        {PESTANAS.map(({ to, etiqueta, icono: Icono, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors duration-200 ${isActive ? 'bg-noche text-white' : 'text-noche hover:bg-sal-2'}`}
            >
              <Icono aria-hidden="true" size={17} />
              {etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default PestanasViajes
