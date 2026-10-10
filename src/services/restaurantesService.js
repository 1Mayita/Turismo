import { crearServicio } from './coleccion.js'
import { restaurantesDeEjemplo } from './datosDeEjemplo.js'

// Campos de un restaurante: nombre, descripcion, especialidad, horario,
// platos_tipicos [], menu [{ nombre, precio }], telefono, facebook, instagram,
// sitio_web, imagen_principal, imagenes [], latitud, longitud, direccion,
// ubicacion, id_departamento, id_municipio, id_region.
const restaurantes = crearServicio('restaurantes', restaurantesDeEjemplo)

export const getRestaurantes = restaurantes.todos
export const getRestaurantePorId = restaurantes.uno
export const crearRestaurante = restaurantes.crear
export const actualizarRestaurante = restaurantes.actualizar
export const eliminarRestaurante = restaurantes.eliminar

export function getRestaurantesPorDepartamento(idDepartamento) {
  return restaurantes.donde({ id_departamento: idDepartamento })
}
