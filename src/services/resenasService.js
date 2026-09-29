import { addDoc, average, collection, count, getAggregateFromServer, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

const COLECCION_RESENAS = 'reseñas'

// Caché de getResumenCalificaciones(); crearResena la invalida.
let resumenEnCache = null

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

// datos: { id_usuario, nombre_usuario, id_destino, calificacion, comentario }
export async function crearResena(datos) {
  await conLimiteDeTiempo(addDoc(collection(db, COLECCION_RESENAS), {
    ...datos,
    calificacion: Number(datos.calificacion),
    fecha: serverTimestamp(),
  }))
  resumenEnCache = null
}

// Se ordena en el cliente (más reciente primero) para no necesitar un índice
// compuesto de id_destino + fecha en Firestore.
export async function getResenasPorDestino(idDestino) {
  const consulta = query(collection(db, COLECCION_RESENAS), where('id_destino', '==', idDestino))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
}

// Firestore calcula el promedio y el conteo sin descargar las reseñas.
export async function getPromedioCalificacion(idDestino) {
  const consulta = query(collection(db, COLECCION_RESENAS), where('id_destino', '==', idDestino))
  const resultado = await conLimiteDeTiempo(getAggregateFromServer(consulta, {
    promedio: average('calificacion'),
    total: count(),
  }))
  const { promedio, total } = resultado.data()
  return { promedio: promedio ?? 0, total }
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
          const { id_destino: idDestino, calificacion } = documento.data()
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
