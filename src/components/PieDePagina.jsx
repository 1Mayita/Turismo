import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Logo from './Logo.jsx'

const COLUMNAS = [
  {
    titulo: 'Explorar',
    enlaces: [
      { to: '/destinos', etiqueta: 'Destinos' },
      { to: '/departamentos', etiqueta: 'Departamentos' },
      { to: '/mapa', etiqueta: 'Mapa turístico' },
      { to: '/eventos', etiqueta: 'Eventos' },
    ],
  },
  {
    titulo: 'Comer y dormir',
    enlaces: [
      { to: '/gastronomia', etiqueta: 'Gastronomía típica' },
      { to: '/restaurantes', etiqueta: 'Restaurantes' },
      { to: '/alojamientos', etiqueta: 'Alojamientos' },
    ],
  },
  {
    titulo: 'Tu cuenta',
    enlaces: [
      { to: '/viajes', etiqueta: 'Mis viajes' },
      { to: '/perfil#favoritos', etiqueta: 'Mis favoritos' },
      { to: '/perfil', etiqueta: 'Mi perfil' },
    ],
  },
]

// Pie de página en azul noche (DESIGN.md §6.2). Los textos secundarios usan
// admin-muted, que sobre noche tiene contraste AA.
function PieDePagina() {
  return (
    <footer className="mt-24 bg-noche text-admin-texto">
      <div aria-hidden="true" className="h-1 bg-[linear-gradient(90deg,#e48f66_0_33%,#c98f62_33%_66%,#626d96_66%)]" />
      <div className="contenedor grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 py-14 sm:gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:py-20">
        <div className="col-span-2 lg:col-span-1">
          <Link to="/" className="inline-block rounded-full" aria-label="Rutas de Bolivia, ir al inicio">
            <Logo claro />
          </Link>
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-admin-muted">
            Destinos, eventos, sabores y lugares para quedarse en los nueve departamentos de Bolivia.
          </p>
          <Link
            to="/viajes"
            className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-control border border-white/20 px-4 text-sm font-bold text-admin-texto transition hover:border-atardecer hover:text-white"
          >
            Arma tu viaje
            <ArrowRight aria-hidden="true" size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {COLUMNAS.map((columna) => (
          <nav key={columna.titulo} aria-label={columna.titulo}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cobre">{columna.titulo}</p>
            <ul className="mt-4 space-y-1">
              {columna.enlaces.map((enlace) => (
                <li key={enlace.to}>
                  <Link to={enlace.to} className="inline-flex min-h-10 items-center text-[15px] text-admin-texto/85 transition hover:text-white hover:underline hover:decoration-atardecer hover:underline-offset-4">
                    {enlace.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="contenedor max-w-[1440px] py-6 text-sm text-admin-muted">
          Proyecto académico · Fotos de Wikimedia Commons bajo licencias Creative Commons.
        </p>
      </div>
    </footer>
  )
}

export default PieDePagina
