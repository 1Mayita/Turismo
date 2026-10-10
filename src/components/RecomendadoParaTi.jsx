import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TarjetaDestino from './TarjetaDestino.jsx'
import { GrillaEsqueleto } from './EsqueletoTarjeta.jsx'
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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">{esPersonalizada ? 'Para ti' : 'Populares'}</p>
          <h2 id="titulo-recomendaciones" className="text-3xl font-bold text-slate-900">{esPersonalizada ? titulo : 'Los destinos más populares'}</h2>
        </div>
        <Link to="/destinos" className="text-sm font-semibold text-brand-700 underline">Ver todo el catálogo</Link>
      </div>

      {sinPreferencias && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 px-5 py-4 ring-1 ring-brand-100">
          <p className="text-sm text-brand-900">
            <span className="font-bold">¿Qué te gusta hacer cuando viajas?</span> Elige tus intereses y te recomendaremos lugares a tu medida.
          </p>
          <Link to="/perfil" className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800">Completar mi perfil</Link>
        </div>
      )}

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : !datos ? (
        <GrillaEsqueleto cantidad={cantidad} />
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl px-5 py-6 text-slate-600 cristal">¡Ya guardaste o reseñaste todos los destinos! Pronto agregaremos más.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map(({ destino, motivo }) => (
            <div key={destino.id} className="flex flex-col gap-2">
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-white">
                <span aria-hidden="true">✨</span> {motivo}
              </p>
              <TarjetaDestino destino={destino} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default RecomendadoParaTi
