import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Heart, Mail, Pencil, Phone, Sparkles } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { ChipCategoria, claseBoton, claseControl, claseEtiqueta } from '../../components/ui'
import { FOTOS } from '../../services/fotosDeEjemplo.js'
import AjustesNotificaciones from '../../components/AjustesNotificaciones.jsx'
import ListaFavoritos from '../../components/ListaFavoritos.jsx'
import SelectorImagen from '../../components/SelectorImagen.jsx'
import { useAuth } from '../../context/useAuth.js'
import { useFavoritos } from '../../context/useFavoritos.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { actualizarUsuario, crearUsuario, getUsuarioPorId } from '../../services/usuariosService.js'
import { getPreferenciasDeUsuario, guardarPreferenciasDeUsuario } from '../../services/preferenciasService.js'

// "preferencias" guarda los IDs de categoría leídos de "usuario_preferencias".
const PERFIL_VACIO = { nombre: '', apellido: '', telefono: '', fotoUrl: '', preferencias: [] }
// Paisaje de la portada del perfil (Laguna Colorada) y su crédito.
const FOTO_PORTADA = FOTOS['laguna-colorada'].imagenes[0]
const CREDITO_PORTADA = 'Foto: kallerna (CC BY-SA 4.0) — Wikimedia Commons'

