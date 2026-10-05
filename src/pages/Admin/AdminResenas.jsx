import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { Estrellas } from '../../components/Estrellas.jsx'
import { getDestinos } from '../../services/destinosService.js'
import { actualizarEstadoResena, eliminarResena, getTodasLasResenas } from '../../services/resenasService.js'

function fechaLegible(fecha) {
  const valor = typeof fecha?.toDate === 'function' ? fecha.toDate() : fecha ? new Date(fecha) : null
  return valor && !Number.isNaN(valor.getTime())
    ? valor.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Fecha no disponible'
}

function AdminResenas() {
  const [resenas, setResenas] = useState([])
  const [destinos, setDestinos] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    async function cargarDatos() {
      setCargando(true)
      setError('')
      try {
        const [listaResenas, listaDestinos] = await Promise.all([getTodasLasResenas(), getDestinos()])
        listaResenas.sort((a, b) => {
          const fechaA = typeof a.fecha?.toMillis === 'function' ? a.fecha.toMillis() : 0
          const fechaB = typeof b.fecha?.toMillis === 'function' ? b.fecha.toMillis() : 0
          return fechaB - fechaA
        })
        if (!activo) return
        setResenas(listaResenas)
        setDestinos(listaDestinos)
      } catch (errorLectura) {
        console.error('Error al cargar reseñas para moderación:', errorLectura)
        if (activo) setError('No se pudieron cargar las reseñas.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarDatos()
    return () => { activo = false }
  }, [version])

  const resenasVisibles = useMemo(() => resenas.filter((resena) => {
    if (filtro === 'ocultas') return resena.estado === 'oculta'
    if (filtro === 'publicadas') return resena.estado !== 'oculta'
    return true
  }), [filtro, resenas])

  async function cambiarVisibilidad(resena) {
    const nuevoEstado = resena.estado === 'oculta' ? 'publicada' : 'oculta'
    setError('')
    setMensaje('')
    try {
      await actualizarEstadoResena(resena.id, nuevoEstado)
      setMensaje(`Reseña ${nuevoEstado === 'oculta' ? 'ocultada' : 'publicada'} correctamente.`)
      setVersion((actual) => actual + 1)
    } catch (errorEscritura) {
      console.error('Error al cambiar el estado de la reseña:', errorEscritura)
      setError('No se pudo actualizar el estado de la reseña.')
    }
  }

  async function eliminar(resena) {
    if (!window.confirm('¿Eliminar esta reseña definitivamente? Esta acción no se puede deshacer.')) return
    setError('')
    setMensaje('')
    try {
      await eliminarResena(resena.id)
      setMensaje('Reseña eliminada correctamente.')
      setVersion((actual) => actual + 1)
    } catch (errorEscritura) {
      console.error('Error al eliminar la reseña:', errorEscritura)
      setError('No se pudo eliminar la reseña.')
    }
  }

  const nombreDestino = (id) => destinos.find((destino) => destino.id === id)?.nombre || 'Destino no disponible'

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Moderación de reseñas</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <label className="mb-6 block max-w-xs text-sm font-semibold text-slate-700">
          Mostrar
          <select value={filtro} onChange={(evento) => setFiltro(evento.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20">
            <option value="todas">Todas las reseñas</option>
            <option value="publicadas">Publicadas</option>
            <option value="ocultas">Ocultas</option>
          </select>
        </label>

        {cargando ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white shadow-lg shadow-brand-950/5" />
        ) : resenasVisibles.length === 0 ? (
          <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">No hay reseñas para mostrar.</p>
        ) : (
          <ul className="space-y-4">
            {resenasVisibles.map((resena) => {
              const oculta = resena.estado === 'oculta'
              return (
                <li key={resena.id} className="rounded-2xl bg-white p-5 shadow-lg shadow-brand-950/5 ring-1 ring-brand-900/5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <p className="font-bold text-brand-900">{resena.nombre_usuario || 'Turista'}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${oculta ? 'bg-red-50 text-red-700' : 'bg-brand-100 text-brand-800'}`}>
                          {oculta ? 'Oculta' : 'Publicada'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Destino:{' '}
                        {resena.id_destino ? (
                          <Link to={`/destinos/${resena.id_destino}`} className="font-semibold text-brand-700 underline">{nombreDestino(resena.id_destino)}</Link>
                        ) : 'No disponible'}
                        {' · '}{fechaLegible(resena.fecha)}
                      </p>
                      <Estrellas valor={Number(resena.calificacion) || 0} />
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{resena.comentario || 'Sin comentario.'}</p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button type="button" onClick={() => cambiarVisibilidad(resena)} className="text-sm font-semibold text-brand-700 hover:underline">
                        {oculta ? 'Publicar' : 'Ocultar'}
                      </button>
                      <button type="button" onClick={() => eliminar(resena)} className="text-sm font-semibold text-red-700 hover:underline">Eliminar</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}

export default AdminResenas
