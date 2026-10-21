import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { lazy, Suspense } from 'react'
import { publicarNovedad } from '../../services/notificacionesService.js'
import AdminNav from '../../components/AdminNav.jsx'
import Modal from '../../components/Modal.jsx'
import SelectorImagen from '../../components/SelectorImagen.jsx'
import { actualizarEvento, crearEvento, eliminarEvento, fechaHoyISO, formatearFechaEvento, getAsistentesEvento, getEventos } from '../../services/eventosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getUsuarioPorId } from '../../services/usuariosService.js'

const SelectorUbicacion = lazy(() => import('../../components/mapa/SelectorUbicacion.jsx'))

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  id_departamento: '',
  imagen: '',
  latitud: '',
  longitud: '',
  cronograma: '',
  recomendaciones: '',
}

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30'

function AdminEventos() {
  const [eventos, setEventos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [eventoEditando, setEventoEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [subidasPendientes, setSubidasPendientes] = useState(0)
  const [eventoAsistentes, setEventoAsistentes] = useState(null)
  const [asistentes, setAsistentes] = useState([])
  const [cargandoAsistentes, setCargandoAsistentes] = useState(false)
  const [errorAsistentes, setErrorAsistentes] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true)
      setError('')
      try {
        const [listaEventos, listaDepartamentos] = await Promise.all([getEventos(), getDepartamentos()])
        setEventos(listaEventos)
        setDepartamentos(listaDepartamentos.length > 0 ? listaDepartamentos : departamentosDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al cargar eventos en AdminEventos:', errorLectura)
        setError('No se pudieron cargar los eventos. Verifica tu conexión con Firestore.')
      } finally {
        setCargando(false)
      }
    }

    cargarTodo()
  }, [version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  function abrirNuevo() {
    setEventoEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(evento) {
    setEventoEditando(evento)
    setFormulario({
      nombre: evento.nombre || '',
      descripcion: evento.descripcion || '',
      imagen: evento.imagen || '',
      cronograma: Array.isArray(evento.cronograma) ? evento.cronograma.join('\n') : '',
      recomendaciones: evento.recomendaciones || '',
      fecha_inicio: evento.fecha_inicio || '',
      fecha_fin: evento.fecha_fin || '',
      ubicacion: evento.ubicacion || '',
      id_departamento: evento.id_departamento || '',
      latitud: evento.latitud ?? '',
      longitud: evento.longitud ?? '',
    })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function actualizarCampo(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value })
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError('')
    if (!formulario.nombre.trim() || !formulario.fecha_inicio || !formulario.id_departamento) {
      setError('Nombre, fecha de inicio y departamento son obligatorios.')
      return
    }
    if (formulario.latitud === '' || formulario.longitud === '') {
      setError('Marca la ubicación del evento en el mapa para que aparezca en el mapa turístico.')
      return
    }
    // Si no se indica fecha de fin, el evento dura un solo día.
    const datos = {
      ...formulario,
      fecha_fin: formulario.fecha_fin || formulario.fecha_inicio,
      imagen: formulario.imagen.trim(),
      latitud: formulario.latitud === '' ? null : Number(formulario.latitud),
      longitud: formulario.longitud === '' ? null : Number(formulario.longitud),
      cronograma: formulario.cronograma.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean),
    }
    if (datos.fecha_fin < datos.fecha_inicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    try {
      setGuardando(true)
      if (eventoEditando) {
        await actualizarEvento(eventoEditando.id, datos)
        setMensaje('Evento actualizado.')
      } else {
        await crearEvento(datos)
        // Notifica a los turistas (si falla, el evento igual queda creado).
        await publicarNovedad({
          tipo: 'evento',
          titulo: `Nuevo evento: ${datos.nombre.trim()}`,
          mensaje: [formatearFechaEvento(datos.fecha_inicio), datos.ubicacion].filter(Boolean).join(' · '),
          enlace: '/eventos',
        }).catch((errorNovedad) => console.warn('No se publicó la notificación del evento:', errorNovedad))
        setMensaje('Evento creado y notificado a los turistas.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (error) {
      console.error('Error al guardar evento:', error)
      setError('No se pudo guardar el evento.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(evento) {
    if (!window.confirm(`¿Eliminar el evento "${evento.nombre}"?`)) return
    setError('')
    try {
      await eliminarEvento(evento.id)
      setMensaje('Evento eliminado.')
      refrescar()
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      setError('No se pudo eliminar el evento.')
    }
  }

  async function verAsistentes(evento) {
    setEventoAsistentes(evento)
    setAsistentes([])
    setErrorAsistentes('')
    setCargandoAsistentes(true)
    try {
      const inscripciones = await getAsistentesEvento(evento.id)
      const lista = await Promise.all(inscripciones.map(async (inscripcion) => ({
        ...inscripcion,
        usuario: await getUsuarioPorId(inscripcion.id_usuario || inscripcion.id),
      })))
      setAsistentes(lista)
    } catch (errorLectura) {
      console.error('Error al cargar asistentes del evento:', errorLectura)
      setErrorAsistentes('No se pudo cargar la lista de asistentes. Verifica las reglas de lectura de asistentes y usuarios.')
    } finally {
      setCargandoAsistentes(false)
    }
  }

  const hoy = fechaHoyISO()
  const nombreDepartamento = (id) => departamentos.find((departamento) => departamento.id === id)?.nombre || '—'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="admin-layout contenedor max-w-6xl py-12">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Administración de eventos</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <button type="button" onClick={abrirNuevo} className="mb-6 rounded-xl boton-principal px-5 py-3 font-bold text-white transition">
          Nuevo evento
        </button>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl p-6 cristal">
            <h2 className="text-xl font-bold text-slate-900">{eventoEditando ? 'Editar evento' : 'Nuevo evento'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre
                <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} className={CLASE_CAMPO} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Departamento
                <select name="id_departamento" value={formulario.id_departamento} onChange={actualizarCampo} className={CLASE_CAMPO}>
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Fecha de inicio
                <input name="fecha_inicio" type="date" value={formulario.fecha_inicio} onChange={actualizarCampo} className={CLASE_CAMPO} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Fecha de fin
                <input name="fecha_fin" type="date" min={formulario.fecha_inicio || undefined} value={formulario.fecha_fin} onChange={actualizarCampo} className={CLASE_CAMPO} />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Ubicación
              <input name="ubicacion" value={formulario.ubicacion} onChange={actualizarCampo} placeholder="Ej: Plaza 14 de Septiembre, Cochabamba" className={CLASE_CAMPO} />
            </label>
            <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-white/50" />}>
              <SelectorUbicacion
                latitud={formulario.latitud}
                longitud={formulario.longitud}
                clave="evento"
                onCambiar={(ubicacion) => setFormulario((actual) => ({ ...actual, ...ubicacion }))}
              />
            </Suspense>
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
              <textarea name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} rows={2} className={CLASE_CAMPO} />
            </label>
            <SelectorImagen
              etiqueta="Imagen del evento"
              valor={formulario.imagen}
              onUploading={(subiendo) => setSubidasPendientes((pendientes) => pendientes + (subiendo ? 1 : -1))}
              onChange={(imagen) => setFormulario((actual) => ({ ...actual, imagen }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Cronograma (una actividad por línea)
                <textarea name="cronograma" value={formulario.cronograma} onChange={actualizarCampo} rows={4} placeholder={'Sábado · 10:00 — Inauguración\nSábado · 15:00 — Concurso de danzas'} className={CLASE_CAMPO} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Recomendaciones para asistentes
                <textarea name="recomendaciones" value={formulario.recomendaciones} onChange={actualizarCampo} rows={4} placeholder="Qué llevar, cómo llegar, entradas..." className={CLASE_CAMPO} />
              </label>
            </div>
            <div className="flex gap-3">
              <button disabled={guardando || subidasPendientes > 0} className="rounded-xl bg-brand-700 px-5 py-2.5 font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
                {guardando ? 'Guardando...' : subidasPendientes > 0 ? 'Subiendo imágenes...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-neutral-300 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cargando ? (
          <div className="h-48 animate-pulse rounded-2xl bg-sal-2 cristal" />
        ) : (
          <div className="overflow-x-auto rounded-2xl cristal">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Foto</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Fechas</th>
                  <th className="px-5 py-3">Departamento</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Asistentes</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => {
                  const terminado = (evento.fecha_fin || evento.fecha_inicio) < hoy
                  return (
                    <tr key={evento.id} className="border-t border-neutral-100">
                      <td className="px-5 py-3"><ImagenSegura src={evento.imagen} alt="" className="h-12 w-16 rounded-lg object-cover" /></td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{evento.nombre}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {formatearFechaEvento(evento.fecha_inicio)}
                        {evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio && ` – ${formatearFechaEvento(evento.fecha_fin)}`}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{nombreDepartamento(evento.id_departamento)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${terminado ? 'bg-slate-100 text-slate-500' : 'bg-brand-100 text-brand-800'}`}>
                          {terminado ? 'Finalizado' : 'Próximo'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => verAsistentes(evento)} className="font-semibold text-brand-700 hover:underline">
                          {Number(evento.asistentes_count) || 0} · Ver quiénes
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button type="button" onClick={() => abrirEditar(evento)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                        <button type="button" onClick={() => eliminar(evento)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                      </td>
                    </tr>
                  )
                })}
                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-slate-500">No hay eventos registrados todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {eventoAsistentes && (
        <Modal titulo={`Asistentes de ${eventoAsistentes.nombre}`} onCerrar={() => setEventoAsistentes(null)}>
          <div className="p-6 sm:p-8">
            <h2 className="mb-1 pr-10 text-2xl font-bold text-slate-900">Asistentes</h2>
            <p className="mb-5 text-sm text-slate-600">{eventoAsistentes.nombre} · {asistentes.length} inscritos</p>
            {errorAsistentes ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{errorAsistentes}</p>
            ) : cargandoAsistentes ? (
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" aria-label="Cargando asistentes" />
            ) : asistentes.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">Todavía no hay personas anotadas.</p>
            ) : (
              <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
                {asistentes.map((asistente) => {
                  const usuario = asistente.usuario
                  const nombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || usuario?.email || 'Perfil no disponible'
                  return (
                    <li key={asistente.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <ImagenSegura
                        src={usuario?.fotoUrl}
                        alt={nombre.slice(0, 2).toUpperCase()}
                        className="h-10 w-10 shrink-0 rounded-full object-cover p-0 text-xs"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">{nombre}</span>
                        {usuario?.email && <span className="block truncate text-xs text-slate-500">{usuario.email}</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminEventos
