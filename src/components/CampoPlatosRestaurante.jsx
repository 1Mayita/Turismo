import { useEffect, useRef, useState } from 'react'
import SelectorPlatos from './SelectorPlatos.jsx'
import { getPlatos } from '../services/platosService.js'
import { idsDePlatos } from '../services/restaurantesService.js'

// Campo "Platos típicos que ofrece" del formulario de un restaurante (panel de
// administración): carga el catálogo y muestra el selector. Si el plato no
// existe, onRegistrarPlato(texto) lleva al registro de platos típicos y luego
// se vuelve a este formulario sin perder lo escrito.
// Si el restaurante es anterior a la relación por ids (solo tenía nombres),
// preselecciona los platos del catálogo cuyo nombre coincide.
function CampoPlatosRestaurante({ valor, onChange, restaurante, onRegistrarPlato }) {
  const [platos, setPlatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const migrado = useRef(false)
  const seleccionados = Array.isArray(valor) ? valor : []

  useEffect(() => {
    let activo = true
    getPlatos()
      .then((lista) => {
        if (!activo) return
        setPlatos(lista)
        if (!migrado.current && restaurante && !Array.isArray(restaurante.platos_ids) && seleccionados.length === 0) {
          migrado.current = true
          const deducidos = idsDePlatos(restaurante, lista)
          if (deducidos.length > 0) onChange(deducidos)
        }
      })
      .catch((errorLectura) => {
        console.error('Error al cargar el catálogo de platos:', errorLectura)
        if (activo) setError('No se pudo cargar el catálogo de platos típicos.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
    // Solo al abrir el formulario de este restaurante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurante?.id])

  if (cargando) return <div className="h-40 animate-pulse rounded-control bg-sal-2" aria-label="Cargando platos típicos" />
  if (error) return <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>

  return (
    <SelectorPlatos
      platos={platos}
      seleccionados={seleccionados}
      onChange={onChange}
      onPlatoFaltante={onRegistrarPlato}
      preguntaFaltante="¿No está el plato que quieres registrar?"
      textoFaltante="Registrar nuevo plato"
    />
  )
}

export default CampoPlatosRestaurante
