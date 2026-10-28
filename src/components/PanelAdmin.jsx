import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import Navbar from './Navbar.jsx'
import AdminNav, { AdminNavMovil } from './AdminNav.jsx'
import { seccionActual } from './seccionesAdmin.js'

// Acción principal del encabezado del panel ("Nuevo destino", "Nuevo plato"...).
export function BotonNuevo({ children, ...resto }) {
  return (
    <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-lg boton-principal px-4 text-sm font-bold" {...resto}>
      <Plus aria-hidden="true" size={18} />
      {children}
    </button>
  )
}

// Estructura común de las páginas del panel: barra lateral con todas las
// secciones (escritorio), selector de sección (celular) y un encabezado con
// la ruta, el título, una descripción breve y las acciones de la página.
//  - "acciones": botones del encabezado (ej. "Nuevo destino").
//  - "descripcion": reemplaza la descripción de la sección si hace falta.
function PanelAdmin({ titulo, descripcion, acciones, children }) {
  const { pathname } = useLocation()
  const actual = seccionActual(pathname)
  const contenido = useRef(null)

  // Los formularios de alta y edición aparecen arriba de la lista: si se
  // abren desde una fila lejana (botón "Editar"), se lleva la vista hasta él.
  useEffect(() => {
    const observador = new MutationObserver((cambios) => {
      for (const cambio of cambios) {
        for (const nodo of cambio.addedNodes) {
          if (nodo.nodeType !== 1 || !nodo.matches('form')) continue
          if (nodo.getBoundingClientRect().top < 72) {
            const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            nodo.scrollIntoView({ block: 'start', behavior: reducir ? 'auto' : 'smooth' })
          }
        }
      }
    })
    observador.observe(contenido.current, { childList: true })
    return () => observador.disconnect()
  }, [pathname])

  return (
    <div className="min-h-screen bg-panel-fondo">
      <Navbar anchoCompleto />
      <div className="admin-layout mx-auto flex w-full max-w-[1440px]">
        <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-64 shrink-0 overflow-y-auto border-r border-panel-borde bg-white lg:block">
          <AdminNav />
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          <AdminNavMovil />

          <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-panel-borde pb-6">
            <div className="min-w-0 max-w-2xl">
              {actual && (
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-panel-muted">
                  <span>Panel</span>
                  <ChevronRight aria-hidden="true" size={14} />
                  <span>{actual.grupo.titulo}</span>
                </p>
              )}
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-panel-texto sm:text-[28px]">{titulo}</h1>
              {(descripcion || actual?.enlace.detalle) && (
                <p className="mt-1.5 text-[15px] text-panel-muted">{descripcion || actual.enlace.detalle}</p>
              )}
            </div>
            {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
          </header>

          {/* key: al cambiar de sección el contenido entra con un fundido corto. */}
          <div key={pathname} ref={contenido} className="animate-entrar">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default PanelAdmin
