import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// Envuelve páginas que requieren sesión iniciada (turista o admin). Guarda de
// dónde venía la persona para devolverla ahí después de iniciar sesión.
function RutaPrivada({ children }) {
  const { usuario } = useAuth()
  const ubicacion = useLocation()
  if (usuario) return children
  return (
    <Navigate
      to="/login"
      replace
      state={{ desde: ubicacion.pathname + ubicacion.search, aviso: 'Inicia sesión para ver esta página.' }}
    />
  )
}

export default RutaPrivada
