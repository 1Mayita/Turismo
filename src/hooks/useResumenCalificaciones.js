import { useEffect, useState } from 'react'
import { getResumenCalificaciones } from '../services/resenasService.js'

// Devuelve { resumen, error }, donde resumen es { [idDestino]: { promedio, total } }.
// Todas las tarjetas comparten la misma consulta gracias a la caché del servicio.
export function useResumenCalificaciones() {
  const [resumen, setResumen] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    getResumenCalificaciones()
      .then((datos) => {
        if (activo) setResumen(datos)
      })
      .catch((errorLectura) => {
        console.error('Error al cargar calificaciones:', errorLectura)
        if (activo) setError('No se pudieron cargar las calificaciones.')
      })
    return () => {
      activo = false
    }
  }, [])

  return { resumen, error }
}
