import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import PantallaCarga from '../components/PantallaCarga.jsx'

// Envuelve las rutas /admin/*: exige sesión iniciada y esAdmin === true.
function RutaAdmin({ children }) {
  const { usuario, esAdmin } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Al recargar la página, la comprobación de administrador tarda un momento:
  // se espera en vez de expulsar a quien sí es administrador.
  if (esAdmin === null) return <PantallaCarga />

  return esAdmin ? children : <Navigate to="/destinos" replace />
}

export default RutaAdmin
