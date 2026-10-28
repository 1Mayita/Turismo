import { useEffect, useState } from 'react'
import PanelAdmin, { BotonNuevo } from '../../components/PanelAdmin.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import SelectorImagen from '../../components/SelectorImagen.jsx'
import { actualizarPlato, crearPlato, eliminarPlato, getPlatos } from '../../services/platosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'

const FORMULARIO_VACIO = {
  nombre: '',
  id_departamento: '',
  origen: '',
  descripcion: '',
  ingredientes: '',
  lugares_tradicionales: '',
  imagen: '',
}

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30'

function AdminPlatos() {
  const [platos, setPlatos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [platoEditando, setPlatoEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [subidasPendientes, setSubidasPendientes] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true)
      setError('')
      try {
        const [listaPlatos, listaDepartamentos] = await Promise.all([getPlatos(), getDepartamentos()])
        setPlatos(listaPlatos.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es')))
        setDepartamentos(listaDepartamentos.length > 0 ? listaDepartamentos : departamentosDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al cargar platos en AdminPlatos:', errorLectura)
        setError('No se pudieron cargar los platos típicos. Verifica tu conexión y las reglas de Firestore.')
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
    setPlatoEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(plato) {
    setPlatoEditando(plato)
    setFormulario({
      nombre: plato.nombre || '',
      id_departamento: plato.id_departamento || '',
      origen: plato.origen || '',
      descripcion: plato.descripcion || '',
      ingredientes: Array.isArray(plato.ingredientes) ? plato.ingredientes.join('\n') : '',
      lugares_tradicionales: plato.lugares_tradicionales || '',
      imagen: plato.imagen || '',
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
    if (!formulario.nombre.trim() || !formulario.id_departamento) {
      setError('El nombre y el departamento de origen son obligatorios.')
      return
    }

    const departamento = departamentos.find((item) => item.id === formulario.id_departamento)
    const imagenCambio = platoEditando && formulario.imagen.trim() !== (platoEditando.imagen || '')
    const datos = {
      ...formulario,
      nombre: formulario.nombre.trim(),
      // Si no se escribe un origen más preciso, se usa el nombre del departamento.
      origen: formulario.origen.trim() || departamento?.nombre || '',
      imagen: formulario.imagen.trim(),
      ingredientes: formulario.ingredientes.split(/\r?\n/).map((ingrediente) => ingrediente.trim()).filter(Boolean),
      // El crédito pertenecía a la foto anterior.
      ...(imagenCambio ? { credito_imagen: '' } : {}),
    }

    try {
      setGuardando(true)
      if (platoEditando) {
        await actualizarPlato(platoEditando.id, datos)
        setMensaje('Plato actualizado.')
      } else {
        await crearPlato(datos)
        setMensaje('Plato creado.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (errorEscritura) {
      console.error('Error al guardar plato:', errorEscritura)
      setError('No se pudo guardar el plato.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(plato) {
    if (!window.confirm(`¿Eliminar el plato "${plato.nombre}"? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await eliminarPlato(plato.id)
      setMensaje('Plato eliminado.')
      refrescar()
    } catch (errorEscritura) {
      console.error('Error al eliminar plato:', errorEscritura)
      setError('No se pudo eliminar el plato.')
    }
  }

  const nombreDepartamento = (id) => departamentos.find((departamento) => departamento.id === id)?.nombre || '—'

  return (
    <PanelAdmin
      titulo="Administración de platos típicos"
      acciones={<BotonNuevo onClick={abrirNuevo}>Nuevo plato</BotonNuevo>}
    >
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      {mensaje && <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{mensaje}</p>}

      {formularioAbierto && (
        <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl p-6 cristal">
          <h2 className="text-xl font-bold text-slate-900">{platoEditando ? 'Editar plato' : 'Nuevo plato'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nombre
              <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} placeholder="Ej.: Silpancho" className={CLASE_CAMPO} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Departamento de origen
              <select name="id_departamento" value={formulario.id_departamento} onChange={actualizarCampo} className={CLASE_CAMPO}>
                <option value="">Selecciona un departamento</option>
                {departamentos.map((departamento) => (
                  <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Origen (texto que verá el turista, opcional)
              <input name="origen" value={formulario.origen} onChange={actualizarCampo} placeholder="Ej.: Valles de Cochabamba" className={CLASE_CAMPO} />
            </label>
            <SelectorImagen
              etiqueta="Foto del plato"
              valor={formulario.imagen}
              onUploading={(subiendo) => setSubidasPendientes((pendientes) => pendientes + (subiendo ? 1 : -1))}
              onChange={(imagen) => setFormulario((actual) => ({ ...actual, imagen }))}
            />
          </div>
          {formulario.imagen.trim() && (
            <ImagenSegura key={formulario.imagen} src={formulario.imagen.trim()} alt="No se pudo cargar la foto" className="h-28 w-44 rounded-lg object-cover text-xs" />
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Descripción
            <textarea name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} rows={3} className={CLASE_CAMPO} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Ingredientes (uno por línea)
              <textarea name="ingredientes" value={formulario.ingredientes} onChange={actualizarCampo} rows={4} placeholder={'Carne de res\nArroz\nPapa'} className={CLASE_CAMPO} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Lugares tradicionales donde probarlo
              <textarea name="lugares_tradicionales" value={formulario.lugares_tradicionales} onChange={actualizarCampo} rows={4} placeholder="Mercados, barrios o pueblos donde es típico" className={CLASE_CAMPO} />
            </label>
          </div>
          <p className="text-xs text-slate-500">Los restaurantes que tengan este plato en su menú aparecen solos en “Dónde probarlo”: el nombre debe coincidir.</p>
          <div className="flex gap-3">
            <button disabled={guardando || subidasPendientes > 0} className="rounded-xl bg-brand-700 px-5 py-2.5 font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
              {guardando ? 'Guardando...' : subidasPendientes > 0 ? 'Subiendo imágenes...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-sky-200 bg-white/70 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-white">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <div className="h-48 animate-pulse rounded-2xl bg-sal-2" />
      ) : (
        <div className="overflow-x-auto rounded-2xl cristal">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Foto</th>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Origen</th>
                <th className="px-5 py-3">Descripción</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {platos.map((plato) => (
                <tr key={plato.id} className="border-t border-white/70">
                  <td className="px-5 py-3"><ImagenSegura src={plato.imagen} alt="" className="h-12 w-16 rounded-lg object-cover" /></td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{plato.nombre}</td>
                  <td className="px-5 py-3 text-slate-600">{plato.origen || nombreDepartamento(plato.id_departamento)}</td>
                  <td className="max-w-xs px-5 py-3 text-slate-600"><span className="line-clamp-2">{plato.descripcion}</span></td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button type="button" onClick={() => abrirEditar(plato)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                    <button type="button" onClick={() => eliminar(plato)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {platos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">No hay platos registrados todavía. Puedes cargarlos con “Cargar datos de ejemplo” en la pestaña Destinos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PanelAdmin>
  )
}

export default AdminPlatos
