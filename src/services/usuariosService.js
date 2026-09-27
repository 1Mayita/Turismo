import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export async function getUsuarioPorId(uid) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'usuarios', uid)))
  return documento.exists() ? { id: documento.id, ...documento.data() } : null
}

// Crea el documento de perfil la primera vez (en el registro o si no existía aún).
// Usa el uid de Firebase Auth como ID del documento, por eso setDoc y no addDoc.
// Las preferencias van aparte, en la colección "usuario_preferencias".
export async function crearUsuario(uid, datos) {
  await conLimiteDeTiempo(setDoc(doc(db, 'usuarios', uid), {
    telefono: '',
    fotoUrl: '',
    activo: true,
    fechaRegistro: serverTimestamp(),
    ...datos,
  }))
}

export async function actualizarUsuario(uid, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'usuarios', uid), datos))
}

export async function getUsuarios() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'usuarios')))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function cambiarEstadoUsuario(uid, activo) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'usuarios', uid), { activo }))
}
