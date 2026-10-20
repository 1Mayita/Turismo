import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Lightbulb, MapPin } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { Aparecer, EstadoVacio, claseBoton } from '../../components/ui'
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
    <div className="flex min-w-16 flex-col items-center rounded-control bg-white px-3 pb-1.5 pt-1 text-center shadow-suave">
      <span className="titulo-display text-[32px] leading-none">{formatearFechaEvento(fechaISO, { day: 'numeric' })}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-atardecer-700">{formatearFechaEvento(fechaISO, { month: 'short' }).replace('.', '')}</span>
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
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cobre-texto">Agenda cultural</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">Próximos eventos</h1>
          <p className="texto-lectura mt-3 text-lg text-piedra-texto">Festivales, ferias y celebraciones para sumar a tu viaje.</p>
        </div>

        {error && <p className="mb-8 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => (
              <div key={indice} className="h-80 animate-pulse rounded-tarjeta bg-sal-2" />
            ))}
          </div>
        ) : eventos.length === 0 ? (
          !error && <EstadoVacio icono={CalendarDays} titulo="No hay eventos próximos por ahora" mensaje="Pronto publicaremos nuevas fiestas y festivales. Vuelve pronto." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento, indice) => {
              const enCurso = evento.fecha_inicio <= hoy
              return (
                <Aparecer key={evento.id} indice={indice % 3} como="article" className="flex flex-col rounded-tarjeta border border-borde bg-white p-3 shadow-suave">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-imagen bg-sal-2">
                    <ImagenSegura src={evento.imagen} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3"><FechaDestacada fechaISO={evento.fecha_inicio} /></div>
                    <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-suave ${enCurso ? 'bg-emerald-700 text-white' : 'bg-white/95 text-noche'}`}>
                      {enCurso ? 'En curso' : 'Próximo'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-cobre-texto">
                      <CalendarDays aria-hidden="true" size={16} /> {rangoDeFechas(evento)}
                    </p>
                    <h2 className="mt-1.5 text-lg font-bold leading-snug text-noche">{evento.nombre}</h2>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-piedra-texto">
                      <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-piedra" /> {lugarDe(evento)}
                    </p>
                    {evento.descripcion && <p className="mt-3 line-clamp-2 text-sm leading-6 text-piedra-texto">{evento.descripcion}</p>}
                    <div className="mt-auto pt-4">
                      <button type="button" onClick={() => setEventoAbierto(evento)} className={claseBoton('secundario', 'pequeno')}>
                        Ver más
                        <ArrowRight aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </div>
                </Aparecer>
              )
            })}
          </div>
        )}
      </main>

      {eventoAbierto && (
        <Modal titulo={eventoAbierto.nombre} onCerrar={() => setEventoAbierto(null)}>
          <ImagenSegura src={eventoAbierto.imagen} alt="" className="h-56 w-full object-cover sm:h-64" />
          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-cobre-texto">
                <CalendarDays aria-hidden="true" size={16} /> {rangoDeFechas(eventoAbierto)}
              </p>
              <h2 className="titulo-display mt-1 text-[34px]">{eventoAbierto.nombre}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-piedra-texto">
                <MapPin aria-hidden="true" size={16} className="text-piedra" /> {lugarDe(eventoAbierto)}
              </p>
            </div>
            {eventoAbierto.descripcion && <p className="leading-7 text-noche/80">{eventoAbierto.descripcion}</p>}

            <div>
              <h3 className="mb-3 text-sm font-bold text-noche">Cronograma</h3>
              {cronograma.length > 0 ? (
                <ol className="relative space-y-3 border-l-2 border-cielo pl-5">
                  {cronograma.map((actividad, indice) => (
                    <li key={actividad + indice} className="relative text-sm text-noche/85">
                      <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-atardecer" aria-hidden="true" />
                      {actividad}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-piedra-texto">Los organizadores todavía no publicaron el cronograma.</p>
              )}
            </div>

            {eventoAbierto.recomendaciones && (
              <div className="rounded-control bg-sal-2 p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-noche">
                  <Lightbulb aria-hidden="true" size={16} className="text-cielo-700" /> Recomendaciones
                </h3>
                <p className="text-sm leading-6 text-noche/80">{eventoAbierto.recomendaciones}</p>
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
