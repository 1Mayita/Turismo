import { useEffect } from 'react'

const NOMBRE_SITIO = 'Rutas de Bolivia'

// Pone el título de la pestaña del navegador. Sin texto deja solo el nombre del sitio.
export function useTituloPagina(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOMBRE_SITIO}` : `${NOMBRE_SITIO} · Turismo en Bolivia`
  }, [titulo])
}
