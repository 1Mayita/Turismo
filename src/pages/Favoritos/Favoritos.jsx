import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { useAuth } from '../../context/useAuth.js'
import { useFavoritos } from '../../context/useFavoritos.js'
import { getFavoritosDeUsuario } from '../../services/favoritosService.js'
import { getDestinoPorId } from '../../services/destinosService.js'

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

function Favoritos() {
  const { usuario } = useAuth()
  const { listo, esFavorito } = useFavoritos()
  const [destinos, setDestinos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarFavoritos() {
      try {
        const favoritos = await getFavoritosDeUsuario(usuario.uid)
        favoritos.sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
        const encontrados = await Promise.all(favoritos.map((favorito) => getDestinoPorId(favorito.id_destino)))
        // Si un destino fue eliminado por el admin, su favorito queda huérfano: se omite.
        setDestinos(encontrados.filter(Boolean))
      } catch (errorLectura) {
        console.error('Error al cargar favoritos:', errorLectura)
        setError('No se pudieron cargar tus favoritos. Inténtalo de nuevo más tarde.')
      } finally {
        setCargando(false)
      }
    }

    cargarFavoritos()
  }, [usuario.uid])

  // Si el usuario quita el corazón aquí mismo, la tarjeta desaparece al instante.
  const visibles = listo ? destinos.filter((destino) => esFavorito(destino.id)) : destinos

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Mi cuenta</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Mis favoritos</h1>
          <p className="mt-4 text-lg text-slate-600">Los destinos que guardaste para tu próximo viaje.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <GrillaEsqueleto cantidad={3} />
        ) : visibles.length === 0 ? (
          !error && (
            <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">
              Todavía no guardaste destinos. Toca el corazón en cualquier destino para agregarlo.{' '}
              <Link to="/destinos" className="font-semibold text-brand-700 underline">Explorar destinos</Link>
            </p>
          )
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
            {visibles.map((destino) => (
              <TarjetaDestino key={destino.id} destino={destino} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Favoritos
