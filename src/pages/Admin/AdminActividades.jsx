import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { actualizarActividad, crearActividad, eliminarActividad, getActividades } from '../../services/actividadesService.js'
import { getDestinos } from '../../services/destinosService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'

const FORMULARIO_VACIO = { nombre: '', descripcion: '', id_destino: '' }

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'

function AdminActividades() {
  const [actividades, setActividades] = useState([])
  const [destinos, setDestinos] = useState([])
  const [filtroDestino, setFiltroDestino] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [actividadEditando, setActividadEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true)
      setError('')
      try {
        let [listaActividades, listaDestinos] = await Promise.all([getActividades(), getDestinos()])
        // Primera vez: se cargan las actividades de ejemplo.
        if (listaActividades.length === 0 && listaDestinos.length > 0) {
          try {
            await sembrarCatalogoDeEjemplo()
            listaActividades = await getActividades()
          } catch (errorSembrado) {
            console.error('Error al sembrar actividades de ejemplo:', errorSembrado)
          }
        }
        setActividades(listaActividades)
        setDestinos(listaDestinos)
      } catch (errorLectura) {
        console.error('Error al cargar actividades en AdminActividades:', errorLectura)
        setError('No se pudieron cargar las actividades. Verifica tu conexión con Firestore.')
      } finally {
        setCargando(false)
      }
    }

    cargarTodo()
  }, [version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  function abrirNueva() {
    setActividadEditando(null)
    setFormulario({ ...FORMULARIO_VACIO, id_destino: filtroDestino })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(actividad) {
    setActividadEditando(actividad)
    setFormulario({
      nombre: actividad.nombre || '',
      descripcion: actividad.descripcion || '',
      id_destino: actividad.id_destino || '',
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
    if (!formulario.nombre.trim() || !formulario.id_destino) {
      setError('El nombre y el destino son obligatorios.')
      return
    }
    try {
      setGuardando(true)
      if (actividadEditando) {
        await actualizarActividad(actividadEditando.id, formulario)
        setMensaje('Actividad actualizada.')
      } else {
        await crearActividad(formulario)
        setMensaje('Actividad creada.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (error) {
      console.error('Error al guardar actividad:', error)
      setError('No se pudo guardar la actividad.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(actividad) {
    if (!window.confirm(`¿Eliminar la actividad "${actividad.nombre}"?`)) return
    setError('')
    try {
      await eliminarActividad(actividad.id)
      setMensaje('Actividad eliminada.')
      refrescar()
    } catch (error) {
      console.error('Error al eliminar actividad:', error)
      setError('No se pudo eliminar la actividad.')
    }
  }

  const nombreDestino = (id) => destinos.find((destino) => destino.id === id)?.nombre || 'Destino eliminado'
  const actividadesVisibles = filtroDestino ? actividades.filter((actividad) => actividad.id_destino === filtroDestino) : actividades

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Administración de actividades</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <button type="button" onClick={abrirNueva} className="rounded-xl bg-accent-600 px-5 py-3 font-bold text-white transition hover:bg-accent-700">
            Nueva actividad
          </button>
          <label className="block text-sm font-semibold text-slate-700">
            Filtrar por destino
            <select value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)} className={`${CLASE_CAMPO} bg-white`}>
              <option value="">Todos los destinos</option>
              {destinos.map((destino) => (
                <option key={destino.id} value={destino.id}>{destino.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
            <h2 className="text-xl font-bold text-brand-900">{actividadEditando ? 'Editar actividad' : 'Nueva actividad'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre
                <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} placeholder="Ej: Avistamiento de flamencos" className={CLASE_CAMPO} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Destino
                <select name="id_destino" value={formulario.id_destino} onChange={actualizarCampo} className={CLASE_CAMPO}>
                  <option value="">Selecciona un destino</option>
                  {destinos.map((destino) => (
                    <option key={destino.id} value={destino.id}>{destino.nombre}</option>
                  ))}
                </select>
              </label>
            </div>
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
                  <th className="px-5 py-3">Destino</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividadesVisibles.map((actividad) => (
                  <tr key={actividad.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-brand-900">{actividad.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{nombreDestino(actividad.id_destino)}</td>
                    <td className="px-5 py-3 text-slate-600">{actividad.descripcion}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button type="button" onClick={() => abrirEditar(actividad)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                      <button type="button" onClick={() => eliminar(actividad)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {actividadesVisibles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate-500">No hay actividades registradas todavía.</td>
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

export default AdminActividades
