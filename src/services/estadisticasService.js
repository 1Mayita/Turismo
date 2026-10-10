import { Timestamp, addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { SOLO_EJEMPLOS } from './coleccion.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Visitas al detalle de cada destino (colección "visitas") para la estadística
// de "más visitados" (HU-36). Cada visita es un documento { id_destino, fecha,
// id_usuario (o null si no inició sesión) }. Las reglas solo permiten crearlas
// con esos campos y solo el administrador puede leerlas.

const MINUTOS_SIN_REPETIR = 30

// Registra una visita, salvo que la misma persona haya abierto ese destino en
// los últimos 30 minutos en este navegador (así una recarga no cuenta doble).
export async function registrarVisita(idDestino, idUsuario = null) {
  if (SOLO_EJEMPLOS || !idDestino) return
  const clave = `visita:${idDestino}`
  try {
    const ultima = Number(sessionStorage.getItem(clave) || 0)
    if (Date.now() - ultima < MINUTOS_SIN_REPETIR * 60 * 1000) return
    sessionStorage.setItem(clave, String(Date.now()))
  } catch {
    // Sin sessionStorage (modo privado estricto) se registra igual.
  }
  try {
    await conLimiteDeTiempo(addDoc(collection(db, 'visitas'), { id_destino: idDestino, id_usuario: idUsuario, fecha: serverTimestamp() }))
  } catch (error) {
    // Una visita no registrada no debe molestar a quien navega.
    console.warn('No se pudo registrar la visita:', error.code || error.message)
  }
}

// Visitas desde una fecha (Date) o todas. Solo para administradores.
export async function getVisitas(desde) {
  const referencia = desde
    ? query(collection(db, 'visitas'), where('fecha', '>=', Timestamp.fromDate(desde)))
    : collection(db, 'visitas')
  const instantanea = await conLimiteDeTiempo(getDocs(referencia), 20000)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Todos los favoritos de todos los usuarios. Solo para administradores.
export async function getTodosLosFavoritos() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'favoritos')), 20000)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}
