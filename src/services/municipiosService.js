import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export { municipiosDeEjemplo } from './datosDeEjemplo.js'

export async function getMunicipios() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'municipios')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function getMunicipiosPorDepartamento(idDepartamento) {
  const consulta = query(collection(db, 'municipios'), where('id_departamento', '==', idDepartamento))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function crearMunicipio(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'municipios'), datos))
}

export async function actualizarMunicipio(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'municipios', id), datos))
}

export async function eliminarMunicipio(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'municipios', id)))
}
