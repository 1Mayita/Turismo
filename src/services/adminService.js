import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Un usuario es administrador si su correo existe en "administradores".
export async function esCorreoAdministrador(email) {
  if (!email) return false
  const consulta = query(collection(db, 'administradores'), where('email', '==', email))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return !instantanea.empty
}
