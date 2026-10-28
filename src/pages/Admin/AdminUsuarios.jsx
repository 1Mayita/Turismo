import { useEffect, useState } from 'react'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import PanelAdmin from '../../components/PanelAdmin.jsx'
import { cambiarEstadoUsuario, getUsuarios } from '../../services/usuariosService.js'

// Firestore devuelve un Timestamp; se convierte a Date antes de formatear.
function formatearFecha(fechaRegistro) {
  if (!fechaRegistro) return '—'
  const fecha = typeof fechaRegistro.toDate === 'function' ? fechaRegistro.toDate() : new Date(fechaRegistro)
  return fecha.toLocaleDateString('es-BO')
}

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarUsuarios() {
      setCargando(true)
      setError('')
      try {
        setUsuarios(await getUsuarios())
      } catch (errorLectura) {
        console.error('Error al cargar usuarios en AdminUsuarios:', errorLectura)
        setError('No se pudieron cargar los usuarios.')
      } finally {
        setCargando(false)
      }
    }

    cargarUsuarios()
  }, [version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  const usuariosVisibles = usuarios.filter((usuario) => (
    `${usuario.nombre || ''} ${usuario.apellido || ''} ${usuario.email || ''}`.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))
  ))

  async function alternarEstado(usuario) {
    const nuevoEstado = usuario.activo === false
    const accion = nuevoEstado ? 'habilitar' : 'deshabilitar'
    if (!window.confirm(`¿Seguro que quieres ${accion} a ${usuario.nombre || usuario.email}?`)) return

    setError('')
    try {
      await cambiarEstadoUsuario(usuario.id, nuevoEstado)
      setMensaje(`Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente.`)
      refrescar()
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error)
      setError('No se pudo actualizar el estado del usuario.')
    }
  }

  return (
    <PanelAdmin titulo="Administración de usuarios">
      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      {mensaje && <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{mensaje}</p>}

      <label className="mb-5 block max-w-md text-sm font-semibold text-slate-700">
        Buscar usuario
        <input
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Escribe un nombre o correo"
          className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        />
      </label>

      {cargando ? (
        <div className="h-48 animate-pulse rounded-2xl bg-sal-2 cristal" />
      ) : (
        <div className="overflow-x-auto rounded-2xl cristal">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Correo</th>
                <th className="px-5 py-3">Registro</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosVisibles.map((usuario) => (
                <tr key={usuario.id} className="border-t border-neutral-100">
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    <span className="flex items-center gap-3">
                      <ImagenSegura
                        src={usuario.fotoUrl}
                        alt={`${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase() || '?'}
                        loading="lazy"
                        className="h-9 w-9 rounded-full object-cover p-0 text-[10px]"
                      />
                      {usuario.nombre} {usuario.apellido}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{usuario.email}</td>
                  <td className="px-5 py-3 text-slate-600">{formatearFecha(usuario.fechaRegistro)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      usuario.activo === false ? 'bg-red-50 text-red-700' : 'bg-brand-100 text-brand-800'
                    }`}>
                      {usuario.activo === false ? 'Deshabilitado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => alternarEstado(usuario)} className="font-semibold text-brand-700 hover:underline">
                      {usuario.activo === false ? 'Habilitar' : 'Deshabilitar'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosVisibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                    {usuarios.length === 0 ? 'No hay usuarios registrados todavía.' : 'No hay usuarios que coincidan con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PanelAdmin>
  )
}

export default AdminUsuarios
