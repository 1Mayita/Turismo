import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export { categoriasDeEjemplo } from './datosDeEjemplo.js'

export async function getCategorias() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'categorias')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Los destinos guardan el nombre de la categoría en el campo "categoria".
export async function getDestinosPorCategoria(nombreCategoria) {
  const consulta = query(collection(db, 'destinos'), where('categoria', '==', nombreCategoria))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function crearCategoria(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'categorias'), datos))
}

export async function actualizarCategoria(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'categorias', id), datos))
}

export async function eliminarCategoria(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'categorias', id)))
}
