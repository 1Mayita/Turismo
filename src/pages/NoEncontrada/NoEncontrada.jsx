import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'

function NoEncontrada() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-2xl py-24 text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Error 404</p>
        <h1 className="text-4xl font-bold text-noche sm:text-5xl">No encontramos esta página</h1>
        <p className="mt-4 text-lg text-piedra-texto">
          El enlace puede estar mal escrito o la página ya no existe.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-full bg-noche px-5 py-3 font-bold text-white transition hover:bg-noche/90">
            Ir al inicio
          </Link>
          <Link to="/destinos" className="rounded-full bg-white px-5 py-3 font-bold text-cielo-700 ring-1 ring-white/80 transition hover:bg-cielo">
            Explorar destinos
          </Link>
        </div>
      </main>
    </div>
  )
}

export default NoEncontrada
