import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import BotonReportar from '../../components/BotonReportar.jsx'
import Modal from '../../components/Modal.jsx'
import { fechaHoyISO, formatearFechaEvento, getEventos, getEventosProximos } from '../../services/eventosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'

function rangoDeFechas(evento) {
  if (!evento.fecha_fin || evento.fecha_fin === evento.fecha_inicio) return formatearFechaEvento(evento.fecha_inicio)
  return `${formatearFechaEvento(evento.fecha_inicio, { day: 'numeric', month: 'short' })} – ${formatearFechaEvento(evento.fecha_fin)}`
}

// Recuadro de calendario con el día y el mes de inicio.
function FechaDestacada({ fechaISO }) {
  return (
    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white/95 text-center shadow-md">
      <span className="text-2xl font-extrabold leading-none text-brand-800">{formatearFechaEvento(fechaISO, { day: 'numeric' })}</span>
      <span className="text-xs font-bold uppercase text-accent-600">{formatearFechaEvento(fechaISO, { month: 'short' }).replace('.', '')}</span>
    </div>
  )
}

function Eventos() {
  const [eventos, setEventos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [eventoAbierto, setEventoAbierto] = useState(null)
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
  const lugarDe = (evento) => [evento.ubicacion, nombreDepartamento(evento.id_departamento)].filter(Boolean).join(' · ')
  const cronograma = Array.isArray(eventoAbierto?.cronograma) ? eventoAbierto.cronograma : []

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Agenda cultural</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Próximos eventos</h1>
          <p className="mt-4 text-lg text-slate-600">Festivales, ferias y celebraciones para sumar a tu viaje.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => (
              <div key={indice} className="h-80 animate-pulse rounded-3xl bg-white/50" />
            ))}
          </div>
        ) : eventos.length === 0 ? (
          !error && <p className="rounded-2xl bg-white/60 px-5 py-6 text-slate-600 ring-1 ring-white/80">No hay eventos próximos por ahora. Vuelve pronto.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => {
              const enCurso = evento.fecha_inicio <= hoy
              return (
                <article key={evento.id} className="flex flex-col overflow-hidden rounded-3xl cristal">
                  <div className="relative m-2 h-44 overflow-hidden rounded-2xl">
                    <ImagenSegura src={evento.imagen} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3"><FechaDestacada fechaISO={evento.fecha_inicio} /></div>
                    <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${enCurso ? 'bg-emerald-500 text-white' : 'bg-white/90 text-brand-800'}`}>
                      {enCurso ? 'En curso' : 'Próximo'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
                    <p className="text-sm font-bold text-accent-600">{rangoDeFechas(evento)}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{evento.nombre}</h2>
                    <p className="mt-1 text-sm text-gray-500">{lugarDe(evento)}</p>
                    {evento.descripcion && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{evento.descripcion}</p>}
                    <div className="mt-auto pt-4">
                      <button type="button" onClick={() => setEventoAbierto(evento)} className="rounded-xl boton-principal px-4 py-2 text-sm font-bold">
                        Ver más
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {eventoAbierto && (
        <Modal titulo={eventoAbierto.nombre} onCerrar={() => setEventoAbierto(null)}>
          <ImagenSegura src={eventoAbierto.imagen} alt="" className="h-56 w-full object-cover sm:rounded-t-3xl" />
          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="text-sm font-bold text-accent-600">{rangoDeFechas(eventoAbierto)}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{eventoAbierto.nombre}</h2>
              <p className="mt-1 text-sm text-gray-500">{lugarDe(eventoAbierto)}</p>
            </div>
            {eventoAbierto.descripcion && <p className="leading-7 text-slate-700">{eventoAbierto.descripcion}</p>}

            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Cronograma</h3>
              {cronograma.length > 0 ? (
                <ol className="space-y-2">
                  {cronograma.map((actividad, indice) => (
                    <li key={actividad + indice} className="flex gap-3 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-slate-700">
                      <span className="font-bold text-brand-700">{indice + 1}.</span>
                      {actividad}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-600">Los organizadores todavía no publicaron el cronograma.</p>
              )}
            </div>

            {eventoAbierto.recomendaciones && (
              <div className="rounded-2xl bg-accent-50 p-4">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-accent-700">Recomendaciones</h3>
                <p className="text-sm leading-6 text-slate-700">{eventoAbierto.recomendaciones}</p>
              </div>
            )}
            <BotonReportar tipo="evento" elemento={eventoAbierto} enlace="/eventos" />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Eventos
