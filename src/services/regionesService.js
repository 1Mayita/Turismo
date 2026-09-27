import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export { regionesDeEjemplo } from './datosDeEjemplo.js'

// Firestore limita el operador "in" a 30 valores por consulta.
const MAXIMO_VALORES_IN = 30

export async function getRegiones() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'regiones')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function getRegionesPorMunicipio(idMunicipio) {
  const consulta = query(collection(db, 'regiones'), where('id_municipio', '==', idMunicipio))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Trae las regiones de varios municipios a la vez (ej. todos los de un departamento).
export async function getRegionesPorMunicipios(idsMunicipios) {
  const grupos = []
  for (let inicio = 0; inicio < idsMunicipios.length; inicio += MAXIMO_VALORES_IN) {
    grupos.push(idsMunicipios.slice(inicio, inicio + MAXIMO_VALORES_IN))
  }
  const instantaneas = await conLimiteDeTiempo(Promise.all(
    grupos.map((grupo) => getDocs(query(collection(db, 'regiones'), where('id_municipio', 'in', grupo)))),
  ))
  return instantaneas.flatMap((instantanea) =>
    instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() })),
  )
}

export async function crearRegion(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'regiones'), datos))
}

export async function actualizarRegion(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'regiones', id), datos))
}

export async function eliminarRegion(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'regiones', id)))
}
