import { crearServicio } from './coleccion.js'
import { platosDeEjemplo } from './datosDeEjemplo.js'
import { normalizar } from '../utils/texto.js'

export { platosDeEjemplo }

// Platos típicos (colección "platos"): nombre, descripcion, origen,
// id_departamento, ingredientes [], lugares_tradicionales, imagen, credito_imagen.
// Los restaurantes los referencian por id en su campo "platos_ids".
const platos = crearServicio('platos', platosDeEjemplo)

export const getPlatos = platos.todos
export const getPlatoPorId = platos.uno
export const crearPlato = platos.crear
export const actualizarPlato = platos.actualizar
export const eliminarPlato = platos.eliminar

// Nombre comparable: sin tildes, mayúsculas, signos ni espacios de más.
// "K'alapurka" y "kalapurka" o "Sopa  de Maní" y "sopa de mani" coinciden.
export function nombreComparable(nombre) {
  return normalizar(nombre).replace(/[^a-z0-9ñ ]/g, '').replace(/\s+/g, ' ').trim()
}

// Plato del catálogo con el mismo nombre (o null). Sirve para no crear duplicados.
export function buscarPlatoDuplicado(nombre, lista) {
  const buscado = nombreComparable(nombre)
  if (!buscado) return null
  return lista.find((plato) => nombreComparable(plato.nombre) === buscado) || null
}
