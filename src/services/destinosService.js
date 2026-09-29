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

// Solo filtros de igualdad: Firestore los combina sin pedir índices compuestos.
// Los rangos (precio, valoración) se aplican luego en el cliente.
export async function getDestinosFiltrados({ categoria, idDepartamento, idMunicipio, idRegion } = {}) {
  const filtros = []
  if (categoria) filtros.push(where('categoria', '==', categoria))
  if (idDepartamento) filtros.push(where('id_departamento', '==', idDepartamento))
  if (idMunicipio) filtros.push(where('id_municipio', '==', idMunicipio))
  if (idRegion) filtros.push(where('id_region', '==', idRegion))

  const instantanea = await conLimiteDeTiempo(getDocs(query(collection(db, 'destinos'), ...filtros)))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Búsqueda por prefijo: "Sal" encuentra "Salar de Uyuni". Firestore distingue
// mayúsculas, así que también se prueba con la primera letra en mayúscula
// para que "salar" encuentre "Salar".
export async function buscarDestinosPorNombre(texto) {
  const limpio = texto.trim()
  if (!limpio) return []

  const variantes = [...new Set([limpio, limpio.charAt(0).toUpperCase() + limpio.slice(1)])]
  const instantaneas = await conLimiteDeTiempo(Promise.all(variantes.map((variante) => getDocs(query(
    collection(db, 'destinos'),
    where('nombre', '>=', variante),
    where('nombre', '<=', variante + ''),
  )))))

  const porId = new Map()
  instantaneas.forEach((instantanea) => {
    instantanea.docs.forEach((documento) => porId.set(documento.id, { id: documento.id, ...documento.data() }))
  })
  return [...porId.values()]
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
