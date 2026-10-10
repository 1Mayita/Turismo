import { crearServicio } from './coleccion.js'
import { platosDeEjemplo } from './datosDeEjemplo.js'

export { platosDeEjemplo }

// Platos típicos (colección "platos"): nombre, descripcion, origen,
// id_departamento, ingredientes [], lugares_tradicionales, imagen, credito_imagen.
const platos = crearServicio('platos', platosDeEjemplo)

export const getPlatos = platos.todos
export const getPlatoPorId = platos.uno
export const crearPlato = platos.crear
export const actualizarPlato = platos.actualizar
export const eliminarPlato = platos.eliminar
