import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { claseBoton } from '../../components/ui/estilos.js'

function NoEncontrada() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-2xl py-24 text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true"><Compass size={32} /></span>
        <p className="mb-3 rotulo">Error 404</p>
        <h1 className="titulo-display text-[44px] sm:text-[56px]">No encontramos esta página</h1>
        <p className="mt-3 text-lg text-piedra-texto">
          El enlace puede estar mal escrito o la página ya no existe.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className={claseBoton('primario')}>
            Ir al inicio
          </Link>
          <Link to="/destinos" className={claseBoton('secundario', 'normal', 'bg-white')}>
            Explorar destinos
          </Link>
        </div>
      </main>
    </div>
  )
}

export default NoEncontrada
