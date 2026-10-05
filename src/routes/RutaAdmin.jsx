import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// Envuelve las rutas /admin/*: exige sesión iniciada y esAdmin === true.
function RutaAdmin({ children }) {
  const { usuario, esAdmin } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return esAdmin ? children : <Navigate to="/destinos" replace />
}

export default RutaAdmin
