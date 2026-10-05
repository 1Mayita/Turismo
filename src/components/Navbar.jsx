import { signOut } from 'firebase/auth'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { auth } from '../services/firebase.js'
import BarraBusqueda from './BarraBusqueda.jsx'

function enlaceClase({ isActive }) {
  return `text-sm font-semibold transition hover:text-white ${isActive ? 'text-white' : 'text-white/70'}`
}

function IconoHoja() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-accent-400">
      <path
        d="M4 20c8 0 15-6 16-16-9 0-15 7-16 16Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path d="M6 18c4-4 8-8 13-13" stroke="#103a25" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function Navbar() {
  const { usuario, esAdmin } = useAuth()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const busquedaActual = parametros.get('buscar') || ''

  async function cerrarSesion() {
    await signOut(auth)
    navegar('/login')
  }

  function buscar(texto) {
    navegar(texto ? `/buscar?buscar=${encodeURIComponent(texto)}` : '/buscar')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-brand-900 text-white shadow-md shadow-brand-950/20">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <IconoHoja />
          Rutas de Bolivia
        </NavLink>

        <div className="flex flex-wrap items-center gap-5">
          <NavLink to="/" end className={enlaceClase}>Inicio</NavLink>
          <NavLink to="/destinos" className={enlaceClase}>Destinos</NavLink>
          <NavLink to="/departamentos" className={enlaceClase}>Departamentos</NavLink>
          <NavLink to="/mapa" className={enlaceClase}>Mapa</NavLink>
          <NavLink to="/eventos" className={enlaceClase}>Eventos</NavLink>
          <NavLink to="/gastronomia" className={enlaceClase}>Gastronomía</NavLink>
          <NavLink to="/restaurantes" className={enlaceClase}>Restaurantes</NavLink>
          <NavLink to="/alojamientos" className={enlaceClase}>Alojamientos</NavLink>
          {usuario && <NavLink to="/favoritos" className={enlaceClase}>Mis favoritos</NavLink>}
          {usuario && <NavLink to="/perfil" className={enlaceClase}>Perfil</NavLink>}
          {esAdmin && <NavLink to="/admin/destinos" className={enlaceClase}>Panel Admin</NavLink>}
        </div>

        {/* key reinicia el input cuando cambia la búsqueda en la URL. */}
        <BarraBusqueda key={busquedaActual} valorInicial={busquedaActual} onBuscar={buscar} placeholder="Buscar lugares y experiencias" className="w-full sm:w-56" />

        <div className="flex items-center gap-3">
          {usuario ? (
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-brand-900"
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <NavLink to="/login" className={enlaceClase}>Iniciar sesión</NavLink>
              <NavLink
                to="/registro"
                className="rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                Registrarme
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
