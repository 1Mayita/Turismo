import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { actualizarCategoria, crearCategoria, eliminarCategoria, getCategorias } from '../../services/categoriasService.js'

const FORMULARIO_VACIO = { nombre: '', descripcion: '' }

function AdminCategorias() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarCategorias() {
      setCargando(true)
      setError('')
      try {
        setCategorias(await getCategorias())
      } catch (errorLectura) {
        console.error('Error al cargar categorías en AdminCategorias:', errorLectura)
        setError('No se pudieron cargar las categorías.')
      } finally {
        setCargando(false)
      }
    }

    cargarCategorias()
  }, [version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  function abrirNueva() {
    setCategoriaEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(categoria) {
    setCategoriaEditando(categoria)
    setFormulario({ nombre: categoria.nombre || '', descripcion: categoria.descripcion || '' })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError('')
    if (!formulario.nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.')
      return
    }
    try {
      setGuardando(true)
      if (categoriaEditando) {
        await actualizarCategoria(categoriaEditando.id, formulario)
        setMensaje('Categoría actualizada.')
      } else {
        await crearCategoria(formulario)
        setMensaje('Categoría creada.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (error) {
      console.error('Error al guardar categoría:', error)
      setError('No se pudo guardar la categoría.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(categoria) {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return
    setError('')
    try {
      await eliminarCategoria(categoria.id)
      setMensaje('Categoría eliminada.')
      refrescar()
    } catch (error) {
      console.error('Error al eliminar categoría:', error)
      setError('No se pudo eliminar la categoría.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Administración de categorías</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <button type="button" onClick={abrirNueva} className="mb-6 rounded-xl bg-accent-600 px-5 py-3 font-bold text-white transition hover:bg-accent-700">
          Nueva categoría
        </button>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
            <h2 className="text-xl font-bold text-brand-900">{categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Nombre
              <input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
              <textarea value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
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
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-brand-900">{categoria.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{categoria.descripcion}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => abrirEditar(categoria)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                      <button type="button" onClick={() => eliminar(categoria)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {categorias.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-slate-500">No hay categorías registradas todavía.</td>
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

export default AdminCategorias
