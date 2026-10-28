import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import marca from '../assets/logo.png'
import { EVENTO_MOSTRAR_INSTALACION, yaEstaInstalada } from '../utils/instalacion.js'

const CLAVE_DESCARTE = 'rutas-instalacion-descartada'
const DIAS_SIN_MOSTRAR = 14

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function esAndroid() {
  return /android/i.test(navigator.userAgent)
}

// Si se cerró hace menos de 14 días no vuelve a aparecer solo (sí desde el menú).
function descartadoRecientemente() {
  try {
    const fecha = Number(localStorage.getItem(CLAVE_DESCARTE))
    return fecha > 0 && Date.now() - fecha < DIAS_SIN_MOSTRAR * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function InstalacionApp() {
  const [instalador, setInstalador] = useState(null)
  const [visible, setVisible] = useState(() => esIOS() && !yaEstaInstalada() && !descartadoRecientemente())
  const [error, setError] = useState('')

  useEffect(() => {
    if (yaEstaInstalada()) return undefined

    function ofrecerInstalacion(evento) {
      evento.preventDefault()
      setInstalador(evento)
      if (!descartadoRecientemente()) setVisible(true)
    }

    function confirmarInstalacion() {
      setInstalador(null)
      setVisible(false)
    }

    function mostrar() {
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', ofrecerInstalacion)
    window.addEventListener('appinstalled', confirmarInstalacion)
    window.addEventListener(EVENTO_MOSTRAR_INSTALACION, mostrar)
    return () => {
      window.removeEventListener('beforeinstallprompt', ofrecerInstalacion)
      window.removeEventListener('appinstalled', confirmarInstalacion)
      window.removeEventListener(EVENTO_MOSTRAR_INSTALACION, mostrar)
    }
  }, [])

  async function instalar() {
    if (!instalador) return
    setError('')
    try {
      await instalador.prompt()
      await instalador.userChoice
      setInstalador(null)
      setVisible(false)
    } catch (errorInstalacion) {
      console.error('No se pudo abrir el aviso de instalación:', errorInstalacion)
      setError('No se pudo abrir la instalación. Inténtalo de nuevo desde el menú del navegador.')
    }
  }

  function cerrar() {
    setVisible(false)
    try {
      localStorage.setItem(CLAVE_DESCARTE, String(Date.now()))
    } catch {
      // Sin almacenamiento disponible: solo se cierra por ahora.
    }
  }

  if (!visible || yaEstaInstalada()) return null

  let instrucciones = 'Añádela a tu pantalla de inicio para abrirla como una aplicación, incluso con poca señal.'
  if (esIOS()) instrucciones = 'En Safari, toca Compartir y elige “Añadir a pantalla de inicio”.'
  else if (!instalador) instrucciones = 'Abre el menú del navegador (⋮) y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.'

  return (
    <aside
      aria-label="Instalar Rutas de Bolivia"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[1100] mx-auto max-w-md animate-subir rounded-tarjeta border border-borde bg-white p-4 shadow-flotante sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-borde bg-white" aria-hidden="true">
          <img src={marca} alt="" className="h-10 w-10" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-noche">Instala Rutas de Bolivia</p>
          <p className="mt-1 text-sm leading-5 text-piedra-texto">{instrucciones}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {instalador && (
              <button type="button" onClick={instalar} className="min-h-11 rounded-control boton-principal px-4 text-sm font-bold">
                Instalar app
              </button>
            )}
            {esAndroid() && (
              <a
                href="/downloads/rutas-de-bolivia.apk"
                download
                className="inline-flex min-h-11 items-center rounded-control border border-borde px-4 text-sm font-bold text-noche transition-colors hover:bg-sal"
              >
                Descargar APK (prueba)
              </a>
            )}
          </div>
          {error && <p className="mt-2 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        </div>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso de instalación"
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-piedra-texto transition-colors hover:bg-sal-2"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
    </aside>
  )
}

export default InstalacionApp
