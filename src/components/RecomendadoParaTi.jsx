import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import TarjetaDestino from './TarjetaDestino.jsx'
import EncabezadoSeccion from './ui/EncabezadoSeccion.jsx'
import { EsqueletoTarjetaBase } from './ui/Esqueleto.jsx'
import { useAuth } from '../context/useAuth.js'
import { useFavoritos } from '../context/useFavoritos.js'
import { useResumenCalificaciones } from '../hooks/useResumenCalificaciones.js'
import { categoriasDeEjemplo, getCategorias } from '../services/categoriasService.js'
import { destinosDeEjemplo, getDestinos } from '../services/destinosService.js'
import { getPreferenciasDeUsuario } from '../services/preferenciasService.js'
import { getResenasDeUsuario } from '../services/resenasService.js'
import { calcularRecomendaciones } from '../utils/recomendaciones.js'

// "Recomendado para ti": destinos según preferencias del perfil, favoritos y
// reseñas, con el motivo de cada uno. Solo se muestra con sesión iniciada.
function RecomendadoParaTi({ titulo = 'Recomendado para ti', cantidad = 3, className = '' }) {
  const { usuario } = useAuth()
  const { idsFavoritos } = useFavoritos()
  const { resumen } = useResumenCalificaciones()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!usuario) return
    let activo = true
    Promise.all([
      getDestinos().then((lista) => (lista.length > 0 ? lista : destinosDeEjemplo)),
      getCategorias().then((lista) => (lista.length > 0 ? lista : categoriasDeEjemplo)),
      getPreferenciasDeUsuario(usuario.uid).catch(() => []),
      getResenasDeUsuario(usuario.uid).catch(() => []),
    ])
      .then(([destinos, categorias, preferencias, misResenas]) => {
        if (!activo) return
        const idsPreferidos = new Set(preferencias.map((preferencia) => preferencia.id_categoria))
        setDatos({
          destinos,
          misResenas,
          categoriasPreferidas: categorias.filter((categoria) => idsPreferidos.has(categoria.id)).map((categoria) => categoria.nombre),
        })
      })
      .catch((errorLectura) => {
        console.error('Error al calcular recomendaciones:', errorLectura)
        if (activo) setError('No pudimos preparar tus recomendaciones ahora.')
      })
    return () => {
      activo = false
    }
  }, [usuario])

  if (!usuario) return null

  const idsDestinosFavoritos = [...idsFavoritos].filter((clave) => clave.startsWith('destino:')).map((clave) => clave.slice('destino:'.length))
  const { esPersonalizada, recomendaciones } = datos
    ? calcularRecomendaciones({ ...datos, idsFavoritos: idsDestinosFavoritos, resumen })
    : { esPersonalizada: false, recomendaciones: [] }
  const visibles = recomendaciones.slice(0, cantidad)
  const sinPreferencias = datos && datos.categoriasPreferidas.length === 0

  return (
    <section className={className} aria-labelledby="titulo-recomendaciones">
      <EncabezadoSeccion
        id="titulo-recomendaciones"
        antetitulo={esPersonalizada ? 'Para ti' : 'Populares'}
        titulo={esPersonalizada ? titulo : 'Los destinos más populares'}
        accion={
          <Link to="/destinos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-cielo-700 hover:underline">
            Ver todo el catálogo
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        }
      />

      {sinPreferencias && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-tarjeta border border-borde bg-cielo/60 px-5 py-4">
          <p className="text-sm text-noche">
            <span className="font-bold">¿Qué te gusta hacer cuando viajas?</span> Elige tus intereses y te recomendaremos lugares a tu medida.
          </p>
          <Link to="/perfil" className="inline-flex min-h-11 items-center rounded-control border border-noche/80 bg-white px-4 text-sm font-bold text-noche transition hover:bg-noche hover:text-white">Completar mi perfil</Link>
        </div>
      )}

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : !datos ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cantidad }).map((_, indice) => <EsqueletoTarjetaBase key={indice} className={indice > 0 ? 'hidden sm:block' : ''} />)}
        </div>
      ) : visibles.length === 0 ? (
        <p className="rounded-tarjeta border border-borde bg-white px-5 py-6 text-piedra-texto">¡Ya guardaste o reseñaste todos los destinos! Pronto agregaremos más.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map(({ destino, motivo }) => (
            <div key={destino.id} className="flex flex-col gap-2">
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cielo px-3 py-1 text-xs font-bold text-noche">
                <Sparkles aria-hidden="true" size={14} className="text-atardecer-texto" /> {motivo}
              </p>
              <TarjetaDestino destino={destino} nivelTitulo="h3" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default RecomendadoParaTi
