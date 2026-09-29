import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import { fechaHoyISO, formatearFechaEvento, getEventos, getEventosProximos } from '../../services/eventosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'

function rangoDeFechas(evento) {
  if (!evento.fecha_fin || evento.fecha_fin === evento.fecha_inicio) return formatearFechaEvento(evento.fecha_inicio)
  return `${formatearFechaEvento(evento.fecha_inicio, { day: 'numeric', month: 'short' })} – ${formatearFechaEvento(evento.fecha_fin)}`
}

function Eventos() {
  const [eventos, setEventos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarEventos() {
      try {
        // Si la colección está vacía, se siembran los eventos de ejemplo.
        if ((await getEventos()).length === 0) {
          try {
            await sembrarCatalogoDeEjemplo()
          } catch (errorSembrado) {
            console.error('Error al sembrar eventos de ejemplo:', errorSembrado)
          }
        }
        const [proximos, listaDepartamentos] = await Promise.all([getEventosProximos(), getDepartamentos()])
        setEventos(proximos)
        setDepartamentos(listaDepartamentos.length > 0 ? listaDepartamentos : departamentosDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al consultar eventos en Firestore:', errorLectura)
        setError('No se pudieron cargar los eventos. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        setCargando(false)
      }
    }

    cargarEventos()
  }, [])

  const hoy = fechaHoyISO()
  const nombreDepartamento = (id) => departamentos.find((departamento) => departamento.id === id)?.nombre

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Agenda cultural</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Próximos eventos</h1>
          <p className="mt-4 text-lg text-slate-600">Festivales, ferias y celebraciones para sumar a tu viaje.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => (
              <div key={indice} className="h-48 animate-pulse rounded-2xl bg-white shadow-lg shadow-brand-950/5" />
            ))}
          </div>
        ) : eventos.length === 0 ? (
          !error && <p className="rounded-2xl bg-white px-5 py-6 text-slate-600 shadow-lg shadow-brand-950/5">No hay eventos próximos por ahora. Vuelve pronto.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => {
              const enCurso = evento.fecha_inicio <= hoy
              return (
                <article key={evento.id} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/10 ring-1 ring-brand-900/5">
                  <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 to-accent-500" />
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-accent-700">{rangoDeFechas(evento)}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${enCurso ? 'bg-accent-50 text-accent-700' : 'bg-brand-100 text-brand-800'}`}>
                      {enCurso ? 'En curso' : 'Próximo'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-brand-900">{evento.nombre}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-brand-700">
                    <span aria-hidden="true">📍</span>
                    {[evento.ubicacion, nombreDepartamento(evento.id_departamento)].filter(Boolean).join(' · ')}
                  </p>
                  {evento.descripcion && <p className="mt-3 text-sm leading-6 text-slate-600">{evento.descripcion}</p>}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Eventos
