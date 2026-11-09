import { collection, getDocs, query, where } from 'firebase/firestore'
import { crearServicio, SOLO_EJEMPLOS } from './coleccion.js'
import { restaurantesDeEjemplo } from './datosDeEjemplo.js'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'
import { normalizar } from '../utils/texto.js'

// Campos de un restaurante: nombre, descripcion, especialidad, horario,
// platos_ids [ids de "platos"] ← relación muchos a muchos con el catálogo de
// platos típicos (un restaurante ofrece varios platos y un plato está en
// varios restaurantes). Solo el administrador lo edita. menu [{ nombre, precio }], telefono,
// facebook, instagram, sitio_web, imagen_principal, imagenes [], latitud,
// longitud, direccion, ubicacion, id_departamento, id_municipio, id_region.
//
// Los restaurantes cargados antes de la relación tienen platos_tipicos
// [nombres]: mientras no se editen, se relacionan por nombre (ver idsDePlatos).
const restaurantes = crearServicio('restaurantes', restaurantesDeEjemplo)

export const MAXIMO_PLATOS_POR_RESTAURANTE = 60

export const getRestaurantes = restaurantes.todos
export const getRestaurantePorId = restaurantes.uno
export const crearRestaurante = restaurantes.crear
export const actualizarRestaurante = restaurantes.actualizar
export const eliminarRestaurante = restaurantes.eliminar

export function getRestaurantesPorDepartamento(idDepartamento) {
  return restaurantes.donde({ id_departamento: idDepartamento })
}

// Ids de los platos del catálogo que ofrece el restaurante. Si todavía no
// tiene "platos_ids" (dato anterior a la relación), se buscan por nombre.
export function idsDePlatos(restaurante, platos = []) {
  if (Array.isArray(restaurante?.platos_ids)) return restaurante.platos_ids
  const nombres = new Set((Array.isArray(restaurante?.platos_tipicos) ? restaurante.platos_tipicos : []).map(normalizar))
  return platos.filter((plato) => nombres.has(normalizar(plato.nombre))).map((plato) => plato.id)
}

// Restaurantes que ofrecen un plato: consulta "array-contains" por id (no
// necesita índice compuesto) más los antiguos que solo lo tienen por nombre.
export async function getRestaurantesConPlato(plato) {
  if (!plato?.id) return []
  if (SOLO_EJEMPLOS) return restaurantesDeEjemplo.filter((restaurante) => idsDePlatos(restaurante, [plato]).includes(plato.id))
  const [porId, todos] = await Promise.all([
    conLimiteDeTiempo(getDocs(query(collection(db, 'restaurantes'), where('platos_ids', 'array-contains', plato.id)))),
    getRestaurantes(),
  ])
  const encontrados = new Map(porId.docs.map((documento) => [documento.id, { id: documento.id, ...documento.data() }]))
  todos
    .filter((restaurante) => !Array.isArray(restaurante.platos_ids) && idsDePlatos(restaurante, [plato]).includes(plato.id))
    .forEach((restaurante) => encontrados.set(restaurante.id, restaurante))
  return [...encontrados.values()]
}

function limpiarIds(ids) {
  return [...new Set((ids || []).filter((id) => typeof id === 'string' && id))]
}

export { limpiarIds as limpiarIdsDePlatos }
