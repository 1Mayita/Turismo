import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BedDouble,
  Bell,
  CalendarDays,
  ChevronDown,
  Compass,
  Heart,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map as IconoMapa,
  MapPinned,
  Menu,
  Route,
  Soup,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { auth } from '../services/firebase.js'
import BarraBusqueda from './BarraBusqueda.jsx'
import Campana from './Campana.jsx'
import Logo from './Logo.jsx'

// Estructura del menú: un enlace directo a lo más usado y el resto agrupado.
const GRUPO_EXPLORAR = {
  etiqueta: 'Explorar',
  enlaces: [
    { to: '/departamentos', etiqueta: 'Departamentos', icono: MapPinned, detalle: 'Los nueve departamentos' },
    { to: '/mapa', etiqueta: 'Mapa turístico', icono: IconoMapa, detalle: 'Todo en un mapa' },
    { to: '/eventos', etiqueta: 'Eventos', icono: CalendarDays, detalle: 'Fiestas y festivales' },
  ],
}

const GRUPO_COMER_Y_DORMIR = {
  etiqueta: 'Comer y dormir',
  enlaces: [
    { to: '/gastronomia', etiqueta: 'Gastronomía típica', icono: Soup, detalle: 'Platos de cada región' },
    { to: '/restaurantes', etiqueta: 'Restaurantes', icono: UtensilsCrossed, detalle: 'Dónde comer' },
    { to: '/alojamientos', etiqueta: 'Alojamientos', icono: BedDouble, detalle: 'Dónde dormir' },
  ],
}

// Enlace de la barra: subrayado atardecer cuando es la página actual
// (NavLink pone aria-current="page").
const CLASE_ENLACE_BARRA = [
  'relative flex min-h-11 items-center px-1 text-[15px] font-semibold text-noche/75 transition hover:text-noche',
  'after:absolute after:inset-x-1 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-atardecer after:transition-transform after:duration-200',
  'aria-[current=page]:text-noche aria-[current=page]:after:scale-x-100 data-[activo=true]:text-noche data-[activo=true]:after:scale-x-100',
].join(' ')

function Inicial({ nombre }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cielo text-sm font-extrabold text-cielo-700" aria-hidden="true">
      {(nombre || '?').charAt(0).toLocaleUpperCase('es')}
    </span>
  )
}

