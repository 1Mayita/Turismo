import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Mountain } from 'lucide-react'
import { Chip, EstadoVacio, claseBoton } from './ui'
import BotonFavorito from './BotonFavorito.jsx'
import TarjetaDestino from './TarjetaDestino.jsx'
import TarjetaEstablecimiento from './TarjetaEstablecimiento.jsx'
import { GrillaEsqueleto } from './EsqueletoTarjeta.jsx'
import { useAuth } from '../context/useAuth.js'
import { useFavoritos } from '../context/useFavoritos.js'
import { getFavoritosDeUsuario, idElementoDeFavorito, tipoDeFavorito } from '../services/favoritosService.js'
import { getDestinoPorId } from '../services/destinosService.js'
import { getActividadPorId } from '../services/actividadesService.js'
import { getRestaurantePorId } from '../services/restaurantesService.js'
import { getAlojamientoPorId } from '../services/alojamientosService.js'

const FILTROS = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'destino', etiqueta: 'Destinos' },
  { id: 'actividad', etiqueta: 'Actividades' },
  { id: 'restaurante', etiqueta: 'Restaurantes' },
  { id: 'alojamiento', etiqueta: 'Alojamientos' },
]

const SERVICIO_POR_TIPO = {
  destino: getDestinoPorId,
  restaurante: getRestaurantePorId,
  alojamiento: getAlojamientoPorId,
  actividad: getActividadPorId,
}

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

// Lista de lo que el usuario guardó con el corazón: destinos, actividades,
// restaurantes y alojamientos. La usan el perfil y la página "Mis favoritos".
// Requiere sesión iniciada.
function ListaFavoritos() {
  const { usuario } = useAuth()
  const { listo, esFavorito } = useFavoritos()
  const [elementos, setElementos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargarFavoritos() {
      try {
        const favoritos = await getFavoritosDeUsuario(usuario.uid)
        favoritos.sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
        const encontrados = await Promise.all(favoritos.map(async (favorito) => {
          const tipo = tipoDeFavorito(favorito)
          const idElemento = idElementoDeFavorito(favorito)
          const servicio = SERVICIO_POR_TIPO[tipo]
          if (!servicio || !idElemento) return null
          // Si el lugar fue eliminado por el admin, su favorito queda huérfano: se omite.
          const elemento = await servicio(idElemento).catch(() => null)
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
    return () => {
      activo = false
    }
  }, [usuario.uid])

  // Si el usuario quita el corazón aquí mismo, el elemento desaparece al instante.
  const guardados = listo
    ? elementos.filter(({ favorito, tipo }) => esFavorito(idElementoDeFavorito(favorito), tipo))
    : elementos
  const visibles = guardados.filter(({ tipo }) => filtro === 'todos' || tipo === filtro)
  const cantidadDe = (idFiltro) => (idFiltro === 'todos' ? guardados.length : guardados.filter(({ tipo }) => tipo === idFiltro).length)

  function renderElemento({ favorito, tipo, elemento }) {
    if (tipo === 'destino') return <TarjetaDestino key={`destino-${elemento.id}`} destino={elemento} />
    if (tipo === 'restaurante' || tipo === 'alojamiento') {
      return <TarjetaEstablecimiento key={`${tipo}-${elemento.id}`} tipo={tipo} establecimiento={elemento} />
    }

    return (
      <article key={`actividad-${elemento.id}`} className="relative rounded-tarjeta border border-borde bg-white p-5 shadow-suave">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-cielo px-2.5 py-1 text-xs font-bold text-noche"><Mountain aria-hidden="true" size={14} className="text-cielo-700" /> Actividad</span>
        <BotonFavorito idElemento={idElementoDeFavorito(favorito)} tipo="actividad" className="absolute right-4 top-4" />
        <h3 className="pr-10 text-lg font-bold text-noche">{elemento.nombre}</h3>
        {elemento.descripcion && <p className="mt-2 line-clamp-3 text-sm leading-6 text-piedra-texto">{elemento.descripcion}</p>}
        {elemento.id_destino && (
          <Link to={`/destinos/${elemento.id_destino}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-cielo-700 underline">
            Ver el destino de esta actividad
          </Link>
        )}
      </article>
    )
  }

  if (cargando) return <GrillaEsqueleto cantidad={3} />
  if (error) return <p className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>

  if (guardados.length === 0) {
    return (
      <EstadoVacio
        icono={Heart}
        titulo="Aún no guardaste nada"
        mensaje="Explora y toca el ♥ en un destino, actividad, restaurante o alojamiento para encontrarlo aquí."
        accion={<Link to="/destinos" className={claseBoton('secundario', 'normal', 'bg-white')}>Explorar destinos <ArrowRight aria-hidden="true" size={16} /></Link>}
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar favoritos por tipo">
        {FILTROS.filter((item) => item.id === 'todos' || cantidadDe(item.id) > 0).map((item) => (
          <Chip key={item.id} activo={filtro === item.id} onClick={() => setFiltro(item.id)}>
            {item.etiqueta} <span className="font-medium opacity-70">{cantidadDe(item.id)}</span>
          </Chip>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-control bg-sal-2 px-5 py-4 text-piedra-texto">Ya no tienes favoritos de este tipo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map(renderElemento)}
        </div>
      )}
    </div>
  )
}

export default ListaFavoritos
