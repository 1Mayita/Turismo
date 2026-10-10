import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'

function NoEncontrada() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-24 text-center lg:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Error 404</p>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">No encontramos esta página</h1>
        <p className="mt-4 text-lg text-slate-600">
          El enlace puede estar mal escrito o la página ya no existe.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-full bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-800">
            Ir al inicio
          </Link>
          <Link to="/destinos" className="rounded-full bg-white px-5 py-3 font-bold text-brand-800 ring-1 ring-white/80 transition hover:bg-brand-100">
            Explorar destinos
          </Link>
        </div>
      </main>
    </div>
  )
}

export default NoEncontrada