// Botón que despliega una lista de enlaces. Se cierra con Esc, al hacer clic
// fuera o al elegir una opción. "children" permite agregar acciones extra
// (ej. cerrar sesión) debajo de los enlaces. "boton" reemplaza el contenido
// del botón (ej. el avatar del menú de cuenta).
function MenuDesplegable({ etiqueta, enlaces, alinear = 'left', boton, children }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const { pathname } = useLocation()
  const contieneRutaActual = enlaces.some((enlace) => pathname.startsWith(enlace.to.split('#')[0]))

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
        data-activo={contieneRutaActual || abierto}
        className={boton
          ? 'flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[15px] font-semibold text-noche transition hover:bg-cielo/70'
          : `${CLASE_ENLACE_BARRA} gap-1`}
      >
        {boton || etiqueta}
        <ChevronDown aria-hidden="true" size={16} className={`transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className={`absolute top-full z-50 mt-2 w-64 rounded-tarjeta border border-borde bg-white p-2 shadow-elevada ${alinear === 'right' ? 'right-0' : 'left-0'}`}>
          {enlaces.map(({ to, etiqueta: texto, icono: Icono, detalle }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setAbierto(false)}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-control px-3 py-2 transition ${isActive ? 'bg-cielo text-noche' : 'text-noche hover:bg-sal-2'}`}
            >
              {Icono && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-sal-2 text-cielo-700" aria-hidden="true">
                  <Icono size={18} />
                </span>
              )}
              <span>
                <span className="block text-sm font-bold">{texto}</span>
                {detalle && <span className="block text-xs text-piedra-texto">{detalle}</span>}
              </span>
            </NavLink>
          ))}
          {children && <div className="mt-2 border-t border-borde pt-2">{children}</div>}
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
    { to: '/viajes', etiqueta: 'Mis viajes', icono: Route },
    { to: '/perfil#favoritos', etiqueta: 'Mis favoritos', icono: Heart },
    { to: '/notificaciones', etiqueta: 'Notificaciones', icono: Bell },
    { to: '/perfil', etiqueta: 'Mi perfil', icono: User },
    ...(esAdmin ? [{ to: '/admin/destinos', etiqueta: 'Panel de administración', icono: LayoutDashboard }] : []),
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

  // Lleva el foco al contenido principal (para quien navega con teclado).
  function saltarAlContenido(evento) {
    const principal = document.querySelector('main')
    if (!principal) return
    evento.preventDefault()
    principal.setAttribute('tabindex', '-1')
    principal.focus()
  }

  const claseEnlaceMovil = ({ isActive }) => `flex min-h-12 items-center gap-3 rounded-control px-3 text-base font-semibold transition ${isActive ? 'bg-cielo text-noche' : 'text-noche hover:bg-sal-2'}`
  const claseTituloMovil = 'px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-piedra-texto'
  const iconoMovil = (Icono) => <Icono aria-hidden="true" className="shrink-0 text-cielo-700" />

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-sal text-noche">
      <a
        href="#contenido"
        onClick={saltarAlContenido}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-control focus:bg-noche focus:px-4 focus:py-3 focus:font-bold focus:text-white"
      >
        Saltar al contenido
      </a>
      <nav aria-label="Principal" className="contenedor flex h-[72px] max-w-6xl items-center justify-between gap-4">
        <NavLink to="/" className="shrink-0 rounded-full" aria-label="Rutas de Bolivia, ir al inicio">
          <Logo />
        </NavLink>

        {/* Escritorio */}
        <div className="hidden items-center gap-5 lg:flex">
          <NavLink to="/destinos" className={CLASE_ENLACE_BARRA}>Destinos</NavLink>
          <MenuDesplegable {...GRUPO_EXPLORAR} />
          <MenuDesplegable {...GRUPO_COMER_Y_DORMIR} />
        </div>

        {/* key reinicia el input cuando cambia la búsqueda en la URL. */}
        <BarraBusqueda key={busquedaActual} valorInicial={busquedaActual} onBuscar={buscar} placeholder="Buscar en Bolivia..." className="hidden min-w-0 max-w-xs flex-1 lg:block" />

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {usuario && <Campana />}
          {usuario ? (
            <MenuDesplegable
              etiqueta={nombreCorto}
              enlaces={enlacesCuenta}
              alinear="right"
              boton={<><Inicial nombre={nombreCorto} /><span className="max-w-28 truncate">{nombreCorto}</span></>}
            >
              <button type="button" onClick={cerrarSesion} className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-50">
                <LogOut aria-hidden="true" size={18} />
                Cerrar sesión
              </button>
            </MenuDesplegable>
          ) : (
            <>
              <NavLink to="/login" className={CLASE_ENLACE_BARRA}>Iniciar sesión</NavLink>
              <NavLink
                to="/registro"
                className="ml-2 flex min-h-11 items-center rounded-control border border-noche/80 px-4 text-sm font-bold text-noche transition hover:bg-noche hover:text-white"
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
            className="flex h-11 w-11 items-center justify-center rounded-control border border-borde bg-white text-noche transition hover:bg-cielo"
          >
            {menuMovilAbierto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {menuMovilAbierto && (
        <div id="menu-movil" className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-borde bg-sal pb-8 pt-4 lg:hidden">
          <div className="contenedor max-w-6xl">
            <BarraBusqueda key={busquedaActual} valorInicial={busquedaActual} onBuscar={buscar} placeholder="Buscar en Bolivia..." />

            <div className="mt-3" onClick={(evento) => { if (evento.target.closest('a')) setMenuMovilAbierto(false) }}>
              <NavLink to="/" end className={claseEnlaceMovil}>{iconoMovil(House)}Inicio</NavLink>
              <NavLink to="/destinos" className={claseEnlaceMovil}>{iconoMovil(Compass)}Destinos</NavLink>

              {[GRUPO_EXPLORAR, GRUPO_COMER_Y_DORMIR].map((grupo) => (
                <div key={grupo.etiqueta}>
                  <p className={claseTituloMovil}>{grupo.etiqueta}</p>
                  {grupo.enlaces.map((enlace) => (
                    <NavLink key={enlace.to} to={enlace.to} className={claseEnlaceMovil}>{iconoMovil(enlace.icono)}{enlace.etiqueta}</NavLink>
                  ))}
                </div>
              ))}

              <p className={claseTituloMovil}>Mi cuenta</p>
              {usuario ? (
                <>
                  {enlacesCuenta.map((enlace) => (
                    <NavLink key={enlace.to} to={enlace.to} className={claseEnlaceMovil}>{iconoMovil(enlace.icono)}{enlace.etiqueta}</NavLink>
                  ))}
                  <button type="button" onClick={cerrarSesion} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-control border border-borde bg-white px-3 text-left text-base font-bold text-red-700">
                    <LogOut aria-hidden="true" className="shrink-0" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={claseEnlaceMovil}>{iconoMovil(LogIn)}Iniciar sesión</NavLink>
                  <NavLink to="/registro" className="mt-3 flex min-h-12 items-center justify-center rounded-control boton-principal px-3 text-base font-bold">
                    Registrarme
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
