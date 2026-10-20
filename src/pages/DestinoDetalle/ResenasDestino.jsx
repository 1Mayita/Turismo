import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { Estrellas, SelectorEstrellas } from '../../components/Estrellas.jsx'
import { crearResena, getResenasDe } from '../../services/resenasService.js'

function formatearFecha(fecha) {
  if (typeof fecha?.toDate !== 'function') return ''
  return fecha.toDate().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Formulario + lista de reseñas de un destino, restaurante o alojamiento.
// onResenaCreada avisa al padre para que actualice el promedio que muestra
// junto al nombre. Para un destino basta idDestino; para lo demás se pasan
// tipo ('restaurante' | 'alojamiento') e idElemento.
function ResenasDestino({ idDestino, tipo = 'destino', idElemento = idDestino, onResenaCreada }) {
  const { usuario } = useAuth()
  const ubicacion = useLocation()
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
        setResenas(await getResenasDe(tipo, idElemento))
        setError('')
      } catch (errorLectura) {
        console.error('Error al consultar reseñas:', errorLectura)
        setError('No se pudieron cargar las reseñas.')
      } finally {
        setCargando(false)
      }
    }

    cargarResenas()
  }, [tipo, idElemento, version])

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
        ...(tipo === 'destino' ? { id_destino: idElemento } : { tipo_elemento: tipo, id_elemento: idElemento }),
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
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Reseñas</p>

      {!usuario ? (
        <p className="mb-6 text-sm text-piedra-texto">
          <Link to="/login" state={{ desde: ubicacion.pathname, aviso: 'Inicia sesión para dejar tu reseña.' }} className="font-semibold text-cielo-700 underline">Inicia sesión</Link> para dejar tu reseña.
        </p>
      ) : yaReseno ? (
        <p className="mb-6 rounded-xl bg-cielo px-4 py-3 text-sm font-semibold text-cielo-700">Ya dejaste tu reseña de este lugar. ¡Gracias!</p>
      ) : (
        <form onSubmit={enviar} className="mb-8 space-y-4 rounded-2xl p-6 cristal">
          <h3 className="text-lg font-bold text-noche">Deja tu reseña</h3>
          {errorFormulario && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{errorFormulario}</p>}
          <SelectorEstrellas valor={calificacion} onCambiar={setCalificacion} />
          <label className="block text-sm font-semibold text-noche/80">
            Comentario
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="¿Qué te pareció tu visita?"
              className="mt-2 w-full rounded-xl border border-borde bg-white/70 px-4 py-2.5 font-normal outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30"
            />
          </label>
          <button disabled={enviando} className="rounded-xl boton-principal px-5 py-2.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
            {enviando ? 'Publicando...' : 'Publicar reseña'}
          </button>
        </form>
      )}

      {cargando ? (
        <div className="h-24 animate-pulse rounded-2xl bg-sal-2" />
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : resenas.length === 0 ? (
        <p className="text-piedra-texto">Todavía no hay reseñas. ¡Sé la primera persona en opinar!</p>
      ) : (
        <ul className="space-y-4">
          {resenas.map((resena) => (
            <li key={resena.id} className="rounded-2xl p-5 cristal">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-noche">{resena.nombre_usuario || 'Turista'}</p>
                <p className="text-xs text-piedra-texto">{formatearFecha(resena.fecha)}</p>
              </div>
              <Estrellas valor={resena.calificacion} />
              <p className="mt-2 text-sm leading-6 text-noche/80">{resena.comentario}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ResenasDestino
