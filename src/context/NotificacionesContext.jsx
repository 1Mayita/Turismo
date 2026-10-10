import { useCallback, useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from './useAuth.js'
import { NotificacionesContext } from './notificacionesContext.js'
import { categoriasDeEjemplo, getCategorias } from '../services/categoriasService.js'
import { getPreferenciasDeUsuario } from '../services/preferenciasService.js'
import {
  TIPOS_POR_DEFECTO,
  armarNotificaciones,
  getAjustesDeNotificaciones,
  getNovedadesRecientes,
  guardarAjustesDeNotificaciones,
} from '../services/notificacionesService.js'

const CADA_CUANTO_REVISAR_MS = 2 * 60 * 1000
const AJUSTES_VACIOS = { leidas: [], leidas_hasta: null, tipos: TIPOS_POR_DEFECTO }

// Carga las notificaciones de quien inició sesión, revisa si hay nuevas cada
// dos minutos y las comparte con la campana, la página y el perfil.
export function NotificacionesProvider({ children }) {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState({ uid: null, novedades: [], ajustes: AJUSTES_VACIOS, preferidas: [] })
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    if (!usuario) return
    try {
      const [novedades, ajustes, preferencias, categorias] = await Promise.all([
        getNovedadesRecientes(),
        getAjustesDeNotificaciones(usuario.uid),
        getPreferenciasDeUsuario(usuario.uid).catch(() => []),
        getCategorias().catch(() => categoriasDeEjemplo),
      ])
      const idsPreferidos = new Set(preferencias.map((preferencia) => preferencia.id_categoria))
      const preferidas = (categorias.length > 0 ? categorias : categoriasDeEjemplo).filter((categoria) => idsPreferidos.has(categoria.id)).map((categoria) => categoria.nombre)
      setEstado({ uid: usuario.uid, novedades, ajustes, preferidas })
      setError('')
    } catch (errorLectura) {
      console.error('Error al cargar notificaciones:', errorLectura)
      setError('No pudimos cargar tus notificaciones.')
    }
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    // La primera carga va en un temporizador para no cambiar el estado
    // dentro del cuerpo del efecto.
    const primera = setTimeout(cargar, 0)
    const intervalo = setInterval(cargar, CADA_CUANTO_REVISAR_MS)
    return () => {
      clearTimeout(primera)
      clearInterval(intervalo)
    }
  }, [usuario, cargar])

  const listo = Boolean(usuario) && estado.uid === usuario.uid
  const notificaciones = listo ? armarNotificaciones(estado.novedades, estado.ajustes, estado.preferidas) : []
  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length

  // Cambia la pantalla al instante y guarda; si falla, vuelve atrás.
  async function guardarAjustes(nuevos) {
    const anteriores = estado.ajustes
    setEstado((actual) => ({ ...actual, ajustes: nuevos }))
    try {
      await guardarAjustesDeNotificaciones(usuario.uid, nuevos)
    } catch (errorGuardado) {
      setEstado((actual) => ({ ...actual, ajustes: anteriores }))
      throw errorGuardado
    }
  }

  function marcarLeida(id) {
    if (!listo || estado.ajustes.leidas.includes(id)) return Promise.resolve()
    return guardarAjustes({ ...estado.ajustes, leidas: [...estado.ajustes.leidas, id] }).catch((errorGuardado) => console.error('Error al marcar como leída:', errorGuardado))
  }

  function marcarTodasLeidas() {
    if (!listo) return Promise.resolve()
    return guardarAjustes({ ...estado.ajustes, leidas: [], leidas_hasta: Timestamp.now() })
  }

  function cambiarTipos(tipos) {
    return guardarAjustes({ ...estado.ajustes, tipos })
  }

  return (
    <NotificacionesContext.Provider value={{ listo, notificaciones, noLeidas, tipos: estado.ajustes.tipos, error, marcarLeida, marcarTodasLeidas, cambiarTipos, recargar: cargar }}>
      {children}
    </NotificacionesContext.Provider>
  )
}
