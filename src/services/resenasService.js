import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

const COLECCION_RESENAS = 'reseñas'

// Caché de getResumenCalificaciones(); las escrituras de reseñas la invalidan.
let resumenEnCache = null

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

// datos: { id_usuario, nombre_usuario, id_destino, calificacion, comentario }
export async function crearResena(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, COLECCION_RESENAS), {
    ...datos,
    calificacion: Number(datos.calificacion),
    estado: 'publicada',
    fecha: serverTimestamp(),
  }))
  resumenEnCache = null
}

export async function getTodasLasResenas() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, COLECCION_RESENAS)))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function actualizarEstadoResena(id, estado) {
  if (!['publicada', 'oculta'].includes(estado)) {
    throw new Error(`Estado de reseña no válido: ${estado}`)
  }
  await conLimiteDeTiempo(updateDoc(doc(db, COLECCION_RESENAS, id), { estado }))
  resumenEnCache = null
}

export async function eliminarResena(id) {
  await conLimiteDeTiempo(deleteDoc(doc(db, COLECCION_RESENAS, id)))
  resumenEnCache = null
}

// Se ordena en el cliente (más reciente primero) para no necesitar un índice
// compuesto de id_destino + fecha en Firestore.
export async function getResenasPorDestino(idDestino) {
  const consulta = query(collection(db, COLECCION_RESENAS), where('id_destino', '==', idDestino))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .filter((resena) => resena.estado !== 'oculta')
    .sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
}

// Se filtran reseñas ocultas en el cliente para incluir también documentos
// antiguos que todavía no tienen el campo "estado".
export async function getPromedioCalificacion(idDestino) {
  const consulta = query(collection(db, COLECCION_RESENAS), where('id_destino', '==', idDestino))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  const publicadas = instantanea.docs
    .map((documento) => documento.data())
    .filter((resena) => resena.estado !== 'oculta')
  const total = publicadas.length
  const suma = publicadas.reduce((acumulado, resena) => acumulado + (Number(resena.calificacion) || 0), 0)
  return { promedio: total ? suma / total : 0, total }
}

// Resumen { [idDestino]: { promedio, total } } de todos los destinos en una sola
// lectura, para las tarjetas del catálogo y el filtro de valoración mínima.
// Se cachea para que todas las tarjetas compartan la misma consulta.
export function getResumenCalificaciones() {
  if (!resumenEnCache) {
    resumenEnCache = conLimiteDeTiempo(getDocs(collection(db, COLECCION_RESENAS)))
      .then((instantanea) => {
        const sumas = {}
        instantanea.docs.forEach((documento) => {
          const { id_destino: idDestino, calificacion, estado } = documento.data()
          if (estado === 'oculta') return
          sumas[idDestino] ??= { suma: 0, total: 0 }
          sumas[idDestino].suma += Number(calificacion) || 0
          sumas[idDestino].total += 1
        })
        return Object.fromEntries(Object.entries(sumas).map(([idDestino, { suma, total }]) => [
          idDestino,
          { promedio: suma / total, total },
        ]))
      })
      .catch((error) => {
        resumenEnCache = null
        throw error
      })
  }
  return resumenEnCache
}
