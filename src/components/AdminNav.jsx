import { NavLink } from 'react-router-dom'

const ENLACES = [
  { to: '/admin/estadisticas', etiqueta: 'Estadísticas' },
  { to: '/admin/destinos', etiqueta: 'Destinos' },
  { to: '/admin/departamentos', etiqueta: 'Departamentos' },
  { to: '/admin/categorias', etiqueta: 'Categorías' },
  { to: '/admin/actividades', etiqueta: 'Actividades' },
  { to: '/admin/eventos', etiqueta: 'Eventos' },
  { to: '/admin/platos', etiqueta: 'Platos típicos' },
  { to: '/admin/restaurantes', etiqueta: 'Restaurantes' },
  { to: '/admin/alojamientos', etiqueta: 'Alojamientos' },
  { to: '/admin/resenas', etiqueta: 'Reseñas' },
  { to: '/admin/reportes', etiqueta: 'Reportes' },
  { to: '/admin/usuarios', etiqueta: 'Usuarios' },
]

function claseEnlace({ isActive }) {
  return `flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold transition-colors ${
    isActive ? 'border-panel-azul text-panel-texto' : 'border-transparent text-panel-muted hover:border-panel-borde hover:text-panel-texto'
  }`
}

function AdminNav() {
  return (
    <nav aria-label="Navegación de administración" className="admin-navigation mb-8 flex gap-1 overflow-x-auto border-b border-panel-borde">
      {ENLACES.map((enlace) => (
        <NavLink key={enlace.to} to={enlace.to} className={claseEnlace}>
          {enlace.etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}

export default AdminNav
