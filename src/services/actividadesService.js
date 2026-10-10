import { crearServicio } from './coleccion.js'
import { actividadesDeEjemplo } from './datosDeEjemplo.js'

const actividades = crearServicio('actividades', actividadesDeEjemplo)

export const getActividades = actividades.todos
export const getActividadPorId = actividades.uno
export const crearActividad = actividades.crear
export const actualizarActividad = actividades.actualizar
export const eliminarActividad = actividades.eliminar

export function getActividadesPorDestino(idDestino) {
  return actividades.donde({ id_destino: idDestino })
}
