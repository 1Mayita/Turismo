import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import PantallaCarga from '../components/PantallaCarga.jsx'
import ConfirmacionProvider from '../components/admin/ConfirmacionProvider.jsx'

// Envuelve las rutas /admin/*: exige sesión iniciada y esAdmin === true.
function RutaAdmin({ children }) {
  const { usuario, esAdmin } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Al recargar la página, la comprobación de administrador tarda un momento:
  // se espera en vez de expulsar a quien sí es administrador.
  if (esAdmin === null) return <PantallaCarga />

  return esAdmin ? <ConfirmacionProvider>{children}</ConfirmacionProvider> : <Navigate to="/destinos" replace />
}

export default RutaAdmin
