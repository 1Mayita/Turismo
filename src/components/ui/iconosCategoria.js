import { Church, Compass, Landmark, Mountain, ScrollText, Ticket, Trees, UtensilsCrossed } from 'lucide-react'
import { normalizar } from '../../utils/texto.js'

// Icono de Lucide para cada categoría del catálogo. Se busca por el nombre
// sin tildes ni mayúsculas, así "Gastronomía" y "gastronomia" coinciden.
// Una categoría nueva que no esté aquí usa la brújula.
const ICONOS = {
  naturaleza: Trees,
  cultura: Landmark,
  aventura: Mountain,
  gastronomia: UtensilsCrossed,
  historia: ScrollText,
  entretenimiento: Ticket,
  religioso: Church,
}

export function iconoDeCategoria(nombre) {
  return ICONOS[normalizar(nombre)] || Compass
}
