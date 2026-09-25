import { get, push, ref, remove, serverTimestamp, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

function aLista(instantanea) {
  const datos = instantanea.val() || {}
  return Object.entries(datos).map(([id, resena]) => ({ id, ...resena }))
}

function validarCalificacion(calificacion) {
  const valor = Number(calificacion)
  if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
    throw new Error('La calificación debe ser un número entero del 1 al 5.')
  }
  return valor
}

export async function getResenasDestino(destinoId) {
  if (!destinoId) return []
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'resenas')))
  return aLista(instantanea).filter((resena) => resena.destinoId === destinoId)
}

export async function getResumenCalificaciones(destinoId) {
  const resenas = await getResenasDestino(destinoId)
  const total = resenas.reduce((suma, resena) => suma + Number(resena.calificacion || 0), 0)
  return {
    cantidad: resenas.length,
    promedio: resenas.length ? Math.round((total / resenas.length) * 10) / 10 : 0,
  }
}

export async function crearResena({ destinoId, usuarioId, usuarioNombre = '', calificacion, comentario = '' }) {
  if (!destinoId || !usuarioId) throw new Error('Falta el destino o el usuario de la reseña.')
  const texto = String(comentario).trim()
  if (texto.length > 1000) throw new Error('La reseña no puede superar los 1000 caracteres.')

  const nuevaResena = {
    destinoId,
    usuarioId,
    usuarioNombre: String(usuarioNombre).trim(),
    calificacion: validarCalificacion(calificacion),
    comentario: texto,
    fecha: serverTimestamp(),
  }
  const referencia = await conLimiteDeTiempo(push(ref(db, 'resenas'), nuevaResena))
  return referencia.key
}

export async function actualizarResena(resenaId, usuarioId, cambios) {
  if (!resenaId || !usuarioId) throw new Error('Falta la reseña o el usuario.')
  const referencia = ref(db, `resenas/${resenaId}`)
  const instantanea = await conLimiteDeTiempo(get(referencia))
  if (!instantanea.exists()) throw new Error('No encontramos la reseña.')
  if (instantanea.val().usuarioId !== usuarioId) throw new Error('Solo puedes editar tu propia reseña.')

  const actualizacion = {}
  if (cambios.calificacion != null) actualizacion.calificacion = validarCalificacion(cambios.calificacion)
  if (cambios.comentario != null) {
    const comentario = String(cambios.comentario).trim()
    if (comentario.length > 1000) throw new Error('La reseña no puede superar los 1000 caracteres.')
    actualizacion.comentario = comentario
  }
  if (Object.keys(actualizacion).length === 0) return
  actualizacion.fechaActualizacion = serverTimestamp()
  await conLimiteDeTiempo(update(referencia, actualizacion))
}

export async function eliminarResena(resenaId, usuarioId) {
  if (!resenaId || !usuarioId) throw new Error('Falta la reseña o el usuario.')
  const referencia = ref(db, `resenas/${resenaId}`)
  const instantanea = await conLimiteDeTiempo(get(referencia))
  if (!instantanea.exists()) return
  if (instantanea.val().usuarioId !== usuarioId) throw new Error('Solo puedes eliminar tu propia reseña.')
  await conLimiteDeTiempo(remove(referencia))
}
