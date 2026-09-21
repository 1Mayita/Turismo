import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../services/firebase.js'
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

function AuthCard({ modoInicial = 'login' }) {
  const navegar = useNavigate()
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
    setRegistroError('')
    window.history.replaceState(null, '', hacia === 'registro' ? '/registro' : '/login')
  }

  async function iniciarSesion(evento) {
    evento.preventDefault()
    setLoginError('')
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

      navegar('/destinos')
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

      navegar('/destinos')
    } catch (errorFirebase) {
      console.error('Error al registrar usuario:', errorFirebase.code, errorFirebase.message)
      setRegistroError(mensajeDeErrorRegistro(errorFirebase.code))
    } finally {
      setRegistroEnviando(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10"
      style={{
        backgroundImage:
          'linear-gradient(160deg, rgba(16,58,37,0.85), rgba(10,39,24,0.92)), url(https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?auto=format&fit=crop&w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <a href="/" className="absolute left-6 top-6 text-xl font-bold tracking-tight text-white sm:left-10 sm:top-10">
        Rutas de Bolivia
      </a>

      <div className="w-full max-w-md [perspective:1600px]">
        <div
          className="relative h-[640px] w-full transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: mostrarRegistro ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Cara frontal: iniciar sesión */}
          <section className="absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl [backface-visibility:hidden] sm:p-10">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Explora Bolivia</p>
            <h1 className="mb-2 text-4xl font-bold text-brand-900">Bienvenido de vuelta</h1>
            <p className="mb-8 text-slate-600">Ingresa para descubrir tu próximo destino.</p>
            {loginError && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{loginError}</p>}
            <form onSubmit={iniciarSesion} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Correo electrónico
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(evento) => setLoginForm({ ...loginForm, email: evento.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Contraseña
                <input
                  type="password"
                  value={loginForm.contrasena}
                  onChange={(evento) => setLoginForm({ ...loginForm, contrasena: evento.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
              </label>
              <button disabled={loginEnviando} className="w-full rounded-xl bg-accent-600 px-4 py-3 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
                {loginEnviando ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-600">
              ¿Aún no tienes cuenta?{' '}
              <button type="button" onClick={() => voltear('registro')} className="font-bold text-brand-700 underline">
                Crear cuenta
              </button>
            </p>
          </section>

          {/* Cara trasera: crear cuenta */}
          <section
            className="absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl [backface-visibility:hidden] sm:p-10"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Rutas de Bolivia</p>
            <h1 className="mb-2 text-4xl font-bold text-brand-900">Crea tu cuenta</h1>
            <p className="mb-6 text-slate-600">Guarda la inspiración para tu próxima aventura.</p>
            {registroError && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{registroError}</p>}
            <form onSubmit={registrarUsuario} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nombre
                  <input
                    value={registroForm.nombre}
                    onChange={(evento) => setRegistroForm({ ...registroForm, nombre: evento.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Apellido
                  <input
                    value={registroForm.apellido}
                    onChange={(evento) => setRegistroForm({ ...registroForm, apellido: evento.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Correo electrónico
                <input
                  type="email"
                  value={registroForm.email}
                  onChange={(evento) => setRegistroForm({ ...registroForm, email: evento.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Contraseña
                <input
                  type="password"
                  value={registroForm.contrasena}
                  onChange={(evento) => setRegistroForm({ ...registroForm, contrasena: evento.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
              </label>
              <button disabled={registroEnviando} className="w-full rounded-xl bg-accent-600 px-4 py-3 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
                {registroEnviando ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => voltear('login')} className="font-bold text-brand-700 underline">
                Inicia sesión
              </button>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

export default AuthCard
