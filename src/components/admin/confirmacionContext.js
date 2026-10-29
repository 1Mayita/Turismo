import { createContext, useContext } from 'react'

export const ConfirmacionContext = createContext(null)

// Devuelve confirmar({ titulo, mensaje, textoConfirmar }), que abre el diálogo
// de confirmación del panel y se resuelve en true (confirmó) o false (canceló).
// Reemplaza a window.confirm en las acciones de eliminar.
export function useConfirmar() {
  const confirmar = useContext(ConfirmacionContext)
  if (!confirmar) throw new Error('useConfirmar debe usarse dentro de ConfirmacionProvider (RutaAdmin).')
  return confirmar
}
