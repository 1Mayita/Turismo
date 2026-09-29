import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// fecha_inicio y fecha_fin se guardan como texto "AAAA-MM-DD", que se ordena
// igual que las fechas y se compara directo con la fecha de hoy.
export function fechaHoyISO() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

// new Date("2026-10-05") se interpreta en UTC y en Bolivia mostraría el día
// anterior, por eso se arma la fecha local a mano.
export function formatearFechaEvento(fechaISO, opciones = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!fechaISO) return ''
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-BO', opciones)
}

export async function getEventos() {
  const consulta = query(collection(db, 'eventos'), orderBy('fecha_inicio', 'asc'))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Un evento sigue siendo "próximo" mientras no haya terminado (incluye los
// que están en curso). Se filtra en el cliente para no requerir un índice
// compuesto de fecha_fin + fecha_inicio.
export async function getEventosProximos() {
  const hoy = fechaHoyISO()
  const eventos = await getEventos()
  return eventos.filter((evento) => (evento.fecha_fin || evento.fecha_inicio) >= hoy)
}

export async function crearEvento(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, 'eventos'), datos))
}

export async function actualizarEvento(id, datos) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'eventos', id), datos))
}

export async function eliminarEvento(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, 'eventos', id)))
}
