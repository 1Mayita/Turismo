import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// Envuelve páginas que requieren sesión iniciada (turista o admin).
function RutaPrivada({ children }) {
  const { usuario } = useAuth()
  return usuario ? children : <Navigate to="/login" replace />
}

export default RutaPrivada
