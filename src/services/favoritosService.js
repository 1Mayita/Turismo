import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// El ID del documento combina usuario y destino: así un destino no puede
// quedar dos veces en favoritos y esFavorito/quitarFavorito leen un solo documento.
function idFavorito(idUsuario, idDestino) {
  return `${idUsuario}_${idDestino}`
}

export async function agregarFavorito(idUsuario, idDestino) {
  await conLimiteDeTiempo(setDoc(doc(db, 'favoritos', idFavorito(idUsuario, idDestino)), {
    id_usuario: idUsuario,
    id_destino: idDestino,
    fecha: serverTimestamp(),
  }))
}

export async function quitarFavorito(idUsuario, idDestino) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'favoritos', idFavorito(idUsuario, idDestino))))
}

export async function esFavorito(idUsuario, idDestino) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'favoritos', idFavorito(idUsuario, idDestino))))
  return documento.exists()
}

export async function getFavoritosDeUsuario(idUsuario) {
  const consulta = query(collection(db, 'favoritos'), where('id_usuario', '==', idUsuario))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}
