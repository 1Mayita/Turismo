import { createContext, useContext } from 'react'

export const ConfirmacionContext = createContext(null)

// Devuelve confirmar({ titulo, mensaje, textoConfirmar, tono }), que abre el
// diálogo de confirmación propio y se resuelve en true (confirmó) o false
// (canceló). Reemplaza SIEMPRE a window.confirm / alert: la app nunca muestra
// los diálogos nativos del navegador.
export function useConfirmar() {
  const confirmar = useContext(ConfirmacionContext)
  if (!confirmar) throw new Error('useConfirmar debe usarse dentro de ConfirmacionProvider (main.jsx).')
  return confirmar
}
