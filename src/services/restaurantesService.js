import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

const COLECCION = 'restaurantes'

export async function getRestaurantes() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, COLECCION)))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function getRestaurantePorId(id) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, COLECCION, id)))
  return documento.exists() ? { id: documento.id, ...documento.data() } : null
}

export async function crearRestaurante(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, COLECCION), datos))
}

export async function actualizarRestaurante(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, COLECCION, id), datos))
}

export async function eliminarRestaurante(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, COLECCION, id)))
}
