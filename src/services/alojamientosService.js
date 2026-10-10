import { crearServicio } from './coleccion.js'
import { alojamientosDeEjemplo } from './datosDeEjemplo.js'

// Campos de un alojamiento: nombre, tipo, descripcion, precio_noche,
// servicios [], check_in, check_out, telefono, facebook, instagram, sitio_web,
// imagen_principal, imagenes [], latitud, longitud, direccion, ubicacion,
// id_departamento, id_municipio, id_region.
const alojamientos = crearServicio('alojamientos', alojamientosDeEjemplo)

export const getAlojamientos = alojamientos.todos
export const getAlojamientoPorId = alojamientos.uno
export const crearAlojamiento = alojamientos.crear
export const actualizarAlojamiento = alojamientos.actualizar
export const eliminarAlojamiento = alojamientos.eliminar

export function getAlojamientosPorDepartamento(idDepartamento) {
  return alojamientos.donde({ id_departamento: idDepartamento })
}
