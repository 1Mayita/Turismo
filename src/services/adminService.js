import { equalTo, get, orderByChild, query, ref } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Un usuario es administrador si su correo existe en "administradores".
export async function esCorreoAdministrador(email) {
  if (!email) return false
  const consulta = query(ref(db, 'administradores'), orderByChild('email'), equalTo(email))
  const instantanea = await conLimiteDeTiempo(get(consulta))
  return instantanea.exists()
}
