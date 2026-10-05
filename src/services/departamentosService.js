import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export { departamentosDeEjemplo } from './datosDeEjemplo.js'

export async function getDepartamentos() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'departamentos')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function getDepartamentoPorId(id) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'departamentos', id)))
  return documento.exists() ? { id: documento.id, ...documento.data() } : null
}

export async function crearDepartamento(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'departamentos'), datos))
}

export async function actualizarDepartamento(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'departamentos', id), datos))
}

export async function eliminarDepartamento(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'departamentos', id)))
}
