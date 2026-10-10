import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { auth } from '../services/firebase.js'
import BarraBusqueda from './BarraBusqueda.jsx'
import Campana from './Campana.jsx'

// Estructura del menú: un enlace directo a lo más usado y el resto agrupado.
const GRUPO_EXPLORAR = {
  etiqueta: 'Explorar',
  enlaces: [
    { to: '/departamentos', etiqueta: 'Departamentos' },
    { to: '/mapa', etiqueta: 'Mapa turístico' },
    { to: '/eventos', etiqueta: 'Eventos' },
  ],
}

const GRUPO_COMER_Y_DORMIR = {
  etiqueta: 'Comer y dormir',
  enlaces: [
    { to: '/gastronomia', etiqueta: 'Gastronomía típica' },
    { to: '/restaurantes', etiqueta: 'Restaurantes' },
    { to: '/alojamientos', etiqueta: 'Alojamientos' },
  ],
}

function enlaceClase({ isActive }) {
  return `text-sm font-semibold transition hover:text-brand-700 ${isActive ? 'text-brand-700' : 'text-slate-600'}`
}

function IconoHoja() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-brand-500" aria-hidden="true">
      <path
        d="M4 20c8 0 15-6 16-16-9 0-15 7-16 16Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path d="M6 18c4-4 8-8 13-13" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// Botón que despliega una lista de enlaces. Se cierra con Esc, al hacer clic
// fuera o al elegir una opción. "children" permite agregar acciones extra
// (ej. cerrar sesión) debajo de los enlaces.
function MenuDesplegable({ etiqueta, enlaces, alinear = 'left', children }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const { pathname } = useLocation()
  const contieneRutaActual = enlaces.some((enlace) => pathname.startsWith(enlace.to))

  useEffect(() => {
    if (!abierto) return
    function alHacerClicFuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false)
    }
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('pointerdown', alHacerClicFuera)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('pointerdown', alHacerClicFuera)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [abierto])

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-haspopup="true"
        className={`flex items-center gap-1 text-sm font-semibold transition hover:text-brand-700 ${contieneRutaActual || abierto ? 'text-brand-700' : 'text-slate-600'}`}
      >
        {etiqueta}
        <span aria-hidden="true" className={`text-xs transition-transform ${abierto ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {abierto && (
        <div className={`absolute top-full z-50 mt-3 w-56 rounded-2xl cristal bg-white/85 p-2 ${alinear === 'right' ? 'right-0' : 'left-0'}`}>
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              onClick={() => setAbierto(false)}
              className={({ isActive }) => `block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-neutral-100'}`}
            >
              {enlace.etiqueta}
            </NavLink>
          ))}
          {children && <div className="mt-2 border-t border-neutral-100 pt-2">{children}</div>}
        </div>
      )}
    </div>
  )
}

