import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { ESTADOS, LARGO_MAXIMO_DESCRIPCION, MOTIVOS, TIPOS_REPORTABLES, cambiarEstadoReporte, getReportes } from '../../services/reportesService.js'

function fechaLegible(fecha) {
  return typeof fecha?.toDate === 'function'
    ? fecha.toDate().toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Fecha no disponible'
}

// Bandeja de reportes de información (HU-26).
function AdminReportes() {
  const [reportes, setReportes] = useState([])
  const [filtro, setFiltro] = useState('pendiente')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardandoId, setGuardandoId] = useState('')
  // Respuestas que el admin está escribiendo, por reporte: { id: texto }.
  const [borradores, setBorradores] = useState({})

  useEffect(() => {
    let activo = true
    getReportes()
      .then((lista) => {
        if (activo) setReportes(lista)
      })
      .catch((errorLectura) => {
        console.error('Error al cargar reportes:', errorLectura)
        if (activo) setError('No se pudieron cargar los reportes. Revisa que las reglas de Firestore estén publicadas.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const notaDe = (reporte) => borradores[reporte.id] ?? reporte.nota_admin ?? ''

  // Guarda el estado junto con la respuesta escrita: quien reportó recibe
  // ambas cosas en su campana.
  async function guardar(reporte, estado, textoExito) {
    setError('')
    setMensaje('')
    setGuardandoId(reporte.id)
    const nota = notaDe(reporte).trim()
    try {
      await cambiarEstadoReporte(reporte.id, estado, nota)
      setReportes((lista) => lista.map((item) => (item.id === reporte.id ? { ...item, estado, nota_admin: nota } : item)))
      setBorradores((actuales) => {
        const restantes = { ...actuales }
        delete restantes[reporte.id]
        return restantes
      })
      setMensaje(textoExito)
    } catch (errorGuardado) {
      console.error('Error al guardar el reporte:', errorGuardado)
      setError('No se pudo guardar el cambio del reporte.')
    } finally {
      setGuardandoId('')
    }
  }

  function cambiarEstado(reporte, estado) {
    const etiqueta = ESTADOS.find((item) => item.id === estado).etiqueta.toLocaleLowerCase('es')
    return guardar(reporte, estado, `Reporte marcado como "${etiqueta}". Quien lo envió verá el aviso en sus notificaciones.`)
  }

  const cantidad = (estado) => reportes.filter((reporte) => reporte.estado === estado).length
  const visibles = filtro === 'todos' ? reportes : reportes.filter((reporte) => reporte.estado === filtro)
  const motivo = (id) => MOTIVOS.find((item) => item.id === id)?.etiqueta || id

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="admin-layout contenedor max-w-6xl py-12">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Reportes de información</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{mensaje}</p>}

        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {[...ESTADOS, { id: 'todos', etiqueta: 'Todos' }].map((estado) => (
            <button
              key={estado.id}
              type="button"
              aria-pressed={filtro === estado.id}
              onClick={() => setFiltro(estado.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filtro === estado.id ? 'bg-brand-700 text-white' : 'bg-white/70 text-brand-800 ring-1 ring-white/80 hover:bg-white'}`}
            >
              {estado.etiqueta} ({estado.id === 'todos' ? reportes.length : cantidad(estado.id)})
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, indice) => <div key={indice} className="h-32 animate-pulse rounded-2xl bg-sal-2" />)}</div>
        ) : visibles.length === 0 ? (
          !error && <p className="rounded-2xl px-5 py-6 text-slate-600 cristal">{filtro === 'pendiente' ? '¡Todo al día! No hay reportes pendientes.' : 'No hay reportes con este estado.'}</p>
        ) : (
          <ul className="space-y-4">
            {visibles.map((reporte) => {
              const estado = ESTADOS.find((item) => item.id === reporte.estado) || ESTADOS[0]
              return (
                <li key={reporte.id} className="rounded-2xl p-5 cristal">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>{estado.etiqueta}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{TIPOS_REPORTABLES[reporte.tipo_elemento] || 'Elemento'}</span>
                        <span className="text-xs text-slate-500">{fechaLegible(reporte.fecha)} · por {reporte.nombre_usuario || 'Turista'}</span>
                      </div>
                      <p className="font-bold text-slate-900">
                        {reporte.enlace ? (
                          <Link to={reporte.enlace} className="text-brand-700 underline">{reporte.nombre_elemento || 'Ver elemento'}</Link>
                        ) : reporte.nombre_elemento}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{motivo(reporte.motivo)}</p>
                      {reporte.descripcion && <p className="mt-2 whitespace-pre-line rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-700">“{reporte.descripcion}”</p>}

                      <label htmlFor={`nota-${reporte.id}`} className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Respuesta para {reporte.nombre_usuario || 'quien reportó'} (opcional)
                      </label>
                      <textarea
                        id={`nota-${reporte.id}`}
                        rows={2}
                        maxLength={LARGO_MAXIMO_DESCRIPCION}
                        value={notaDe(reporte)}
                        onChange={(evento) => setBorradores((actuales) => ({ ...actuales, [reporte.id]: evento.target.value }))}
                        placeholder="Ej.: Ya actualizamos el horario de visita. ¡Gracias por avisarnos!"
                        className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={guardandoId === reporte.id || notaDe(reporte).trim() === (reporte.nota_admin || '').trim()}
                          onClick={() => guardar(reporte, reporte.estado, 'Respuesta guardada. Quien reportó la verá en sus notificaciones.')}
                          className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50"
                        >
                          Guardar respuesta
                        </button>
                        <span className="text-xs text-slate-500">La respuesta también se envía al cambiar el estado.</span>
                      </div>
                    </div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Cambiar estado
                      <select
                        value={reporte.estado}
                        disabled={guardandoId === reporte.id}
                        onChange={(evento) => cambiarEstado(reporte, evento.target.value)}
                        className="mt-1 block rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                      >
                        {ESTADOS.map((item) => <option key={item.id} value={item.id}>{item.etiqueta}</option>)}
                      </select>
                    </label>
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

export default AdminReportes
