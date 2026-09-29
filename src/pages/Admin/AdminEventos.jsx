import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { actualizarEvento, crearEvento, eliminarEvento, fechaHoyISO, formatearFechaEvento, getEventos } from '../../services/eventosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  id_departamento: '',
}

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'

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
      fecha_inicio: evento.fecha_inicio || '',
      fecha_fin: evento.fecha_fin || '',
      ubicacion: evento.ubicacion || '',
      id_departamento: evento.id_departamento || '',
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
    // Si no se indica fecha de fin, el evento dura un solo día.
    const datos = { ...formulario, fecha_fin: formulario.fecha_fin || formulario.fecha_inicio }
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
        setMensaje('Evento creado.')
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

  const hoy = fechaHoyISO()
  const nombreDepartamento = (id) => departamentos.find((departamento) => departamento.id === id)?.nombre || '—'

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Administración de eventos</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <button type="button" onClick={abrirNuevo} className="mb-6 rounded-xl bg-accent-600 px-5 py-3 font-bold text-white transition hover:bg-accent-700">
          Nuevo evento
        </button>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
            <h2 className="text-xl font-bold text-brand-900">{eventoEditando ? 'Editar evento' : 'Nuevo evento'}</h2>
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
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
              <textarea name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} rows={2} className={CLASE_CAMPO} />
            </label>
            <div className="flex gap-3">
              <button disabled={guardando} className="rounded-xl bg-brand-800 px-5 py-2.5 font-bold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-slate-300 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cargando ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white shadow-lg shadow-brand-950/5" />
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-brand-950/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Fechas</th>
                  <th className="px-5 py-3">Departamento</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => {
                  const terminado = (evento.fecha_fin || evento.fecha_inicio) < hoy
                  return (
                    <tr key={evento.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-semibold text-brand-900">{evento.nombre}</td>
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
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button type="button" onClick={() => abrirEditar(evento)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                        <button type="button" onClick={() => eliminar(evento)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                      </td>
                    </tr>
                  )
                })}
                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate-500">No hay eventos registrados todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminEventos
