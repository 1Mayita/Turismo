import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore'
import { crearServicio, SOLO_EJEMPLOS } from './coleccion.js'
import { eventosDeEjemplo } from './datosDeEjemplo.js'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Campos de un evento: nombre, descripcion, fecha_inicio, fecha_fin, ubicacion,
// id_departamento, latitud, longitud, imagen, cronograma [], recomendaciones.
const eventos = crearServicio('eventos', eventosDeEjemplo)

export const getEventoPorId = eventos.uno
export const crearEvento = eventos.crear
export const actualizarEvento = eventos.actualizar
export const eliminarEvento = eventos.eliminar

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

// Ordenados por fecha de inicio, del más próximo al más lejano.
export async function getEventos() {
  if (SOLO_EJEMPLOS) return [...eventosDeEjemplo].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
  const consulta = query(collection(db, 'eventos'), orderBy('fecha_inicio', 'asc'))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// Un evento sigue siendo "próximo" mientras no haya terminado (incluye los
// que están en curso). Se filtra en el cliente para no requerir un índice
// compuesto de fecha_fin + fecha_inicio.
export async function getEventosProximos() {
  const hoy = fechaHoyISO()
  const lista = await getEventos()
  return lista.filter((evento) => (evento.fecha_fin || evento.fecha_inicio) >= hoy)
}

export async function getAsistenciaEvento(idEvento, idUsuario) {
  if (SOLO_EJEMPLOS) return false
  const asistencia = await conLimiteDeTiempo(getDoc(doc(db, 'eventos', idEvento, 'asistentes', idUsuario)))
  return asistencia.exists()
}

export async function getAsistentesEvento(idEvento) {
  if (SOLO_EJEMPLOS) return []
  const consulta = await conLimiteDeTiempo(getDocs(collection(db, 'eventos', idEvento, 'asistentes')))
  return consulta.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function alternarAsistenciaEvento(idEvento, idUsuario) {
  if (SOLO_EJEMPLOS) {
    throw new Error('La inscripción a eventos requiere conexión con Firestore.')
  }
  const referenciaEvento = doc(db, 'eventos', idEvento)
  const referenciaAsistencia = doc(db, 'eventos', idEvento, 'asistentes', idUsuario)
  return conLimiteDeTiempo(runTransaction(db, async (transaccion) => {
    const [evento, asistencia] = await Promise.all([
      transaccion.get(referenciaEvento),
      transaccion.get(referenciaAsistencia),
    ])
    if (!evento.exists()) throw new Error('Este evento ya no está disponible.')

    if (asistencia.exists()) {
      transaccion.delete(referenciaAsistencia)
      transaccion.update(referenciaEvento, { asistentes_count: Math.max(0, (Number(evento.data().asistentes_count) || 0) - 1) })
      return false
    }

    const datosEvento = evento.data()
    if ((datosEvento.fecha_fin || datosEvento.fecha_inicio) < fechaHoyISO()) {
      throw new Error('Ya no puedes anotarte a un evento finalizado.')
    }
    transaccion.set(referenciaAsistencia, { id_usuario: idUsuario, fecha: serverTimestamp() })
    transaccion.update(referenciaEvento, { asistentes_count: (Number(datosEvento.asistentes_count) || 0) + 1 })
    return true
  }))
}
