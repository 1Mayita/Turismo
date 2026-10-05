import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { useAuth } from '../../context/useAuth.js'
import { useFavoritos } from '../../context/useFavoritos.js'
import { getFavoritosDeUsuario, idElementoDeFavorito, tipoDeFavorito } from '../../services/favoritosService.js'
import { getDestinoPorId } from '../../services/destinosService.js'
import { getActividadPorId } from '../../services/actividadesService.js'
import { getRestaurantePorId } from '../../services/restaurantesService.js'
import { getAlojamientoPorId } from '../../services/alojamientosService.js'

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

function Favoritos() {
  const { usuario } = useAuth()
  const { listo, esFavorito } = useFavoritos()
  const [elementos, setElementos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargarFavoritos() {
      try {
        const favoritos = await getFavoritosDeUsuario(usuario.uid)
        favoritos.sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
        const servicios = {
          destino: getDestinoPorId,
          restaurante: getRestaurantePorId,
          alojamiento: getAlojamientoPorId,
          actividad: getActividadPorId,
        }
        const encontrados = await Promise.all(favoritos.map(async (favorito) => {
          const tipo = tipoDeFavorito(favorito)
          const idElemento = idElementoDeFavorito(favorito)
          const servicio = servicios[tipo]
          if (!servicio || !idElemento) return null
          const elemento = await servicio(idElemento)
          return elemento ? { favorito, tipo, elemento } : null
        }))
        if (activo) setElementos(encontrados.filter(Boolean))
      } catch (errorLectura) {
        console.error('Error al cargar favoritos:', errorLectura)
        if (activo) setError('No se pudieron cargar tus favoritos. Inténtalo de nuevo más tarde.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarFavoritos()
    return () => { activo = false }
  }, [usuario.uid])

  // Si el usuario quita el corazón aquí mismo, el elemento desaparece al instante.
  const visibles = listo
    ? elementos.filter(({ favorito, tipo }) => esFavorito(idElementoDeFavorito(favorito), tipo))
    : elementos
  const nombresTipo = {
    restaurante: 'Restaurante',
    alojamiento: 'Alojamiento',
    actividad: 'Actividad',
  }

  function renderElemento({ favorito, tipo, elemento }) {
    if (tipo === 'destino') return <TarjetaDestino key={`destino-${elemento.id}`} destino={elemento} />

    const destinoActividad = tipo === 'actividad' ? elemento.id_destino : null
    return (
      <article key={`${tipo}-${elemento.id}`} className="relative rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5 ring-1 ring-brand-900/5 transition hover:-translate-y-0.5 hover:shadow-xl">
        <span className="mb-4 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">{nombresTipo[tipo]}</span>
        <BotonFavorito idElemento={idElementoDeFavorito(favorito)} tipo={tipo} className="absolute right-4 top-4" />
        <h2 className="pr-10 text-xl font-bold text-brand-900">{elemento.nombre}</h2>
        {elemento.especialidad && <p className="mt-2 text-sm font-semibold text-accent-700">{elemento.especialidad}</p>}
        {elemento.tipo && tipo === 'alojamiento' && <p className="mt-2 text-sm font-semibold text-accent-700">{elemento.tipo}</p>}
        {elemento.descripcion && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{elemento.descripcion}</p>}
        {elemento.ubicacion && <p className="mt-3 text-sm text-slate-600">📍 {elemento.ubicacion}</p>}
        {elemento.precio_noche != null && <p className="mt-3 text-sm font-bold text-brand-800">Bs {Number(elemento.precio_noche).toFixed(2)} por noche</p>}
        {destinoActividad && (
          <Link to={`/destinos/${destinoActividad}`} className="mt-4 inline-flex font-semibold text-brand-700 underline">
            Ver destino de la actividad
          </Link>
        )}
      </article>
    )
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Mi cuenta</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Mis favoritos</h1>
          <p className="mt-4 text-lg text-slate-600">Tus destinos, actividades, restaurantes y alojamientos guardados.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <GrillaEsqueleto cantidad={3} />
        ) : visibles.length === 0 ? (
          !error && (
            <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">
              Todavía no guardaste elementos. Toca el corazón en un destino, actividad, restaurante o alojamiento para agregarlo.{' '}
              <Link to="/destinos" className="font-semibold text-brand-700 underline">Explorar destinos</Link>
            </p>
          )
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map(renderElemento)}
          </div>
        )}
      </main>
    </div>
  )
}

export default Favoritos
