import { get, ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export async function getUsuarioPorId(uid) {
  const instantanea = await conLimiteDeTiempo(get(ref(db, `usuarios/${uid}`)))
  return instantanea.exists() ? { id: uid, ...instantanea.val() } : null
}

// Crea el documento de perfil la primera vez (en el registro o si no existía aún).
export async function crearUsuario(uid, datos) {
  await conLimiteDeTiempo(set(ref(db, `usuarios/${uid}`), {
    telefono: '',
    fotoUrl: '',
    preferencias: [],
    activo: true,
    fechaRegistro: serverTimestamp(),
    ...datos,
  }))
}

export async function actualizarUsuario(uid, datos) {
  await conLimiteDeTiempo(update(ref(db, `usuarios/${uid}`), datos))
}

export async function getUsuarios() {
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'usuarios')))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

export async function cambiarEstadoUsuario(uid, activo) {
  await conLimiteDeTiempo(update(ref(db, `usuarios/${uid}`), { activo }))
}
