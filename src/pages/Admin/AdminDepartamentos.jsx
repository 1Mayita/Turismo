import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { actualizarDepartamento, crearDepartamento, eliminarDepartamento, getDepartamentos } from '../../services/departamentosService.js'
import { actualizarMunicipio, crearMunicipio, eliminarMunicipio, getMunicipiosPorDepartamento } from '../../services/municipiosService.js'
import { actualizarRegion, crearRegion, eliminarRegion, getRegionesPorMunicipio } from '../../services/regionesService.js'

const FORMULARIO_VACIO = { nombre: '', descripcion: '' }

const CLASE_INPUT = 'mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'

// Lista con alta, edición y baja para los niveles hijos (municipios y regiones).
// onGuardar devuelve true si se guardó, para cerrar el formulario.
function ListaZonas({ titulo, textoNuevo, textoVacio, textoCargando, elementos, cargando, seleccionadoId, onGuardar, onEliminar, accionExtra }) {
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState('')

  function abrirNuevo() {
    setEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario('')
    setFormularioAbierto(true)
  }

  function abrirEditar(elemento) {
    setEditando(elemento)
    setFormulario({ nombre: elemento.nombre || '', descripcion: elemento.descripcion || '' })
    setErrorFormulario('')
    setFormularioAbierto(true)
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (!formulario.nombre.trim()) {
      setErrorFormulario('El nombre es obligatorio.')
      return
    }
    if (await onGuardar(formulario, editando)) setFormularioAbierto(false)
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-brand-900">{titulo}</h2>
        <button type="button" onClick={abrirNuevo} className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-900">
          {textoNuevo}
        </button>
      </div>

      {formularioAbierto && (
        <form onSubmit={guardar} className="mb-6 space-y-3 rounded-xl border border-slate-200 p-4">
          {errorFormulario && <p className="text-sm font-semibold text-red-700" role="alert">{errorFormulario}</p>}
          <label className="block text-sm font-semibold text-slate-700">
            Nombre
            <input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} className={CLASE_INPUT} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Descripción
            <input value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} className={CLASE_INPUT} />
          </label>
          <div className="flex gap-3">
            <button className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-900">Guardar</button>
            <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Cancelar</button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="text-slate-600">{textoCargando}</p>
      ) : elementos.length === 0 ? (
        <p className="text-slate-600">{textoVacio}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {elementos.map((elemento) => (
            <li key={elemento.id} className={`flex items-center justify-between gap-4 px-2 py-3 ${seleccionadoId === elemento.id ? 'bg-brand-50' : ''}`}>
              <div>
                <p className="font-semibold text-brand-900">{elemento.nombre}</p>
                <p className="text-sm text-slate-600">{elemento.descripcion}</p>
              </div>
              <div className="whitespace-nowrap">
                {accionExtra?.(elemento)}
                <button type="button" onClick={() => abrirEditar(elemento)} className="mr-3 text-sm font-semibold text-brand-700 hover:underline">Editar</button>
                <button type="button" onClick={() => onEliminar(elemento)} className="text-sm font-semibold text-red-700 hover:underline">Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AdminDepartamentos() {
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [departamentoEditando, setDepartamentoEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)

  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null)
  const [municipios, setMunicipios] = useState([])
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false)

  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null)
  const [regiones, setRegiones] = useState([])
  const [cargandoRegiones, setCargandoRegiones] = useState(false)

  useEffect(() => {
    async function cargarDepartamentos() {
      setCargando(true)
      setError('')
      try {
        setDepartamentos(await getDepartamentos())
      } catch (errorLectura) {
        console.error('Error al cargar departamentos en AdminDepartamentos:', errorLectura)
        setError('No se pudieron cargar los departamentos.')
      } finally {
        setCargando(false)
      }
    }

    cargarDepartamentos()
  }, [version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  // ---- Departamentos ----

  function abrirNuevoDepartamento() {
    setDepartamentoEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditarDepartamento(departamento) {
    setDepartamentoEditando(departamento)
    setFormulario({ nombre: departamento.nombre || '', descripcion: departamento.descripcion || '' })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  async function guardarDepartamento(evento) {
    evento.preventDefault()
    setError('')
    if (!formulario.nombre.trim()) {
      setError('El nombre del departamento es obligatorio.')
      return
    }
    try {
      setGuardando(true)
      if (departamentoEditando) {
        await actualizarDepartamento(departamentoEditando.id, formulario)
        setMensaje('Departamento actualizado.')
      } else {
        await crearDepartamento(formulario)
        setMensaje('Departamento creado.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (error) {
      console.error('Error al guardar departamento:', error)
      setError('No se pudo guardar el departamento.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarDepartamentoActual(departamento) {
    if (!window.confirm(`¿Eliminar el departamento "${departamento.nombre}"? Esto no elimina sus municipios ya guardados.`)) return
    setError('')
    try {
      await eliminarDepartamento(departamento.id)
      if (departamentoSeleccionado?.id === departamento.id) {
        setDepartamentoSeleccionado(null)
        setMunicipioSeleccionado(null)
      }
      setMensaje('Departamento eliminado.')
      refrescar()
    } catch (error) {
      console.error('Error al eliminar departamento:', error)
      setError('No se pudo eliminar el departamento.')
    }
  }

  // ---- Municipios (hijos de un departamento) ----

  async function verMunicipios(departamento) {
    setDepartamentoSeleccionado(departamento)
    setMunicipioSeleccionado(null)
    setCargandoMunicipios(true)
    setError('')
    try {
      setMunicipios(await getMunicipiosPorDepartamento(departamento.id))
    } catch (error) {
      console.error('Error al cargar municipios:', error)
      setError('No se pudieron cargar los municipios de este departamento.')
    } finally {
      setCargandoMunicipios(false)
    }
  }

  function alternarMunicipios(departamento) {
    if (departamentoSeleccionado?.id === departamento.id) {
      setDepartamentoSeleccionado(null)
      setMunicipioSeleccionado(null)
      return
    }
    verMunicipios(departamento)
  }

  async function guardarMunicipio(datos, municipioEditando) {
    setError('')
    try {
      if (municipioEditando) {
        await actualizarMunicipio(municipioEditando.id, datos)
      } else {
        await crearMunicipio({ ...datos, id_departamento: departamentoSeleccionado.id })
      }
      await verMunicipios(departamentoSeleccionado)
      return true
    } catch (error) {
      console.error('Error al guardar municipio:', error)
      setError('No se pudo guardar el municipio.')
      return false
    }
  }

  async function eliminarMunicipioActual(municipio) {
    if (!window.confirm(`¿Eliminar el municipio "${municipio.nombre}"? Esto no elimina sus regiones ya guardadas.`)) return
    setError('')
    try {
      await eliminarMunicipio(municipio.id)
      await verMunicipios(departamentoSeleccionado)
    } catch (error) {
      console.error('Error al eliminar municipio:', error)
      setError('No se pudo eliminar el municipio.')
    }
  }

  // ---- Regiones (hijas de un municipio) ----

  async function verRegiones(municipio) {
    setMunicipioSeleccionado(municipio)
    setCargandoRegiones(true)
    setError('')
    try {
      setRegiones(await getRegionesPorMunicipio(municipio.id))
    } catch (error) {
      console.error('Error al cargar regiones:', error)
      setError('No se pudieron cargar las regiones de este municipio.')
    } finally {
      setCargandoRegiones(false)
    }
  }

  async function guardarRegion(datos, regionEditando) {
    setError('')
    try {
      if (regionEditando) {
        await actualizarRegion(regionEditando.id, datos)
      } else {
        await crearRegion({ ...datos, id_municipio: municipioSeleccionado.id })
      }
      await verRegiones(municipioSeleccionado)
      return true
    } catch (error) {
      console.error('Error al guardar región:', error)
      setError('No se pudo guardar la región.')
      return false
    }
  }

  async function eliminarRegionActual(region) {
    if (!window.confirm(`¿Eliminar la región "${region.nombre}"?`)) return
    setError('')
    try {
      await eliminarRegion(region.id)
      await verRegiones(municipioSeleccionado)
    } catch (error) {
      console.error('Error al eliminar región:', error)
      setError('No se pudo eliminar la región.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Departamentos, municipios y regiones</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <button type="button" onClick={abrirNuevoDepartamento} className="mb-6 rounded-xl bg-accent-600 px-5 py-3 font-bold text-white transition hover:bg-accent-700">
          Nuevo departamento
        </button>

        {formularioAbierto && (
          <form onSubmit={guardarDepartamento} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
            <h2 className="text-xl font-bold text-brand-900">{departamentoEditando ? 'Editar departamento' : 'Nuevo departamento'}</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Nombre
              <input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} className={CLASE_INPUT} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
              <textarea value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} rows={2} className={CLASE_INPUT} />
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
                {departamentos.map((departamento) => (
                  <tr key={departamento.id} className={`border-t border-slate-100 ${departamentoSeleccionado?.id === departamento.id ? 'bg-brand-50' : ''}`}>
                    <td className="px-5 py-3 font-semibold text-brand-900">{departamento.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{departamento.descripcion}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button type="button" onClick={() => alternarMunicipios(departamento)} className="mr-3 font-semibold text-slate-700 hover:underline">
                        {departamentoSeleccionado?.id === departamento.id ? 'Ocultar municipios' : 'Municipios'}
                      </button>
                      <button type="button" onClick={() => abrirEditarDepartamento(departamento)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                      <button type="button" onClick={() => eliminarDepartamentoActual(departamento)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {departamentos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-slate-500">No hay departamentos registrados todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {departamentoSeleccionado && (
          <ListaZonas
            key={`municipios-${departamentoSeleccionado.id}`}
            titulo={`Municipios de ${departamentoSeleccionado.nombre}`}
            textoNuevo="Nuevo municipio"
            textoVacio="Este departamento no tiene municipios registrados todavía."
            textoCargando="Cargando municipios..."
            elementos={municipios}
            cargando={cargandoMunicipios}
            seleccionadoId={municipioSeleccionado?.id}
            onGuardar={guardarMunicipio}
            onEliminar={eliminarMunicipioActual}
            accionExtra={(municipio) => (
              <button type="button" onClick={() => verRegiones(municipio)} className="mr-3 text-sm font-semibold text-slate-700 hover:underline">
                Regiones
              </button>
            )}
          />
        )}

        {departamentoSeleccionado && municipioSeleccionado && (
          <ListaZonas
            key={`regiones-${municipioSeleccionado.id}`}
            titulo={`Regiones de ${municipioSeleccionado.nombre}`}
            textoNuevo="Nueva región"
            textoVacio="Este municipio no tiene regiones registradas todavía."
            textoCargando="Cargando regiones..."
            elementos={regiones}
            cargando={cargandoRegiones}
            onGuardar={guardarRegion}
            onEliminar={eliminarRegionActual}
          />
        )}
      </main>
    </div>
  )
}

export default AdminDepartamentos
