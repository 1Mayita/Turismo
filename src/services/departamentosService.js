import { crearServicio } from './coleccion.js'
import { departamentosDeEjemplo } from './datosDeEjemplo.js'

export { departamentosDeEjemplo }

// Campos de un departamento: nombre, descripcion, eslogan, imagen_portada.
const departamentos = crearServicio('departamentos', departamentosDeEjemplo)

export const getDepartamentos = departamentos.todos
export const getDepartamentoPorId = departamentos.uno
export const crearDepartamento = departamentos.crear
export const actualizarDepartamento = departamentos.actualizar
export const eliminarDepartamento = departamentos.eliminar
