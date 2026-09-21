import { NavLink } from 'react-router-dom'

const ENLACES = [
  { to: '/admin/destinos', etiqueta: 'Destinos' },
  { to: '/admin/departamentos', etiqueta: 'Departamentos y regiones' },
  { to: '/admin/categorias', etiqueta: 'Categorías' },
  { to: '/admin/usuarios', etiqueta: 'Usuarios' },
]

function claseEnlace({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
  }`
}

function AdminNav() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {ENLACES.map((enlace) => (
        <NavLink key={enlace.to} to={enlace.to} className={claseEnlace}>
          {enlace.etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}

export default AdminNav
