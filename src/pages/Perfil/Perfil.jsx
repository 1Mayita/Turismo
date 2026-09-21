import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { actualizarUsuario, crearUsuario, getUsuarioPorId } from '../../services/usuariosService.js'

const PERFIL_VACIO = { nombre: '', apellido: '', telefono: '', fotoUrl: '', preferencias: [] }

function IconoLapiz() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M4 20h4l10.5-10.5-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// key={fotoUrl} en el llamador reinicia este estado cada vez que cambia el enlace.
function Avatar({ fotoUrl, nombre, apellido, onError }) {
  const [fallo, setFallo] = useState(false)

  if (fotoUrl && !fallo) {
    return (
      <img
        src={fotoUrl}
        alt="Foto de perfil"
        onError={() => {
          setFallo(true)
          onError?.()
        }}
        className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-50"
      />
    )
  }
  const iniciales = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase() || '🙂'
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700 ring-4 ring-brand-50">
      {iniciales}
    </div>
  )
}

function Perfil() {
  const { usuario } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [datosGuardados, setDatosGuardados] = useState(PERFIL_VACIO)
  const [formulario, setFormulario] = useState(PERFIL_VACIO)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [fotoConError, setFotoConError] = useState(false)

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const categoriasFirestore = await getCategorias()
        setCategorias(categoriasFirestore.length > 0 ? categoriasFirestore : categoriasDeEjemplo)

        let datosUsuario = await getUsuarioPorId(usuario.uid)
        if (!datosUsuario) {
          const [nombre, ...resto] = (usuario.displayName || '').split(' ')
          const datosIniciales = { nombre: nombre || '', apellido: resto.join(' '), email: usuario.email }
          await crearUsuario(usuario.uid, datosIniciales)
          datosUsuario = await getUsuarioPorId(usuario.uid)
        }

        const datosCargados = {
          nombre: datosUsuario?.nombre || '',
          apellido: datosUsuario?.apellido || '',
          telefono: datosUsuario?.telefono || '',
          fotoUrl: datosUsuario?.fotoUrl || '',
          preferencias: datosUsuario?.preferencias || [],
        }
        setDatosGuardados(datosCargados)
        setFormulario(datosCargados)
      } catch (errorLectura) {
        console.error('Error al cargar el perfil:', errorLectura)
        setError('No se pudo cargar tu perfil. Intenta recargar la página.')
      } finally {
        setCargando(false)
      }
    }

    cargarPerfil()
  }, [usuario.uid, usuario.displayName, usuario.email])

  function abrirEdicion() {
    setFormulario(datosGuardados)
    setModoEdicion(true)
    setFotoConError(false)
    setError('')
    setMensaje('')
  }

  function cancelarEdicion() {
    setFormulario(datosGuardados)
    setModoEdicion(false)
    setFotoConError(false)
    setError('')
  }

  function actualizarCampo(evento) {
    const { name, value } = evento.target
    setFormulario({ ...formulario, [name]: value })
    if (name === 'fotoUrl') setFotoConError(false)
  }

  function alternarPreferencia(nombreCategoria) {
    setFormulario((anterior) => {
      const yaSeleccionada = anterior.preferencias.includes(nombreCategoria)
      return {
        ...anterior,
        preferencias: yaSeleccionada
          ? anterior.preferencias.filter((valor) => valor !== nombreCategoria)
          : [...anterior.preferencias, nombreCategoria],
      }
    })
  }

  async function guardarPerfil(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (!formulario.nombre.trim() || !formulario.apellido.trim()) {
      setError('Nombre y apellido no pueden estar vacíos.')
      return
    }

    try {
      setGuardando(true)
      await actualizarUsuario(usuario.uid, formulario)
      setDatosGuardados(formulario)
      setModoEdicion(false)
      setMensaje('Tu perfil se guardó correctamente.')
    } catch (error) {
      console.error('Error al guardar el perfil:', error)
      setError('No pudimos guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <div className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Mi cuenta</p>
          <h1 className="text-4xl font-bold text-brand-900">Mi perfil</h1>
        </div>

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-100 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        {cargando ? (
          <div className="animate-pulse rounded-3xl bg-white p-8 shadow-xl shadow-brand-950/10">
            <div className="mb-4 h-24 w-24 rounded-full bg-brand-100" />
            <div className="h-4 w-1/3 rounded bg-brand-100" />
          </div>
        ) : modoEdicion ? (
          <section className="rounded-3xl bg-white p-8 shadow-xl shadow-brand-950/10">
            <h2 className="mb-6 text-xl font-bold text-brand-900">Editar perfil</h2>
            <form onSubmit={guardarPerfil} className="space-y-5">
              <div className="flex items-center gap-5">
                <Avatar
                  key={formulario.fotoUrl}
                  fotoUrl={formulario.fotoUrl}
                  nombre={formulario.nombre}
                  apellido={formulario.apellido}
                  onError={() => setFotoConError(true)}
                />
                <label className="block flex-1 text-sm font-semibold text-slate-700">
                  URL de foto de perfil
                  <input name="fotoUrl" value={formulario.fotoUrl} onChange={actualizarCampo} placeholder="https://..." className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
                  {fotoConError && (
                    <span className="mt-2 block text-xs font-semibold text-red-600">
                      No pudimos cargar esa imagen. Verifica que el enlace apunte directo a un archivo (termina en .jpg, .png, .webp...) y no a una página web.
                    </span>
                  )}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nombre
                  <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Apellido
                  <input name="apellido" value={formulario.apellido} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Teléfono
                <input name="telefono" value={formulario.telefono} onChange={actualizarCampo} placeholder="Ej: 71234567" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20" />
              </label>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">Preferencias turísticas</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categorias.map((categoria) => (
                    <label key={categoria.id || categoria.nombre} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={formulario.preferencias.includes(categoria.nombre)}
                        onChange={() => alternarPreferencia(categoria.nombre)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                      />
                      {categoria.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button disabled={guardando} className="flex-1 rounded-xl bg-accent-600 px-4 py-3 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={cancelarEdicion} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100">
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="relative rounded-3xl bg-white p-8 shadow-xl shadow-brand-950/10">
              <button
                type="button"
                onClick={abrirEdicion}
                className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-800 transition hover:bg-brand-100"
                aria-label="Editar perfil"
              >
                <IconoLapiz />
              </button>

              <div className="flex flex-wrap items-center gap-6">
                <Avatar fotoUrl={datosGuardados.fotoUrl} nombre={datosGuardados.nombre} apellido={datosGuardados.apellido} />
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">{datosGuardados.nombre} {datosGuardados.apellido}</h2>
                  <p className="mt-2 text-sm text-slate-600">Correo: {usuario.email}</p>
                  <p className="mt-1 text-sm text-slate-600">Teléfono: {datosGuardados.telefono || 'No registrado'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow-xl shadow-brand-950/10">
              <h3 className="mb-4 text-lg font-bold text-brand-900">Preferencias turísticas</h3>
              {datosGuardados.preferencias.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Aún no elegiste categorías favoritas.{' '}
                  <button type="button" onClick={abrirEdicion} className="font-semibold text-brand-700 underline">Elegir ahora</button>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {datosGuardados.preferencias.map((nombreCategoria) => (
                    <span key={nombreCategoria} className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-800">
                      {nombreCategoria}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default Perfil
