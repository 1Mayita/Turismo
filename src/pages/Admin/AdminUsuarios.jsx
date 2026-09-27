import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import AdminNav from '../../components/AdminNav.jsx'
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
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Administración de usuarios</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        {cargando ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white shadow-lg shadow-brand-950/5" />
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-brand-950/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Correo</th>
                  <th className="px-5 py-3">Registro</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-brand-900">{usuario.nombre} {usuario.apellido}</td>
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
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate-500">No hay usuarios registrados todavía.</td>
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

export default AdminUsuarios
