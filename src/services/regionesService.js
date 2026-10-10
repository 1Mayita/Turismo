import { crearServicio } from './coleccion.js'
import { regionesDeEjemplo } from './datosDeEjemplo.js'

export { regionesDeEjemplo }

const regiones = crearServicio('regiones', regionesDeEjemplo)

export const getRegiones = regiones.todos
export const crearRegion = regiones.crear
export const actualizarRegion = regiones.actualizar
export const eliminarRegion = regiones.eliminar

export function getRegionesPorMunicipio(idMunicipio) {
  return regiones.donde({ id_municipio: idMunicipio })
}

// Regiones de varios municipios a la vez (ej. todos los de un departamento).
// Hay pocas regiones, así que se leen todas y se filtran aquí.
export async function getRegionesPorMunicipios(idsMunicipios) {
  const todas = await regiones.todos()
  return todas.filter((region) => idsMunicipios.includes(region.id_municipio))
}
