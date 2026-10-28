import { useState } from 'react'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { claseBoton, claseControl, claseEtiqueta } from '../../components/ui/estilos.js'
import { useAuth } from '../../context/useAuth.js'
import { auth } from '../../services/firebase.js'
import { FOTOS } from '../../services/fotosDeEjemplo.js'
import { crearUsuario, getUsuarioPorId } from '../../services/usuariosService.js'

function mensajeDeErrorLogin(codigo) {
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'El correo o la contraseña no son correctos.'
    case 'auth/invalid-email':
      return 'El correo electrónico no tiene un formato válido.'
    case 'auth/user-disabled':
      return 'Esta cuenta fue deshabilitada. Contacta al administrador.'
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con correo y contraseña no está habilitado en Firebase Authentication.'
    case 'auth/network-request-failed':
      return 'No hay conexión con Firebase. Revisa tu internet e inténtalo de nuevo.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera un momento e inténtalo de nuevo.'
    default:
      return `No pudimos iniciar sesión (${codigo || 'error desconocido'}). Revisa tus datos e inténtalo de nuevo.`
  }
}

function mensajeDeErrorRegistro(codigo) {
  switch (codigo) {
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. Prueba iniciar sesión.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/invalid-email':
      return 'El correo electrónico no tiene un formato válido.'
    case 'auth/operation-not-allowed':
      return 'El registro con correo y contraseña no está habilitado en Firebase Authentication. Actívalo en la consola de Firebase (Authentication > Sign-in method > Correo electrónico/contraseña).'
    case 'auth/network-request-failed':
      return 'No hay conexión con Firebase. Revisa tu internet e inténtalo de nuevo.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
    default:
      return `No pudimos crear tu cuenta (${codigo || 'error desconocido'}). Revisa los datos e inténtalo de nuevo.`
  }
}

// Corre `promesa` pero nunca espera más de `milisegundos`: si Firestore tarda
// o no responde, seguimos adelante en vez de dejar al usuario colgado.
function esperarConLimite(promesa, milisegundos) {
  return Promise.race([
    promesa.then((valor) => ({ resuelto: true, valor })).catch(() => ({ resuelto: false, valor: null })),
    new Promise((resolve) => setTimeout(() => resolve({ resuelto: false, valor: null }), milisegundos)),
  ])
}

// Campo de contraseña con botón para verla mientras se escribe.
function CampoContrasena({ etiqueta, valor, onCambiar, autoComplete, ayuda, claseInput }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className={claseEtiqueta}>
      {etiqueta}
      <span className="relative mt-2 block">
        <input
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value)}
          autoComplete={autoComplete}
          className={`${claseInput} mt-0 pr-20`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex min-h-9 -translate-y-1/2 items-center rounded-control px-2.5 text-xs font-bold text-cielo-700 hover:bg-cielo/60"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </span>
      {ayuda && <span className="mt-1 block text-xs font-normal text-piedra-texto">{ayuda}</span>}
    </label>
  )
}

const LARGO_MINIMO_CONTRASENA = 6