function IconoLapiz() {
  return <Pencil aria-hidden="true" size={16} />
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
        className="h-28 w-28 rounded-full object-cover shadow-elevada ring-4 ring-white"
      />
    )
  }
  const iniciales = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  return (
    <div className="titulo-display flex h-28 w-28 items-center justify-center rounded-full bg-noche text-[44px] text-white shadow-elevada ring-4 ring-white">
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
  const [subidasPendientes, setSubidasPendientes] = useState(0)
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
          <div className="mb-6 rounded-tarjeta border border-borde bg-cielo/60 p-5">
            <p className="flex items-center gap-2 text-lg font-bold text-noche"><Sparkles aria-hidden="true" size={20} className="text-atardecer-700" /> ¡Tu cuenta está lista!</p>
            <p className="mt-1 text-sm text-piedra-texto">
              Marca abajo las categorías que más te interesan y guarda los cambios. Puedes cambiarlas cuando quieras desde tu perfil.
            </p>
            <Link to={rutaSiguiente} replace className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-cielo-700 underline">
              Omitir por ahora y empezar a explorar
            </Link>
          </div>
        )}

        {error && <p className="mb-5 rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 flex items-center gap-2 rounded-control bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status"><Check aria-hidden="true" size={18} /> {mensaje}</p>}

        {cargando ? (
          <div className="animate-pulse overflow-hidden rounded-tarjeta border border-borde bg-white">
            <div className="h-44 bg-sal-2" />
            <div className="space-y-3 p-8">
              <div className="h-6 w-1/3 rounded-control bg-sal-2" />
              <div className="h-4 w-1/4 rounded-control bg-sal-2" />
            </div>
          </div>
        ) : modoEdicion ? (
          <section className="mx-auto max-w-3xl rounded-tarjeta border border-borde bg-white p-6 shadow-suave sm:p-8">
            <h1 className="titulo-display mb-6 text-[40px]">Editar perfil</h1>
            <form onSubmit={guardarPerfil} className="space-y-6">
              <div className="flex flex-wrap items-center gap-5">
                <Avatar
                  key={formulario.fotoUrl}
                  fotoUrl={formulario.fotoUrl}
                  nombre={formulario.nombre}
                  apellido={formulario.apellido}
                  onError={() => setFotoConError(true)}
                />
                <div className="min-w-60 flex-1">
                  <SelectorImagen
                    etiqueta="Foto de perfil"
                    valor={formulario.fotoUrl}
                    onUploading={(subiendo) => setSubidasPendientes((pendientes) => pendientes + (subiendo ? 1 : -1))}
                    onChange={(fotoUrl) => {
                      setFormulario((actual) => ({ ...actual, fotoUrl }))
                      setFotoConError(false)
                    }}
                  />
                  {fotoConError && (
                    <span className="mt-2 block text-xs font-semibold text-red-600">
                      No pudimos mostrar la imagen seleccionada.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className={`${claseEtiqueta}`}>
                  Nombre
                  <input name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={actualizarCampo} className={`${claseControl} mt-2 font-normal`} />
                </label>
                <label className={`${claseEtiqueta}`}>
                  Apellido
                  <input name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={actualizarCampo} className={`${claseControl} mt-2 font-normal`} />
                </label>
              </div>

              <label className={`${claseEtiqueta}`}>
                Teléfono
                <input name="telefono" type="tel" autoComplete="tel" value={formulario.telefono} onChange={actualizarCampo} placeholder="Ej: 71234567" className={`${claseControl} mt-2 font-normal`} />
              </label>

              <fieldset>
                <legend className="text-sm font-bold text-noche">¿Qué te gusta hacer cuando viajas?</legend>
                <p className="mb-3 mt-1 text-xs text-piedra-texto">Toca las categorías que te interesan. Puedes elegir varias.</p>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((categoria) => (
                    <label
                      key={categoria.id}
                      className="inline-flex min-h-11 cursor-pointer select-none items-center gap-1.5 rounded-full bg-cielo px-4 text-sm font-bold text-noche transition hover:bg-cielo-600/25 has-[:checked]:bg-noche has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cielo-600"
                    >
                      <input
                        type="checkbox"
                        checked={formulario.preferencias.includes(categoria.id)}
                        onChange={() => alternarPreferencia(categoria.id)}
                        className="sr-only"
                      />
                      {formulario.preferencias.includes(categoria.id) && <Check aria-hidden="true" size={16} />}
                      {categoria.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-3">
                <button disabled={guardando || subidasPendientes > 0} className={claseBoton('primario', 'normal', 'flex-1')}>
                  {guardando ? 'Guardando...' : subidasPendientes > 0 ? 'Subiendo imagen...' : 'Guardar cambios'}
                </button>
                {!esBienvenida && (
                  <button type="button" onClick={cancelarEdicion} className={claseBoton('secundario')}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : (
          <>
            {/* Tarjeta de presentación: portada con degradado y avatar superpuesto. */}
            <section className="overflow-hidden rounded-tarjeta border border-borde bg-white shadow-suave">
              <div className="relative h-40 overflow-hidden bg-sal-2 sm:h-52">
                <img src={FOTO_PORTADA} alt="" className="h-full w-full object-cover object-[50%_60%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-noche/40 to-transparent" aria-hidden="true" />
                <p className="absolute bottom-2 right-3 text-[11px] text-white/85">{CREDITO_PORTADA}</p>
              </div>

              <div className="px-6 pb-7 sm:px-10">
                <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
                  <div className="relative">
                    <Avatar fotoUrl={datosGuardados.fotoUrl} nombre={datosGuardados.nombre} apellido={datosGuardados.apellido} />
                  </div>
                  <button type="button" onClick={abrirEdicion} className={claseBoton('secundario', 'pequeno', 'bg-white')}>
                    <IconoLapiz /> Editar perfil
                  </button>
                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-cobre-texto">Mi perfil</p>
                <h1 className="titulo-display mt-1 text-[40px] capitalize sm:text-[48px]">{nombreCompleto}</h1>

                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-piedra-texto">
                  <div className="flex items-center gap-2">
                    <dt className="flex items-center gap-1.5 font-semibold text-piedra-texto"><Mail aria-hidden="true" size={16} /> Correo</dt>
                    <dd className="font-semibold text-noche">{usuario.email}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="flex items-center gap-1.5 font-semibold text-piedra-texto"><Phone aria-hidden="true" size={16} /> Teléfono</dt>
                    <dd className="font-semibold text-noche">
                      {datosGuardados.telefono || (
                        <button type="button" onClick={abrirEdicion} className="text-cielo-700 underline">Agregar</button>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-[auto_auto_1fr]">
                  <a href="#favoritos" className="rounded-tarjeta border border-borde bg-sal px-6 py-4 text-center transition hover:bg-cielo/50">
                    <span className="titulo-display block text-[40px] leading-none">{idsFavoritos.size}</span>
                    <span className="text-sm font-semibold text-piedra-texto">{idsFavoritos.size === 1 ? 'Favorito' : 'Favoritos'}</span>
                  </a>
                  <div className="rounded-tarjeta border border-borde bg-sal px-6 py-4 text-center">
                    <span className="titulo-display block text-[40px] leading-none">{categoriasPreferidas.length}</span>
                    <span className="text-sm font-semibold text-piedra-texto">{categoriasPreferidas.length === 1 ? 'Interés' : 'Intereses'}</span>
                  </div>
                  <div className="col-span-2 rounded-tarjeta border border-borde bg-sal px-6 py-4 sm:col-span-1">
                    <h2 className="text-sm font-bold text-noche">Mis intereses de viaje</h2>
                    {categoriasPreferidas.length === 0 ? (
                      <p className="mt-2 text-sm text-piedra-texto">
                        Aún no elegiste categorías.{' '}
                        <button type="button" onClick={abrirEdicion} className="font-bold text-cielo-700 underline">Elegir ahora</button>
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {categoriasPreferidas.map((categoria) => (
                          <ChipCategoria key={categoria.id} nombre={categoria.nombre} tamano="pequeno" />
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
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cobre-texto">Guardados</p>
                <h2 className="titulo-display flex items-center gap-3 text-[40px]"><Heart aria-hidden="true" size={28} className="text-atardecer" /> Mis favoritos</h2>
              </div>
              <Link to="/destinos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-cielo-700 hover:underline">
                Explorar más destinos <ArrowRight aria-hidden="true" size={16} />
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
