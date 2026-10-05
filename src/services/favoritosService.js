import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

const TIPOS_VALIDOS = new Set(['destino', 'restaurante', 'alojamiento', 'actividad'])

export function tipoDeFavorito(favorito) {
  return favorito.tipo_favorito || 'destino'
}

export function idElementoDeFavorito(favorito) {
  return favorito.id_elemento || favorito.id_destino
}

export function claveFavorito(tipo, idElemento) {
  return `${tipo}:${idElemento}`
}

function idDocumentoFavorito(idUsuario, idElemento, tipo) {
  // Mantiene las IDs originales de destinos para no duplicar los favoritos previos.
  return tipo === 'destino'
    ? `${idUsuario}_${idElemento}`
    : `${idUsuario}_${tipo}_${idElemento}`
}

function validarTipo(tipo) {
  if (!TIPOS_VALIDOS.has(tipo)) throw new Error(`Tipo de favorito no válido: ${tipo}`)
}

export async function agregarFavorito(idUsuario, idElemento, tipo = 'destino') {
  validarTipo(tipo)
  const referencia = doc(db, 'favoritos', idDocumentoFavorito(idUsuario, idElemento, tipo))
  await conLimiteDeTiempo(setDoc(referencia, {
    id_usuario: idUsuario,
    tipo_favorito: tipo,
    id_elemento: idElemento,
    ...(tipo === 'destino' ? { id_destino: idElemento } : {}),
    fecha: serverTimestamp(),
  }))
}

export async function quitarFavorito(idUsuario, idElemento, tipo = 'destino') {
  validarTipo(tipo)
  await conLimiteDeTiempo(deleteDoc(doc(db, 'favoritos', idDocumentoFavorito(idUsuario, idElemento, tipo))))
}

export async function esFavorito(idUsuario, idElemento, tipo = 'destino') {
  validarTipo(tipo)
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'favoritos', idDocumentoFavorito(idUsuario, idElemento, tipo))))
  return documento.exists()
}

export async function getFavoritosDeUsuario(idUsuario) {
  const consulta = query(collection(db, 'favoritos'), where('id_usuario', '==', idUsuario))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => {
    const datos = documento.data()
    return {
      id: documento.id,
      ...datos,
      tipo_favorito: tipoDeFavorito(datos),
      id_elemento: idElementoDeFavorito(datos),
    }
  })
}
