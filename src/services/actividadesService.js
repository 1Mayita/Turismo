import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export async function getActividades() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'actividades')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function getActividadesPorDestino(idDestino) {
  const consulta = query(collection(db, 'actividades'), where('id_destino', '==', idDestino))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function crearActividad(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'actividades'), datos))
}

export async function actualizarActividad(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'actividades', id), datos))
}

export async function eliminarActividad(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'actividades', id)))
}