function AuthCard({ modoInicial = 'login' }) {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const ubicacion = useLocation()
  // Página desde la que se llegó al login (ej. al tocar un corazón) y aviso a mostrar.
  const [origen] = useState(() => ({ ruta: ubicacion.state?.desde || '/destinos', aviso: ubicacion.state?.aviso || '' }))
  const [loginMensaje, setLoginMensaje] = useState('')
  // true cuando este formulario ya decidió a dónde ir: evita que la
  // redirección automática de abajo lo pise mientras carga la página siguiente.
  const [redirigiendo, setRedirigiendo] = useState(false)
  const [mostrarRegistro, setMostrarRegistro] = useState(modoInicial === 'registro')

  const [loginForm, setLoginForm] = useState({ email: '', contrasena: '' })
  const [loginError, setLoginError] = useState('')
  const [loginEnviando, setLoginEnviando] = useState(false)

  const [registroForm, setRegistroForm] = useState({ nombre: '', apellido: '', email: '', contrasena: '' })
  const [registroError, setRegistroError] = useState('')
  const [registroEnviando, setRegistroEnviando] = useState(false)

  function voltear(hacia) {
    setMostrarRegistro(hacia === 'registro')
    setLoginError('')
    setLoginMensaje('')
    setRegistroError('')
    // Solo cambia la URL visible; se conserva el estado que guarda React Router.
    window.history.replaceState(window.history.state, '', hacia === 'registro' ? '/registro' : '/login')
  }

  async function recuperarContrasena() {
    setLoginError('')
    setLoginMensaje('')
    if (!loginForm.email.trim()) {
      setLoginError('Escribe tu correo electrónico arriba y vuelve a pulsar "¿Olvidaste tu contraseña?".')
      return
    }
    try {
      await sendPasswordResetEmail(auth, loginForm.email.trim())
      setLoginMensaje('Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también tu carpeta de spam.')
    } catch (errorFirebase) {
      console.error('Error al enviar el correo de recuperación:', errorFirebase.code, errorFirebase.message)
      setLoginError(errorFirebase.code === 'auth/invalid-email'
        ? 'El correo electrónico no tiene un formato válido.'
        : 'No pudimos enviar el correo de recuperación. Inténtalo de nuevo en unos minutos.')
    }
  }

  async function iniciarSesion(evento) {
    evento.preventDefault()
    setLoginError('')
    setLoginMensaje('')
    if (!loginForm.email || !loginForm.contrasena) {
      setLoginError('Completa tu correo electrónico y contraseña.')
      return
    }

    try {
      setLoginEnviando(true)
      const credencial = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.contrasena)

      const { valor: datosUsuario } = await esperarConLimite(getUsuarioPorId(credencial.user.uid), 6000)
      if (datosUsuario?.activo === false) {
        await signOut(auth)
        setLoginError('Tu cuenta ha sido deshabilitada. Contacta al administrador.')
        return
      }

      setRedirigiendo(true)
      navegar(origen.ruta, { replace: true })
    } catch (errorFirebase) {
      console.error('Error al iniciar sesión:', errorFirebase.code, errorFirebase.message)
      setLoginError(mensajeDeErrorLogin(errorFirebase.code))
    } finally {
      setLoginEnviando(false)
    }
  }

  async function registrarUsuario(evento) {
    evento.preventDefault()
    setRegistroError('')
    if (Object.values(registroForm).some((valor) => !valor.trim())) {
      setRegistroError('Completa todos los campos para crear tu cuenta.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registroForm.email)) {
      setRegistroError('Ingresa un correo electrónico válido.')
      return
    }
    if (registroForm.contrasena.length < LARGO_MINIMO_CONTRASENA) {
      setRegistroError(`La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`)
      return
    }

    try {
      setRegistroEnviando(true)
      const credencial = await createUserWithEmailAndPassword(auth, registroForm.email, registroForm.contrasena)
      await updateProfile(credencial.user, { displayName: `${registroForm.nombre} ${registroForm.apellido}` })

      // No esperamos esta escritura: si Firestore tarda, no dejamos al
      // usuario colgado en "Creando cuenta..." con la cuenta ya creada en
      // Firebase Auth. Perfil.jsx crea este documento igual si faltara.
      crearUsuario(credencial.user.uid, {
        nombre: registroForm.nombre,
        apellido: registroForm.apellido,
        email: registroForm.email,
      }).catch((error) => console.error('No se pudo crear el documento de usuario:', error))

      // Primera parada: elegir preferencias. Desde ahí puede seguir a donde iba.
      setRedirigiendo(true)
      navegar('/perfil?bienvenida=1', { replace: true, state: { desde: origen.ruta } })
    } catch (errorFirebase) {
      console.error('Error al registrar usuario:', errorFirebase.code, errorFirebase.message)
      setRegistroError(mensajeDeErrorRegistro(errorFirebase.code))
    } finally {
      setRegistroEnviando(false)
    }
  }

  // Quien ya tiene sesión no necesita este formulario. Mientras se envía no se
  // redirige aquí: lo hace cada función al terminar sus comprobaciones.
  if (usuario && !loginEnviando && !registroEnviando && !redirigiendo) {
    return <Navigate to={origen.ruta} replace />
  }

  return (
    <main className="grid min-h-screen bg-sal lg:grid-cols-[1.05fr_1fr]">
      {/* Escritorio: foto de paisaje boliviano a un lado (DESIGN.md §7). */}
      <aside className="relative hidden overflow-hidden lg:block" aria-label="Salar de Uyuni al atardecer">
        <img src={FOTOS['portada-acceso'].imagen_principal} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-noche/80 via-noche/10 to-noche/30" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link to="/" className="w-fit rounded-full bg-noche/55 py-1.5 pl-1.5 pr-4 backdrop-blur" aria-label="Rutas de Bolivia, ir al inicio">
            <Logo claro />
          </Link>
          <div>
            <p className="titulo-display max-w-md text-[48px] text-white">Bolivia te espera</p>
            <p className="mt-3 max-w-sm text-white/85">Guarda tus lugares favoritos, arma tus viajes y descubre qué hacer en cada departamento.</p>
            <p className="mt-6 text-xs text-white/70">{FOTOS['portada-acceso'].credito_imagenes}</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-col items-center justify-center px-4 py-8 sm:px-8">
        <Link to="/" className="mb-6 inline-flex min-h-11 items-center gap-2 self-start rounded-control px-2 text-sm font-bold text-noche hover:bg-sal-2 sm:self-center lg:hidden">
          <ArrowLeft aria-hidden="true" size={18} />
          <Logo />
        </Link>
        <Link to="/" className="mb-6 hidden min-h-11 items-center gap-1.5 self-center rounded-control px-3 text-sm font-bold text-cielo-700 hover:bg-sal-2 lg:inline-flex">
          <ArrowLeft aria-hidden="true" size={16} /> Volver al inicio
        </Link>

      <div className="w-full max-w-md [perspective:1600px]">
        <div
          className="relative h-[680px] w-full transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: mostrarRegistro ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Cara frontal: iniciar sesión. "inert" saca del foco de teclado y de
              los lectores de pantalla a la cara que está oculta. */}
          <section inert={mostrarRegistro} className="absolute inset-0 flex flex-col justify-start overflow-y-auto px-1 pt-2 sm:justify-center sm:rounded-tarjeta sm:border sm:border-borde sm:bg-white sm:shadow-elevada [backface-visibility:hidden] sm:p-10">
            <p className="mb-3 rotulo">Explora Bolivia</p>
            <h1 className="titulo-display mb-2 text-[40px]">Bienvenido de vuelta</h1>
            <p className="mb-8 text-piedra-texto">Ingresa para descubrir tu próximo destino.</p>
            {origen.aviso && !loginError && !loginMensaje && <p className="mb-5 rounded-control bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{origen.aviso}</p>}
            {loginError && <p className="mb-5 rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{loginError}</p>}
            {loginMensaje && <p className="mb-5 rounded-control bg-cielo px-4 py-3 text-sm font-semibold text-noche" role="status">{loginMensaje}</p>}
            <form onSubmit={iniciarSesion} className="space-y-5">
              <label className={claseEtiqueta}>
                Correo electrónico
                <input
                  type="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(evento) => setLoginForm({ ...loginForm, email: evento.target.value })}
                  className={`${claseControl} mt-2 font-normal`}
                />
              </label>
              <CampoContrasena
                etiqueta="Contraseña"
                valor={loginForm.contrasena}
                onCambiar={(contrasena) => setLoginForm({ ...loginForm, contrasena })}
                autoComplete="current-password"
                claseInput={`${claseControl} mt-2 font-normal`}
              />
              <button type="button" onClick={recuperarContrasena} className="-mt-2 block min-h-11 text-sm font-bold text-cielo-700 underline">
                ¿Olvidaste tu contraseña?
              </button>
              <button disabled={loginEnviando} className={claseBoton('primario', 'normal', 'w-full')}>
                {loginEnviando ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>
            <p className="mt-7 text-center text-sm text-piedra-texto">
              ¿Aún no tienes cuenta?{' '}
              <button type="button" onClick={() => voltear('registro')} className="font-bold text-cielo-700 underline">
                Crear cuenta
              </button>
            </p>
          </section>

          {/* Cara trasera: crear cuenta */}
          <section
            inert={!mostrarRegistro}
            className="absolute inset-0 flex flex-col justify-start overflow-y-auto px-1 pt-2 sm:justify-center sm:rounded-tarjeta sm:border sm:border-borde sm:bg-white sm:shadow-elevada [backface-visibility:hidden] sm:p-10"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="mb-3 rotulo">Rutas de Bolivia</p>
            <h1 className="titulo-display mb-2 text-[40px]">Crea tu cuenta</h1>
            <p className="mb-6 text-piedra-texto">Guarda la inspiración para tu próxima aventura.</p>
            {registroError && <p className="mb-5 rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{registroError}</p>}
            <form onSubmit={registrarUsuario} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={claseEtiqueta}>
                  Nombre
                  <input
                    autoComplete="given-name"
                    value={registroForm.nombre}
                    onChange={(evento) => setRegistroForm({ ...registroForm, nombre: evento.target.value })}
                    className={`${claseControl} mt-2 font-normal`}
                  />
                </label>
                <label className={claseEtiqueta}>
                  Apellido
                  <input
                    autoComplete="family-name"
                    value={registroForm.apellido}
                    onChange={(evento) => setRegistroForm({ ...registroForm, apellido: evento.target.value })}
                    className={`${claseControl} mt-2 font-normal`}
                  />
                </label>
              </div>
              <label className={claseEtiqueta}>
                Correo electrónico
                <input
                  type="email"
                  autoComplete="email"
                  value={registroForm.email}
                  onChange={(evento) => setRegistroForm({ ...registroForm, email: evento.target.value })}
                  className={`${claseControl} mt-2 font-normal`}
                />
              </label>
              <CampoContrasena
                etiqueta="Contraseña"
                valor={registroForm.contrasena}
                onCambiar={(contrasena) => setRegistroForm({ ...registroForm, contrasena })}
                autoComplete="new-password"
                ayuda={`Mínimo ${LARGO_MINIMO_CONTRASENA} caracteres.`}
                claseInput={`${claseControl} mt-2 font-normal`}
              />
              <button disabled={registroEnviando} className={claseBoton('primario', 'normal', 'w-full')}>
                {registroEnviando ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-piedra-texto">
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => voltear('login')} className="font-bold text-cielo-700 underline">
                Inicia sesión
              </button>
            </p>
          </section>
        </div>
      </div>
      </div>
    </main>
  )
}

export default AuthCard
