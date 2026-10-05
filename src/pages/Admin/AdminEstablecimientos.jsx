import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import AdminZonaCampos from '../../components/AdminZonaCampos.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { municipiosDeEjemplo, getMunicipios } from '../../services/municipiosService.js'
import { regionesDeEjemplo, getRegiones } from '../../services/regionesService.js'

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'
const FORMULARIO_BASE = {
  nombre: '',
  id_departamento: '',
  id_municipio: '',
  id_region: '',
  direccion: '',
  telefono: '',
}

function crearFormularioVacio(campos) {
  return { ...FORMULARIO_BASE, ...Object.fromEntries(campos.map((campo) => [campo.nombre, ''])) }
}

function AdminEstablecimientos({ configuracion }) {
  const formularioVacio = crearFormularioVacio(configuracion.campos)
  const [elementos, setElementos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [regiones, setRegiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [elementoEditando, setElementoEditando] = useState(null)
  const [formulario, setFormulario] = useState(formularioVacio)
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    async function cargarDatos() {
      setCargando(true)
      setError('')
      try {
        const [lista, listaDepartamentos, listaMunicipios, listaRegiones] = await Promise.all([
          configuracion.listar(),
          getDepartamentos(),
          getMunicipios(),
          getRegiones(),
        ])
        if (!activo) return
        setElementos(lista)
        setDepartamentos(listaDepartamentos.length ? listaDepartamentos : departamentosDeEjemplo)
        setMunicipios(listaMunicipios.length ? listaMunicipios : municipiosDeEjemplo)
        setRegiones(listaRegiones.length ? listaRegiones : regionesDeEjemplo)
      } catch (errorLectura) {
        console.error(`Error al cargar ${configuracion.plural}:`, errorLectura)
        if (activo) setError(`No se pudieron cargar ${configuracion.plural.toLocaleLowerCase('es')}.`)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarDatos()
    return () => { activo = false }
  }, [configuracion, version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  function abrirNuevo() {
    setElementoEditando(null)
    setFormulario(formularioVacio)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(elemento) {
    setElementoEditando(elemento)
    const campos = Object.fromEntries(configuracion.campos.map((campo) => [
      campo.nombre,
      campo.aFormulario ? campo.aFormulario(elemento) : String(elemento[campo.nombre] ?? ''),
    ]))
    setFormulario({
      ...FORMULARIO_BASE,
      ...campos,
      nombre: elemento.nombre || '',
      id_departamento: elemento.id_departamento || '',
      id_municipio: elemento.id_municipio || '',
      id_region: elemento.id_region || '',
      direccion: elemento.direccion || '',
      telefono: elemento.telefono || '',
    })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function actualizarCampo(evento) {
    const { name, value } = evento.target
    if (name === 'id_departamento') {
      setFormulario((actual) => ({ ...actual, id_departamento: value, id_municipio: '', id_region: '' }))
    } else if (name === 'id_municipio') {
      setFormulario((actual) => ({ ...actual, id_municipio: value, id_region: '' }))
    } else {
      setFormulario((actual) => ({ ...actual, [name]: value }))
    }
  }

  function obtenerUbicacion(datos) {
    const region = regiones.find((item) => item.id === datos.id_region)
    const municipio = municipios.find((item) => item.id === datos.id_municipio)
    const departamento = departamentos.find((item) => item.id === datos.id_departamento)
    return [region?.nombre, municipio?.nombre, departamento?.nombre].filter(Boolean).join(', ')
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError('')
    if (!formulario.nombre.trim() || !formulario.id_region) {
      setError('El nombre y la región son obligatorios.')
      return
    }

    const datos = {
      ...formulario,
      ...(configuracion.serializar ? configuracion.serializar(formulario) : {}),
    }
    datos.nombre = formulario.nombre.trim()
    datos.ubicacion = obtenerUbicacion(formulario)

    try {
      setGuardando(true)
      if (elementoEditando) {
        await configuracion.actualizar(elementoEditando.id, datos)
        setMensaje(`${configuracion.singular} actualizado correctamente.`)
      } else {
        await configuracion.crear(datos)
        setMensaje(`${configuracion.singular} creado correctamente.`)
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (errorEscritura) {
      console.error(`Error al guardar ${configuracion.singular.toLocaleLowerCase('es')}:`, errorEscritura)
      setError(`No se pudo guardar ${configuracion.singular.toLocaleLowerCase('es')}.`)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(elemento) {
    if (!window.confirm(`¿Eliminar "${elemento.nombre}"? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await configuracion.eliminar(elemento.id)
      setMensaje(`${configuracion.singular} eliminado correctamente.`)
      refrescar()
    } catch (errorEscritura) {
      console.error(`Error al eliminar ${configuracion.singular.toLocaleLowerCase('es')}:`, errorEscritura)
      setError(`No se pudo eliminar ${configuracion.singular.toLocaleLowerCase('es')}.`)
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Administración de {configuracion.plural.toLocaleLowerCase('es')}</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <button type="button" onClick={abrirNuevo} className="mb-6 rounded-xl bg-accent-600 px-5 py-3 font-bold text-white transition hover:bg-accent-700">
          Nuevo {configuracion.singular.toLocaleLowerCase('es')}
        </button>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
            <h2 className="text-xl font-bold text-brand-900">{elementoEditando ? `Editar ${configuracion.singular.toLocaleLowerCase('es')}` : `Nuevo ${configuracion.singular.toLocaleLowerCase('es')}`}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre
                <input required maxLength={150} name="nombre" value={formulario.nombre} onChange={actualizarCampo} className={CLASE_CAMPO} />
              </label>
              {configuracion.campos.map((campo) => (
                <label key={campo.nombre} className={`block text-sm font-semibold text-slate-700 ${campo.tipo === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  {campo.etiqueta}
                  {campo.tipo === 'textarea' ? (
                    <textarea name={campo.nombre} value={formulario[campo.nombre]} onChange={actualizarCampo} rows={3} maxLength={campo.maxLength || 2000} placeholder={campo.placeholder} className={CLASE_CAMPO} />
                  ) : (
                    <input required={campo.requerido} type={campo.tipo || 'text'} min={campo.min} step={campo.step} name={campo.nombre} value={formulario[campo.nombre]} onChange={actualizarCampo} placeholder={campo.placeholder} className={CLASE_CAMPO} />
                  )}
                </label>
              ))}
              <label className="block text-sm font-semibold text-slate-700">
                Dirección
                <input name="direccion" maxLength={255} value={formulario.direccion} onChange={actualizarCampo} className={CLASE_CAMPO} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Teléfono
                <input name="telefono" maxLength={20} value={formulario.telefono} onChange={actualizarCampo} className={CLASE_CAMPO} />
              </label>
            </div>
            <AdminZonaCampos
              departamentos={departamentos}
              municipios={municipios}
              regiones={regiones}
              formulario={formulario}
              onChange={actualizarCampo}
            />
            <div className="flex gap-3">
              <button disabled={guardando} className="rounded-xl bg-brand-800 px-5 py-2.5 font-bold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-slate-300 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100">Cancelar</button>
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
                  {configuracion.columnas.map((columna) => <th key={columna.titulo} className="px-5 py-3">{columna.titulo}</th>)}
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {elementos.map((elemento) => (
                  <tr key={elemento.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-brand-900">{elemento.nombre}</td>
                    {configuracion.columnas.map((columna) => <td key={columna.titulo} className="px-5 py-3 text-slate-600">{columna.mostrar(elemento)}</td>)}
                    <td className="px-5 py-3 text-slate-600">{elemento.ubicacion || elemento.direccion || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button type="button" onClick={() => abrirEditar(elemento)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                      <button type="button" onClick={() => eliminar(elemento)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {elementos.length === 0 && (
                  <tr><td colSpan={configuracion.columnas.length + 3} className="px-5 py-6 text-center text-slate-500">No hay {configuracion.plural.toLocaleLowerCase('es')} registrados todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminEstablecimientos
