import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { Estrellas, SelectorEstrellas } from '../../components/Estrellas.jsx'
import { crearResena, getResenasPorDestino } from '../../services/resenasService.js'

function formatearFecha(fecha) {
  if (typeof fecha?.toDate !== 'function') return ''
  return fecha.toDate().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Formulario + lista de reseñas. onResenaCreada avisa al padre para que
// actualice el promedio que muestra junto al nombre del destino.
function ResenasDestino({ idDestino, onResenaCreada }) {
  const { usuario } = useAuth()
  const [resenas, setResenas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarResenas() {
      try {
        setResenas(await getResenasPorDestino(idDestino))
        setError('')
      } catch (errorLectura) {
        console.error('Error al consultar reseñas:', errorLectura)
        setError('No se pudieron cargar las reseñas.')
      } finally {
        setCargando(false)
      }
    }

    cargarResenas()
  }, [idDestino, version])

  const yaReseno = Boolean(usuario) && resenas.some((resena) => resena.id_usuario === usuario.uid)

  async function enviar(evento) {
    evento.preventDefault()
    setErrorFormulario('')
    if (calificacion < 1) {
      setErrorFormulario('Elige de 1 a 5 estrellas.')
      return
    }
    if (!comentario.trim()) {
      setErrorFormulario('Escribe un comentario sobre tu experiencia.')
      return
    }

    try {
      setEnviando(true)
      await crearResena({
        id_usuario: usuario.uid,
        nombre_usuario: usuario.displayName || usuario.email?.split('@')[0] || 'Turista',
        id_destino: idDestino,
        calificacion,
        comentario: comentario.trim(),
      })
      setCalificacion(0)
      setComentario('')
      setVersion((valorAnterior) => valorAnterior + 1)
      onResenaCreada?.()
    } catch (errorEscritura) {
      console.error('Error al guardar la reseña:', errorEscritura)
      setErrorFormulario('No se pudo publicar tu reseña. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="mb-10">
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Reseñas</p>

      {!usuario ? (
        <p className="mb-6 text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-brand-700 underline">Inicia sesión</Link> para dejar tu reseña.
        </p>
      ) : yaReseno ? (
        <p className="mb-6 rounded-xl bg-brand-100 px-4 py-3 text-sm font-semibold text-brand-800">Ya dejaste tu reseña de este destino. ¡Gracias!</p>
      ) : (
        <form onSubmit={enviar} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
          <h3 className="text-lg font-bold text-brand-900">Deja tu reseña</h3>
          {errorFormulario && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{errorFormulario}</p>}
          <SelectorEstrellas valor={calificacion} onCambiar={setCalificacion} />
          <label className="block text-sm font-semibold text-slate-700">
            Comentario
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="¿Qué te pareció este destino?"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 font-normal outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
          </label>
          <button disabled={enviando} className="rounded-xl bg-accent-600 px-5 py-2.5 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
            {enviando ? 'Publicando...' : 'Publicar reseña'}
          </button>
        </form>
      )}

      {cargando ? (
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : resenas.length === 0 ? (
        <p className="text-slate-600">Este destino todavía no tiene reseñas. ¡Sé el primero en opinar!</p>
      ) : (
        <ul className="space-y-4">
          {resenas.map((resena) => (
            <li key={resena.id} className="rounded-2xl bg-white p-5 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-brand-900">{resena.nombre_usuario || 'Turista'}</p>
                <p className="text-xs text-slate-500">{formatearFecha(resena.fecha)}</p>
              </div>
              <Estrellas valor={resena.calificacion} />
              <p className="mt-2 text-sm leading-6 text-slate-700">{resena.comentario}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ResenasDestino
