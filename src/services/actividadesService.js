import { equalTo, get, orderByChild, push, query, ref, remove, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

function aLista(instantanea) {
  const datos = instantanea.val() || {}
  return Object.entries(datos).map(([id, actividad]) => ({ id, ...actividad }))
}

export async function getActividades() {
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'actividades')))
  return aLista(instantanea)
}

export async function getActividadesPorDestino(destinoId) {
  if (!destinoId) return []
  const consulta = query(ref(db, 'actividades'), orderByChild('destinoId'), equalTo(destinoId))
  const instantanea = await conLimiteDeTiempo(get(consulta))
  return aLista(instantanea)
}

export async function crearActividad(datos) {
  if (!datos?.destinoId || !String(datos?.nombre || '').trim()) {
    throw new Error('La actividad necesita un destino y un nombre.')
  }
  const actividad = {
    nombre: String(datos.nombre).trim(),
    destinoId: datos.destinoId,
    descripcion: String(datos.descripcion || '').trim(),
    precio: Number(datos.precio || 0),
    duracion: String(datos.duracion || '').trim(),
    imagen: String(datos.imagen || '').trim(),
  }
  if (!Number.isFinite(actividad.precio) || actividad.precio < 0) {
    throw new Error('El precio de la actividad no puede ser negativo.')
  }
  const referencia = await conLimiteDeTiempo(push(ref(db, 'actividades'), actividad))
  return referencia.key
}

export async function actualizarActividad(id, cambios) {
  if (!id) throw new Error('Falta el identificador de la actividad.')
  const actualizacion = { ...cambios }
  if (actualizacion.nombre != null) actualizacion.nombre = String(actualizacion.nombre).trim()
  if (actualizacion.descripcion != null) actualizacion.descripcion = String(actualizacion.descripcion).trim()
  if (actualizacion.precio != null) {
    actualizacion.precio = Number(actualizacion.precio)
    if (!Number.isFinite(actualizacion.precio) || actualizacion.precio < 0) {
      throw new Error('El precio de la actividad no puede ser negativo.')
    }
  }
  await conLimiteDeTiempo(update(ref(db, `actividades/${id}`), actualizacion))
}

export async function eliminarActividad(id) {
  if (!id) throw new Error('Falta el identificador de la actividad.')
  await conLimiteDeTiempo(remove(ref(db, `actividades/${id}`)))
}
