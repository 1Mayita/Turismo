import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ExternalLink, LayoutGrid } from 'lucide-react'
import { GRUPOS_ADMIN, seccionActual } from './seccionesAdmin.js'

function claseEnlace({ isActive }) {
  return `group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-panel-azul-suave text-panel-texto before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-panel-azul'
      : 'text-panel-muted hover:bg-panel-fondo hover:text-panel-texto'
  }`
}

function ListaDeGrupos({ alElegir }) {
  return GRUPOS_ADMIN.map((grupo) => (
    <div key={grupo.titulo}>
      <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-panel-muted/80">{grupo.titulo}</p>
      <ul className="space-y-0.5">
        {grupo.enlaces.map(({ to, etiqueta, icono: Icono }) => (
          <li key={to}>
            <NavLink to={to} onClick={alElegir} className={claseEnlace}>
              <Icono aria-hidden="true" size={18} className="shrink-0 opacity-80 group-aria-[current=page]:text-panel-azul group-aria-[current=page]:opacity-100" />
              {etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  ))
}

// Barra lateral del panel (escritorio).
function AdminNav() {
  return (
    <nav aria-label="Navegación de administración" className="flex h-full flex-col gap-6 px-3 py-6">
      <div className="px-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-panel-muted">Administración</p>
        <p className="mt-0.5 text-base font-bold text-panel-texto">Rutas de Bolivia</p>
      </div>
      <div className="space-y-5">
        <ListaDeGrupos />
      </div>
      <Link to="/" className="mt-auto flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-panel-muted transition-colors hover:bg-panel-fondo hover:text-panel-texto">
        <ExternalLink aria-hidden="true" size={16} />
        Ver el sitio público
      </Link>
    </nav>
  )
}

// Navegación del panel en celular y tablet: un botón con la sección actual
// que despliega todas las secciones agrupadas en una cuadrícula.
export function AdminNavMovil() {
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)
  const actual = seccionActual(pathname)
  const IconoActual = actual?.enlace.icono || LayoutGrid

  useEffect(() => {
    if (!abierto) return
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [abierto])

  return (
    <nav aria-label="Navegación de administración" className="mb-6 lg:hidden">
      <div className="flex">
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          aria-controls="secciones-admin"
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-panel-borde bg-white px-4 text-left shadow-[0_1px_2px_rgb(14_34_51/0.04)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-azul-suave text-panel-azul" aria-hidden="true">
            <IconoActual size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-panel-muted">Sección</span>
            <span className="block truncate text-sm font-bold text-panel-texto">{actual?.enlace.etiqueta || 'Panel'}</span>
          </span>
          <ChevronDown aria-hidden="true" size={18} className={`shrink-0 text-panel-muted transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {abierto && (
        <div id="secciones-admin" className="mt-2 animate-desplegar rounded-xl border border-panel-borde bg-white p-3 shadow-elevada">
          <div className="grid gap-4 sm:grid-cols-2">
            <ListaDeGrupos alElegir={() => setAbierto(false)} />
          </div>
          <div className="mt-4 border-t border-panel-borde pt-3">
            <Link to="/" className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-panel-muted hover:bg-panel-fondo">
              <ExternalLink aria-hidden="true" size={16} />
              Ver el sitio público
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default AdminNav