function Navbar() {
  const { usuario, esAdmin } = useAuth()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const { pathname } = useLocation()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  // El texto buscado solo se refleja en el buscador dentro de /buscar: otras
  // páginas usan "?buscar=" para sus propios filtros.
  const busquedaActual = pathname === '/buscar' ? parametros.get('buscar') || '' : ''

  const enlacesCuenta = [
    { to: '/viajes', etiqueta: 'Mis viajes' },
    { to: '/perfil#favoritos', etiqueta: 'Mis favoritos' },
    { to: '/notificaciones', etiqueta: 'Notificaciones' },
    { to: '/perfil', etiqueta: 'Mi perfil' },
    ...(esAdmin ? [{ to: '/admin/destinos', etiqueta: 'Panel de administración' }] : []),
  ]
  const nombreCorto = usuario?.displayName?.split(' ')[0] || 'Mi cuenta'

  async function cerrarSesion() {
    await signOut(auth)
    navegar('/')
  }

  function buscar(texto) {
    setMenuMovilAbierto(false)
    navegar(texto ? `/buscar?buscar=${encodeURIComponent(texto)}` : '/buscar')
  }

  const claseEnlaceMovil = ({ isActive }) => `block rounded-xl px-3 py-2.5 text-base font-semibold ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-neutral-100'}`
  const claseTituloMovil = 'px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-gray-500'

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/55 text-slate-800 shadow-[0_8px_30px_-18px_rgba(14,116,144,0.45)] backdrop-blur-xl backdrop-saturate-150">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
          <IconoHoja />
          Rutas de Bolivia
        </NavLink>

        {/* Escritorio */}
        <div className="hidden items-center gap-6 lg:flex">
          <NavLink to="/destinos" className={enlaceClase}>Destinos</NavLink>
          <MenuDesplegable {...GRUPO_EXPLORAR} />
          <MenuDesplegable {...GRUPO_COMER_Y_DORMIR} />
        </div>

        {/* key reinicia el input cuando cambia la búsqueda en la URL. */}
        <BarraBusqueda key={busquedaActual} valorInicial={busquedaActual} onBuscar={buscar} placeholder="Buscar en Bolivia..." className="hidden min-w-0 max-w-xs flex-1 lg:block" />

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {usuario && <Campana />}
          {usuario ? (
            <MenuDesplegable etiqueta={nombreCorto} enlaces={enlacesCuenta} alinear="right">
              <button type="button" onClick={cerrarSesion} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50">
                Cerrar sesión
              </button>
            </MenuDesplegable>
          ) : (
            <>
              <NavLink to="/login" className={enlaceClase}>Iniciar sesión</NavLink>
              <NavLink
                to="/registro"
                className="rounded-xl boton-principal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
              >
                Registrarme
              </NavLink>
            </>
          )}
        </div>

        {/* Móvil y tablet */}
        <div className="flex items-center gap-1 lg:hidden">
        {usuario && <Campana />}
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          aria-expanded={menuMovilAbierto}
          aria-controls="menu-movil"
          aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 text-xl text-slate-700 lg:hidden"
        >
          <span aria-hidden="true">{menuMovilAbierto ? '✕' : '☰'}</span>
        </button>
        </div>
      </nav>

      {menuMovilAbierto && (
        <div id="menu-movil" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/70 bg-white/80 px-5 pb-6 pt-4 lg:hidden">
          <BarraBusqueda key={busquedaActual} valorInicial={busquedaActual} onBuscar={buscar} placeholder="Buscar en Bolivia..." />

          <div className="mt-3" onClick={(evento) => { if (evento.target.closest('a')) setMenuMovilAbierto(false) }}>
            <NavLink to="/" end className={claseEnlaceMovil}>Inicio</NavLink>
            <NavLink to="/destinos" className={claseEnlaceMovil}>Destinos</NavLink>

            {[GRUPO_EXPLORAR, GRUPO_COMER_Y_DORMIR].map((grupo) => (
              <div key={grupo.etiqueta}>
                <p className={claseTituloMovil}>{grupo.etiqueta}</p>
                {grupo.enlaces.map((enlace) => (
                  <NavLink key={enlace.to} to={enlace.to} className={claseEnlaceMovil}>{enlace.etiqueta}</NavLink>
                ))}
              </div>
            ))}

            <p className={claseTituloMovil}>Mi cuenta</p>
            {usuario ? (
              <>
                {enlacesCuenta.map((enlace) => (
                  <NavLink key={enlace.to} to={enlace.to} className={claseEnlaceMovil}>{enlace.etiqueta}</NavLink>
                ))}
                <button type="button" onClick={cerrarSesion} className="mt-2 block w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-left text-base font-semibold text-red-700">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={claseEnlaceMovil}>Iniciar sesión</NavLink>
                <NavLink to="/registro" className="mt-2 block rounded-xl boton-principal px-3 py-2.5 text-center text-base font-semibold text-white">
                  Registrarme
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
