import { Link } from 'react-router-dom'

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
      { to: '/perfil#favoritos', etiqueta: 'Mis favoritos' },
      { to: '/perfil', etiqueta: 'Mi perfil' },
    ],
  },
]

function PieDePagina() {
  return (
    <footer className="mt-10 border-t border-white/70 bg-white/45 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-bold text-slate-900">Rutas de Bolivia</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
            Destinos, eventos, sabores y lugares para quedarse en los nueve departamentos de Bolivia.
          </p>
        </div>
        {COLUMNAS.map((columna) => (
          <nav key={columna.titulo} aria-label={columna.titulo}>
            <p className="text-sm font-semibold text-slate-900">{columna.titulo}</p>
            <ul className="mt-3 space-y-2">
              {columna.enlaces.map((enlace) => (
                <li key={enlace.to}>
                  <Link to={enlace.to} className="text-sm text-gray-500 transition hover:text-brand-700">{enlace.etiqueta}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/70">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-gray-500 lg:px-8">
          Proyecto académico · Fotos de Wikimedia Commons bajo licencias Creative Commons.
        </p>
      </div>
    </footer>
  )
}

export default PieDePagina
