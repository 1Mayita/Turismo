import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import PanelAdmin, { BotonNuevo } from '../../components/PanelAdmin.jsx'
import AdminZonaCampos from '../../components/AdminZonaCampos.jsx'
import SelectorImagen from '../../components/SelectorImagen.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { municipiosDeEjemplo, getMunicipios } from '../../services/municipiosService.js'
import { regionesDeEjemplo, getRegiones } from '../../services/regionesService.js'

// El mapa para marcar la ubicación (Leaflet) se descarga solo al abrir el formulario.
const SelectorUbicacion = lazy(() => import('../../components/mapa/SelectorUbicacion.jsx'))

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30'
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
  const [subidasPendientes, setSubidasPendientes] = useState(0)
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
    if (!formulario.nombre.trim() || !formulario.id_departamento || !formulario.id_municipio) {
      setError('El nombre, el departamento y el municipio son obligatorios.')
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
    <PanelAdmin
      titulo={`Administración de ${configuracion.plural.toLocaleLowerCase('es')}`}
      acciones={<BotonNuevo onClick={abrirNuevo}>Nuevo {configuracion.singular.toLocaleLowerCase('es')}</BotonNuevo>}
    >
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      {mensaje && <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{mensaje}</p>}

      {formularioAbierto && (
        <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl p-6 cristal">
          <h2 className="text-xl font-bold text-slate-900">{elementoEditando ? `Editar ${configuracion.singular.toLocaleLowerCase('es')}` : `Nuevo ${configuracion.singular.toLocaleLowerCase('es')}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nombre
              <input required maxLength={150} name="nombre" value={formulario.nombre} onChange={actualizarCampo} className={CLASE_CAMPO} />
            </label>
            {configuracion.campos.map((campo) => {
              if (['latitud', 'longitud'].includes(campo.nombre)) return null
              if (campo.tipo === 'image' || campo.tipo === 'images') {
                return (
                  <SelectorImagen
                    key={campo.nombre}
                    className="sm:col-span-2"
                    multiple={campo.tipo === 'images'}
                    etiqueta={campo.etiqueta}
                    onUploading={(subiendo) => setSubidasPendientes((pendientes) => pendientes + (subiendo ? 1 : -1))}
                    valor={campo.tipo === 'images'
                      ? String(formulario[campo.nombre] || '').split(/\r?\n/).filter(Boolean)
                      : formulario[campo.nombre]}
                    onChange={(imagenes) => setFormulario((actual) => ({
                      ...actual,
                      [campo.nombre]: Array.isArray(imagenes) ? imagenes.join('\n') : imagenes,
                    }))}
                  />
                )
              }
              return (
                <label key={campo.nombre} className={`block text-sm font-semibold text-slate-700 ${campo.tipo === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  {campo.etiqueta}
                  {campo.tipo === 'textarea' ? (
                    <textarea name={campo.nombre} value={formulario[campo.nombre]} onChange={actualizarCampo} rows={3} maxLength={campo.maxLength || 2000} placeholder={campo.placeholder} className={CLASE_CAMPO} />
                  ) : (
                    <input required={campo.requerido} type={campo.tipo || 'text'} min={campo.min} step={campo.step} name={campo.nombre} value={formulario[campo.nombre]} onChange={actualizarCampo} placeholder={campo.placeholder} className={CLASE_CAMPO} />
                  )}
                </label>
              )
            })}
            <label className="block text-sm font-semibold text-slate-700">
              Dirección
              <input name="direccion" maxLength={255} value={formulario.direccion} onChange={actualizarCampo} className={CLASE_CAMPO} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Teléfono
              <input name="telefono" maxLength={20} value={formulario.telefono} onChange={actualizarCampo} className={CLASE_CAMPO} />
            </label>
          </div>
          {configuracion.campos.some((campo) => campo.nombre === 'latitud') && (
            <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-sal-2" />}>
              <SelectorUbicacion
                latitud={formulario.latitud}
                longitud={formulario.longitud}
                clave={configuracion.singular.toLocaleLowerCase('es')}
                onCambiar={(ubicacion) => setFormulario((actual) => ({ ...actual, ...ubicacion }))}
              />
            </Suspense>
          )}
          <AdminZonaCampos
            departamentos={departamentos}
            municipios={municipios}
            regiones={regiones}
            formulario={formulario}
            onChange={actualizarCampo}
          />
          <div className="flex gap-3">
            <button disabled={guardando || subidasPendientes > 0} className="rounded-xl bg-brand-700 px-5 py-2.5 font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
              {guardando ? 'Guardando...' : subidasPendientes > 0 ? 'Subiendo imágenes...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-neutral-300 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100">Cancelar</button>
          </div>
        </form>
      )}

      {cargando ? (
        <div className="h-48 animate-pulse rounded-2xl bg-sal-2 cristal" />
      ) : (
        <div className="overflow-x-auto rounded-2xl cristal">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Foto</th>
                <th className="px-5 py-3">Nombre</th>
                {configuracion.columnas.map((columna) => <th key={columna.titulo} className="px-5 py-3">{columna.titulo}</th>)}
                <th className="px-5 py-3">Ubicación</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {elementos.map((elemento) => (
                <tr key={elemento.id} className="border-t border-neutral-100">
                  <td className="px-5 py-3"><ImagenSegura src={elemento.imagen_principal || elemento.imagenes?.[0]} alt="" className="h-12 w-16 rounded-lg object-cover" /></td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{elemento.nombre}</td>
                  {configuracion.columnas.map((columna) => <td key={columna.titulo} className="px-5 py-3 text-slate-600">{columna.mostrar(elemento)}</td>)}
                  <td className="px-5 py-3 text-slate-600">{elemento.ubicacion || elemento.direccion || '—'}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    {configuracion.rutaPublica && <Link to={`${configuracion.rutaPublica}/${elemento.id}`} className="mr-3 font-semibold text-slate-700 hover:underline">Ver publicado</Link>}
                    <button type="button" onClick={() => abrirEditar(elemento)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                    <button type="button" onClick={() => eliminar(elemento)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {elementos.length === 0 && (
                <tr>                  <td colSpan={configuracion.columnas.length + 4} className="px-5 py-6 text-center text-slate-500">No hay {configuracion.plural.toLocaleLowerCase('es')} registrados todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PanelAdmin>
  )
}

export default AdminEstablecimientos
