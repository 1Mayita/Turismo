import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export { destinosDeEjemplo } from './datosDeEjemplo.js'

export async function getDestinos() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'destinos')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function getDestinoPorId(id) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'destinos', id)))
  return documento.exists() ? { id: documento.id, ...documento.data() } : null
}

// Filtra por la zona más específica que se indique: región > municipio > departamento.
export async function getDestinosPorZona({ idDepartamento, idMunicipio, idRegion } = {}) {
  let filtro = null
  if (idRegion) filtro = where('id_region', '==', idRegion)
  else if (idMunicipio) filtro = where('id_municipio', '==', idMunicipio)
  else if (idDepartamento) filtro = where('id_departamento', '==', idDepartamento)

  const referencia = filtro ? query(collection(db, 'destinos'), filtro) : collection(db, 'destinos')
  const instantanea = await conLimiteDeTiempo(getDocs(referencia))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export function getDestinosPorDepartamento(idDepartamento) {
  return getDestinosPorZona({ idDepartamento })
}

export async function crearDestino(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'destinos'), datos))
}

export async function actualizarDestino(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'destinos', id), datos))
}

export async function eliminarDestino(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'destinos', id)))
}
