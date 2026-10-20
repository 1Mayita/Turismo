import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import ListaFavoritos from '../../components/ListaFavoritos.jsx'

function Favoritos() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Mi cuenta</p>
          <h1 className="text-4xl font-bold tracking-tight text-noche sm:text-5xl">Mis favoritos</h1>
          <p className="mt-4 text-lg text-piedra-texto">
            Tus destinos, actividades, restaurantes y alojamientos guardados. También los encuentras en{' '}
            <Link to="/perfil#favoritos" className="font-semibold text-cielo-700 underline">tu perfil</Link>.
          </p>
        </div>

        <ListaFavoritos />
      </main>
    </div>
  )
}

export default Favoritos
