import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Cada documento de "usuario_preferencias" es una categoría que el usuario
// marcó como interés: { id_usuario, id_categoria }.
export async function getPreferenciasDeUsuario(idUsuario) {
  const consulta = query(collection(db, 'usuario_preferencias'), where('id_usuario', '==', idUsuario))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Deja en Firestore exactamente las categorías indicadas: agrega las nuevas
// y elimina las que el usuario desmarcó.
export async function guardarPreferenciasDeUsuario(idUsuario, idsCategorias) {
  const actuales = await getPreferenciasDeUsuario(idUsuario)
  const idsActuales = actuales.map((preferencia) => preferencia.id_categoria)

  const eliminaciones = actuales
    .filter((preferencia) => !idsCategorias.includes(preferencia.id_categoria))
    .map((preferencia) => deleteDoc(doc(db, 'usuario_preferencias', preferencia.id)))

  const altas = idsCategorias
    .filter((idCategoria) => !idsActuales.includes(idCategoria))
    .map((idCategoria) => addDoc(collection(db, 'usuario_preferencias'), { id_usuario: idUsuario, id_categoria: idCategoria }))

  await conLimiteDeTiempo(Promise.all([...eliminaciones, ...altas]))
}
