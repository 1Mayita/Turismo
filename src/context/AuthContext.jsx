import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase.js'
import { esCorreoAdministrador } from '../services/adminService.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cancelarSuscripcion = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual)
      // No bloqueamos el render de la app esperando esto: la mayoría de las
      // páginas no necesitan saber si el usuario es admin para mostrarse.
      setCargando(false)

      if (usuarioActual) {
        esCorreoAdministrador(usuarioActual.email)
          .then(setEsAdmin)
          .catch(() => setEsAdmin(false))
      } else {
        setEsAdmin(false)
      }
    })

    return cancelarSuscripcion
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, esAdmin, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}
