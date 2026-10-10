import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

const COLECCION_RESENAS = 'reseñas'

// Se pueden reseñar destinos, restaurantes y alojamientos.
//   - Destino:               { id_destino }                    (formato original)
//   - Restaurante/alojamiento: { tipo_elemento, id_elemento }
const TIPOS_VALIDOS = ['destino', 'restaurante', 'alojamiento']

// Caché de getResumenCalificaciones(); las escrituras de reseñas la invalidan.
let resumenEnCache = null

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

function tipoDeResena(resena) {
  return resena.tipo_elemento || 'destino'
}

function idElementoDeResena(resena) {
  return resena.id_elemento || resena.id_destino
}

// Clave con la que el resumen de calificaciones identifica cada lugar. Los
// destinos usan su id a secas para no romper lo que ya funcionaba.
export function claveDeCalificacion(tipo, idElemento) {
  return tipo === 'destino' ? idElemento : `${tipo}:${idElemento}`
}

async function leerResenasDe(tipo, idElemento) {
  if (!TIPOS_VALIDOS.includes(tipo)) throw new Error(`Tipo de reseña no válido: ${tipo}`)
  const campo = tipo === 'destino' ? 'id_destino' : 'id_elemento'
  const consulta = query(collection(db, COLECCION_RESENAS), where(campo, '==', idElemento))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .filter((resena) => tipoDeResena(resena) === tipo && resena.estado !== 'oculta')
}

// datos: { id_usuario, nombre_usuario, calificacion, comentario } más
// { id_destino } o { tipo_elemento, id_elemento }.
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
  return instantanea.docs.map((documento) => {
    const datos = documento.data()
    return { id: documento.id, ...datos, tipo_elemento: tipoDeResena(datos), id_elemento: idElementoDeResena(datos) }
  })
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

// Reseñas publicadas de un lugar, de la más reciente a la más antigua. Se
// ordena en el cliente para no necesitar un índice compuesto en Firestore.
export async function getResenasDe(tipo, idElemento) {
  const resenas = await leerResenasDe(tipo, idElemento)
  return resenas.sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
}

export async function getPromedioDe(tipo, idElemento) {
  const resenas = await leerResenasDe(tipo, idElemento)
  const total = resenas.length
  const suma = resenas.reduce((acumulado, resena) => acumulado + (Number(resena.calificacion) || 0), 0)
  return { promedio: total ? suma / total : 0, total }
}

// Reseñas que escribió una persona (para recomendaciones y estadísticas).
export async function getResenasDeUsuario(idUsuario) {
  const consulta = query(collection(db, COLECCION_RESENAS), where('id_usuario', '==', idUsuario))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export function getResenasPorDestino(idDestino) {
  return getResenasDe('destino', idDestino)
}

export function getPromedioCalificacion(idDestino) {
  return getPromedioDe('destino', idDestino)
}

// Resumen { [clave]: { promedio, total } } de todos los lugares en una sola
// lectura, para las tarjetas y los filtros de valoración. La clave sale de
// claveDeCalificacion(). Se cachea para que todas las tarjetas compartan la
// misma consulta.
export function getResumenCalificaciones() {
  if (!resumenEnCache) {
    resumenEnCache = conLimiteDeTiempo(getDocs(collection(db, COLECCION_RESENAS)))
      .then((instantanea) => {
        const sumas = {}
        instantanea.docs.forEach((documento) => {
          const resena = documento.data()
          if (resena.estado === 'oculta') return
          const clave = claveDeCalificacion(tipoDeResena(resena), idElementoDeResena(resena))
          sumas[clave] ??= { suma: 0, total: 0 }
          sumas[clave].suma += Number(resena.calificacion) || 0
          sumas[clave].total += 1
        })
        return Object.fromEntries(Object.entries(sumas).map(([clave, { suma, total }]) => [
          clave,
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
