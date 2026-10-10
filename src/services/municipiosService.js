import { crearServicio } from './coleccion.js'
import { municipiosDeEjemplo } from './datosDeEjemplo.js'

export { municipiosDeEjemplo }

const municipios = crearServicio('municipios', municipiosDeEjemplo)

export const getMunicipios = municipios.todos
export const crearMunicipio = municipios.crear
export const actualizarMunicipio = municipios.actualizar
export const eliminarMunicipio = municipios.eliminar

export function getMunicipiosPorDepartamento(idDepartamento) {
  return municipios.donde({ id_departamento: idDepartamento })
}
