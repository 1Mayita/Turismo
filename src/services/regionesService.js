import { equalTo, get, orderByChild, push, query, ref, remove, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export async function getRegionesPorDepartamento(idDepartamento) {
  const consulta = query(ref(db, 'regiones'), orderByChild('id_departamento'), equalTo(idDepartamento))
  const instantanea = await conLimiteDeTiempo(get(consulta))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

export async function crearRegion(datos) {
  await conLimiteDeTiempo(push(ref(db, 'regiones'), datos))
}

export async function actualizarRegion(id, datos) {
  await conLimiteDeTiempo(update(ref(db, `regiones/${id}`), datos))
}

export async function eliminarRegion(id) {
  await conLimiteDeTiempo(remove(ref(db, `regiones/${id}`)))
}
