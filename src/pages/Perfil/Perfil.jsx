import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import AjustesNotificaciones from '../../components/AjustesNotificaciones.jsx'
import InsigniaCategoria from '../../components/InsigniaCategoria.jsx'
import ListaFavoritos from '../../components/ListaFavoritos.jsx'
import { useAuth } from '../../context/useAuth.js'
import { useFavoritos } from '../../context/useFavoritos.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { actualizarUsuario, crearUsuario, getUsuarioPorId } from '../../services/usuariosService.js'
import { getPreferenciasDeUsuario, guardarPreferenciasDeUsuario } from '../../services/preferenciasService.js'

// "preferencias" guarda los IDs de categoría leídos de "usuario_preferencias".
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
        className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white"
      />
    )
  }
  const iniciales = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-cielo-600 to-noche text-4xl font-extrabold text-white shadow-lg ring-4 ring-white">
      {iniciales || (
        // Sin nombre todavía: silueta en vez de iniciales.
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-14 w-14" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5v1H4v-1Z" />
        </svg>
      )}
    </div>
  )
}

function Perfil() {
  const { usuario } = useAuth()
  const { idsFavoritos } = useFavoritos()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [parametros] = useSearchParams()
  // Recién registrado: se abre directo la edición para elegir preferencias.
  const esBienvenida = parametros.get('bienvenida') === '1'
  const rutaSiguiente = ubicacion.state?.desde || '/destinos'
  const [categorias, setCategorias] = useState([])
  const [datosGuardados, setDatosGuardados] = useState(PERFIL_VACIO)
  const [formulario, setFormulario] = useState(PERFIL_VACIO)
  const [modoEdicion, setModoEdicion] = useState(esBienvenida)
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

        const preferencias = await getPreferenciasDeUsuario(usuario.uid)

        const datosCargados = {
          nombre: datosUsuario?.nombre || '',
          apellido: datosUsuario?.apellido || '',
          telefono: datosUsuario?.telefono || '',
          fotoUrl: datosUsuario?.fotoUrl || '',
          preferencias: preferencias.map((preferencia) => preferencia.id_categoria),
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

  // Al llegar con /perfil#favoritos (desde el menú) se baja hasta esa sección
  // cuando el perfil ya terminó de cargar.
  useEffect(() => {
    if (!cargando && ubicacion.hash) {
      document.getElementById(ubicacion.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [cargando, ubicacion.hash, ubicacion.key])

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

  function alternarPreferencia(idCategoria) {
    setFormulario((anterior) => {
      const yaSeleccionada = anterior.preferencias.includes(idCategoria)
      return {
        ...anterior,
        preferencias: yaSeleccionada
          ? anterior.preferencias.filter((valor) => valor !== idCategoria)
          : [...anterior.preferencias, idCategoria],
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
    if (formulario.telefono.trim() && !/^[0-9+\s-]{7,15}$/.test(formulario.telefono.trim())) {
      setError('El teléfono solo puede tener números, espacios, guiones o "+", entre 7 y 15 caracteres.')
      return
    }

    try {
      setGuardando(true)
      const { preferencias, ...datosPerfil } = formulario
      await actualizarUsuario(usuario.uid, datosPerfil)
      await guardarPreferenciasDeUsuario(usuario.uid, preferencias)
      setDatosGuardados(formulario)
      setModoEdicion(false)
      setMensaje('Tu perfil se guardó correctamente.')
      if (esBienvenida) navegar(rutaSiguiente, { replace: true })
    } catch (error) {
      console.error('Error al guardar el perfil:', error)
      setError('No pudimos guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // Se ignoran IDs de categorías que ya fueron eliminadas.
  const categoriasPreferidas = categorias.filter((categoria) => datosGuardados.preferencias.includes(categoria.id))

  const nombreCompleto = `${datosGuardados.nombre} ${datosGuardados.apellido}`.trim() || 'Viajero'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-6xl py-10">
        {esBienvenida && (
          <div className="mb-6 rounded-2xl p-5 cristal">
            <p className="text-lg font-bold text-noche">¡Tu cuenta está lista!</p>
            <p className="mt-1 text-sm text-piedra-texto">
              Marca abajo las categorías que más te interesan y guarda los cambios. Puedes cambiarlas cuando quieras desde tu perfil.
            </p>
            <Link to={rutaSiguiente} replace className="mt-3 inline-block text-sm font-semibold text-cielo-700 underline">
              Omitir por ahora y empezar a explorar
            </Link>
          </div>
        )}

        {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">✓ {mensaje}</p>}

        {cargando ? (
          <div className="animate-pulse overflow-hidden rounded-[2rem] cristal">
            <div className="h-40 bg-white/60" />
            <div className="space-y-3 p-8">
              <div className="h-6 w-1/3 rounded bg-white/70" />
              <div className="h-4 w-1/4 rounded bg-white/70" />
            </div>
          </div>
        ) : modoEdicion ? (
          <section className="mx-auto max-w-3xl rounded-[2rem] p-6 cristal sm:p-8">
            <h1 className="mb-6 text-2xl font-bold text-noche">Editar perfil</h1>
            <form onSubmit={guardarPerfil} className="space-y-6">
              <div className="flex flex-wrap items-center gap-5">
                <Avatar
                  key={formulario.fotoUrl}
                  fotoUrl={formulario.fotoUrl}
                  nombre={formulario.nombre}
                  apellido={formulario.apellido}
                  onError={() => setFotoConError(true)}
                />
                <label className="block min-w-60 flex-1 text-sm font-semibold text-noche/80">
                  URL de foto de perfil
                  <input name="fotoUrl" value={formulario.fotoUrl} onChange={actualizarCampo} placeholder="https://..." className="mt-2 w-full rounded-xl border border-borde bg-white/70 px-4 py-3 outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30" />
                  {fotoConError && (
                    <span className="mt-2 block text-xs font-semibold text-red-600">
                      No pudimos cargar esa imagen. Verifica que el enlace apunte directo a un archivo (termina en .jpg, .png, .webp...) y no a una página web.
                    </span>
                  )}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-noche/80">
                  Nombre
                  <input name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-borde bg-white/70 px-4 py-3 outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30" />
                </label>
                <label className="block text-sm font-semibold text-noche/80">
                  Apellido
                  <input name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-borde bg-white/70 px-4 py-3 outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30" />
                </label>
              </div>

              <label className="block text-sm font-semibold text-noche/80">
                Teléfono
                <input name="telefono" type="tel" autoComplete="tel" value={formulario.telefono} onChange={actualizarCampo} placeholder="Ej: 71234567" className="mt-2 w-full rounded-xl border border-borde bg-white/70 px-4 py-3 outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30" />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-noche/80">¿Qué te gusta hacer cuando viajas?</legend>
                <p className="mb-3 mt-1 text-xs text-piedra-texto">Toca las categorías que te interesan. Puedes elegir varias.</p>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((categoria) => (
                    <label
                      key={categoria.id}
                      className="cursor-pointer select-none rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-noche/80 ring-1 ring-borde transition hover:bg-white has-[:checked]:bg-noche has-[:checked]:text-white has-[:checked]:ring-cielo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cielo-600"
                    >
                      <input
                        type="checkbox"
                        checked={formulario.preferencias.includes(categoria.id)}
                        onChange={() => alternarPreferencia(categoria.id)}
                        className="sr-only"
                      />
                      {formulario.preferencias.includes(categoria.id) && <span aria-hidden="true">✓ </span>}
                      {categoria.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-3">
                <button disabled={guardando} className="flex-1 rounded-xl boton-principal px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {!esBienvenida && (
                  <button type="button" onClick={cancelarEdicion} className="rounded-xl border border-borde bg-white/70 px-5 py-3 font-bold text-noche/80 transition hover:bg-white">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : (
          <>
            {/* Tarjeta de presentación: portada con degradado y avatar superpuesto. */}
            <section className="overflow-hidden rounded-[2rem] cristal">
              <div className="relative h-36 overflow-hidden bg-linear-to-r from-blue-600 via-cielo-600 to-cielo-600 sm:h-44">
                <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/15" aria-hidden="true" />
                <div className="absolute right-40 top-16 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cobre/10" aria-hidden="true" />
              </div>

              <div className="px-6 pb-7 sm:px-10">
                <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
                  <div className="relative">
                    <Avatar fotoUrl={datosGuardados.fotoUrl} nombre={datosGuardados.nombre} apellido={datosGuardados.apellido} />
                  </div>
                  <button type="button" onClick={abrirEdicion} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-cielo-700 shadow-md ring-1 ring-borde transition hover:bg-cielo/50">
                    <IconoLapiz /> Editar perfil
                  </button>
                </div>

                <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Mi perfil</p>
                <h1 className="mt-1 text-3xl font-extrabold capitalize text-noche sm:text-4xl">{nombreCompleto}</h1>

                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-piedra-texto">
                  <div className="flex items-center gap-2">
                    <dt className="font-semibold text-piedra-texto">Correo</dt>
                    <dd className="font-semibold text-noche">{usuario.email}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="font-semibold text-piedra-texto">Teléfono</dt>
                    <dd className="font-semibold text-noche">
                      {datosGuardados.telefono || (
                        <button type="button" onClick={abrirEdicion} className="text-cielo-700 underline">Agregar</button>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-[auto_auto_1fr]">
                  <a href="#favoritos" className="rounded-2xl bg-white/70 px-6 py-4 text-center ring-1 ring-white/80 transition hover:bg-white">
                    <span className="block text-3xl font-extrabold text-cielo-700">{idsFavoritos.size}</span>
                    <span className="text-sm font-semibold text-piedra-texto">{idsFavoritos.size === 1 ? 'Favorito' : 'Favoritos'}</span>
                  </a>
                  <div className="rounded-2xl bg-white/70 px-6 py-4 text-center ring-1 ring-white/80">
                    <span className="block text-3xl font-extrabold text-cielo-700">{categoriasPreferidas.length}</span>
                    <span className="text-sm font-semibold text-piedra-texto">{categoriasPreferidas.length === 1 ? 'Interés' : 'Intereses'}</span>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-white/70 px-6 py-4 ring-1 ring-white/80 sm:col-span-1">
                    <h2 className="text-sm font-bold text-noche">Mis intereses de viaje</h2>
                    {categoriasPreferidas.length === 0 ? (
                      <p className="mt-2 text-sm text-piedra-texto">
                        Aún no elegiste categorías.{' '}
                        <button type="button" onClick={abrirEdicion} className="font-semibold text-cielo-700 underline">Elegir ahora</button>
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {categoriasPreferidas.map((categoria) => (
                          <InsigniaCategoria key={categoria.id} categoria={categoria.nombre} className="px-4 py-1.5 text-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* En la bienvenida (recién registrado) todavía no hay favoritos que mostrar. */}
        {!esBienvenida && !modoEdicion && (
          <div className="mt-8">
            <AjustesNotificaciones />
          </div>
        )}

        {!esBienvenida && !modoEdicion && (
          <section id="favoritos" className="mt-12 scroll-mt-24">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Guardados</p>
                <h2 className="text-3xl font-bold text-noche">Mis favoritos</h2>
              </div>
              <Link to="/destinos" className="rounded-xl bg-white/70 px-4 py-2 text-sm font-bold text-cielo-700 ring-1 ring-white/80 transition hover:bg-white">
                Explorar más destinos →
              </Link>
            </div>
            <ListaFavoritos />
          </section>
        )}
      </main>
    </div>
  )
}

export default Perfil
