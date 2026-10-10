import { useContext } from 'react'
import { NotificacionesContext } from './notificacionesContext.js'

export function useNotificaciones() {
  return useContext(NotificacionesContext)
}
