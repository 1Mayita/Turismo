import { get, ref, remove, set } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

function validarIds(usuarioId, destinoId) {
  if (!usuarioId) throw new Error('Debes iniciar sesión para guardar favoritos.')
  if (!destinoId) throw new Error('Falta el identificador del destino.')
}

export async function getIdsFavoritos(usuarioId) {
  if (!usuarioId) return []
  const instantanea = await conLimiteDeTiempo(get(ref(db, `favoritos/${usuarioId}`)))
  const favoritos = instantanea.val() || {}
  return Object.keys(favoritos)
}

export async function esFavorito(usuarioId, destinoId) {
  validarIds(usuarioId, destinoId)
  const instantanea = await conLimiteDeTiempo(get(ref(db, `favoritos/${usuarioId}/${destinoId}`)))
  return instantanea.exists()
}

export async function agregarFavorito(usuarioId, destinoId) {
  validarIds(usuarioId, destinoId)
  await conLimiteDeTiempo(set(ref(db, `favoritos/${usuarioId}/${destinoId}`), true))
}

export async function quitarFavorito(usuarioId, destinoId) {
  validarIds(usuarioId, destinoId)
  await conLimiteDeTiempo(remove(ref(db, `favoritos/${usuarioId}/${destinoId}`)))
}

export async function alternarFavorito(usuarioId, destinoId) {
  const yaEsFavorito = await esFavorito(usuarioId, destinoId)
  if (yaEsFavorito) {
    await quitarFavorito(usuarioId, destinoId)
    return false
  }
  await agregarFavorito(usuarioId, destinoId)
  return true
}
