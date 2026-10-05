import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { actualizarDestino, crearDestino, eliminarDestino, getDestinos } from '../../services/destinosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getRegiones, regionesDeEjemplo } from '../../services/regionesService.js'

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  categoria: '',
  id_departamento: '',
  id_municipio: '',
  id_region: '',
  direccion: '',
  latitud: '',
  longitud: '',
  horario: '',
  precio_ingreso: '',
  imagen_principal: '',
}

function AdminDestinos() {
  const [destinos, setDestinos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [regiones, setRegiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [destinoEditando, setDestinoEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true)
      setError('')
      try {
        const [destinosFirestore, categoriasFirestore, departamentosFirestore, municipiosFirestore, regionesFirestore] = await Promise.all([
          getDestinos(),
          getCategorias(),
          getDepartamentos(),
          getMunicipios(),
          getRegiones(),
        ])
        setDestinos(destinosFirestore)
        setCategorias(categoriasFirestore.length > 0 ? categoriasFirestore : categoriasDeEjemplo)
        setDepartamentos(departamentosFirestore.length > 0 ? departamentosFirestore : departamentosDeEjemplo)
        setMunicipios(municipiosFirestore.length > 0 ? municipiosFirestore : municipiosDeEjemplo)
        setRegiones(regionesFirestore.length > 0 ? regionesFirestore : regionesDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al cargar datos en AdminDestinos:', errorLectura)
        setError('No se pudieron cargar los destinos. Verifica tu conexión con Firestore.')
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
    setDestinoEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(destino) {
    setDestinoEditando(destino)
    setFormulario({
      nombre: destino.nombre || '',
      descripcion: destino.descripcion || '',
      categoria: destino.categoria || '',
      id_departamento: destino.id_departamento || '',
      id_municipio: destino.id_municipio || '',
      id_region: destino.id_region || '',
      direccion: destino.direccion || '',
      latitud: destino.latitud ?? '',
      longitud: destino.longitud ?? '',
      horario: destino.horario || '',
      precio_ingreso: destino.precio_ingreso ?? '',
      imagen_principal: destino.imagen_principal || '',
    })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function actualizarCampo(evento) {
    const { name, value } = evento.target
    // Al cambiar departamento o municipio se limpian los niveles de abajo.
    if (name === 'id_departamento') {
      setFormulario({ ...formulario, id_departamento: value, id_municipio: '', id_region: '' })
    } else if (name === 'id_municipio') {
      setFormulario({ ...formulario, id_municipio: value, id_region: '' })
    } else {
      setFormulario({ ...formulario, [name]: value })
    }
  }

  const municipiosDelDepartamento = municipios.filter((municipio) => municipio.id_departamento === formulario.id_departamento)
  const regionesDelMunicipio = regiones.filter((region) => region.id_municipio === formulario.id_municipio)

  async function guardar(evento) {
    evento.preventDefault()
    setError('')

    if (!formulario.nombre.trim() || !formulario.categoria || !formulario.id_departamento || !formulario.id_municipio) {
      setError('Nombre, categoría, departamento y municipio son obligatorios.')
      return
    }

    const departamento = departamentos.find((item) => item.id === formulario.id_departamento)
    const municipio = municipios.find((item) => item.id === formulario.id_municipio)

    const datos = {
      ...formulario,
      // Texto legible para tarjetas y detalle; los filtros usan los id_*.
      ubicacion: [municipio?.nombre, departamento?.nombre].filter(Boolean).join(', '),
      precio_ingreso: Number(formulario.precio_ingreso) || 0,
      latitud: formulario.latitud === '' ? null : Number(formulario.latitud),
      longitud: formulario.longitud === '' ? null : Number(formulario.longitud),
    }

    try {
      setGuardando(true)
      if (destinoEditando) {
        await actualizarDestino(destinoEditando.id, datos)
        setMensaje('Destino actualizado correctamente.')
      } else {
        await crearDestino({ ...datos, imagenes: datos.imagen_principal ? [datos.imagen_principal] : [] })
        setMensaje('Destino creado correctamente.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (error) {
      console.error('Error al guardar destino:', error)
      setError('No se pudo guardar el destino. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(destino) {
    if (!window.confirm(`¿Eliminar el destino "${destino.nombre}"? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await eliminarDestino(destino.id)
      setMensaje('Destino eliminado.')
      refrescar()
    } catch (error) {
      console.error('Error al eliminar destino:', error)
      setError('No se pudo eliminar el destino.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Administración de destinos</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <button
          type="button"
          onClick={abrirNuevo}
          className="mb-6 rounded-xl bg-accent-600 px-5 py-3 font-bold text-white transition hover:bg-accent-700"
        >
          Nuevo destino
        </button>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/5">
            <h2 className="text-xl font-bold text-brand-900">{destinoEditando ? 'Editar destino' : 'Nuevo destino'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre
                <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Precio de entrada (Bs)
                <input name="precio_ingreso" type="number" min="0" value={formulario.precio_ingreso} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Categoría
                <select name="categoria" value={formulario.categoria} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20">
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id || categoria.nombre} value={categoria.nombre}>{categoria.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Departamento
                <select name="id_departamento" value={formulario.id_departamento} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20">
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Municipio
                <select name="id_municipio" value={formulario.id_municipio} onChange={actualizarCampo} disabled={!formulario.id_departamento} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-slate-100">
                  <option value="">Selecciona un municipio</option>
                  {municipiosDelDepartamento.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Región (opcional)
                <select name="id_region" value={formulario.id_region} onChange={actualizarCampo} disabled={!formulario.id_municipio} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-slate-100">
                  <option value="">Sin región</option>
                  {regionesDelMunicipio.map((region) => (
                    <option key={region.id} value={region.id}>{region.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Horario
                <input name="horario" value={formulario.horario} onChange={actualizarCampo} placeholder="Todos los días, 08:00 - 18:00" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                URL de imagen principal
                <input name="imagen_principal" value={formulario.imagen_principal} onChange={actualizarCampo} placeholder="https://..." className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Dirección
                <input name="direccion" value={formulario.direccion} onChange={actualizarCampo} placeholder="Referencia o dirección" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Latitud
                  <input name="latitud" type="number" step="any" value={formulario.latitud} onChange={actualizarCampo} placeholder="-17.4013" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Longitud
                  <input name="longitud" type="number" step="any" value={formulario.longitud} onChange={actualizarCampo} placeholder="-66.1489" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
                </label>
              </div>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
              <textarea name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
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
          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-lg shadow-brand-950/5" />
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-brand-950/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {destinos.map((destino) => (
                  <tr key={destino.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-brand-900">{destino.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{destino.categoria}</td>
                    <td className="px-5 py-3 text-slate-600">{destino.ubicacion}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => abrirEditar(destino)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                      <button type="button" onClick={() => eliminar(destino)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {destinos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate-500">No hay destinos registrados todavía.</td>
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

export default AdminDestinos
