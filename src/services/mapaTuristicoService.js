import { get, ref } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

function aLista(instantanea) {
  const datos = instantanea.val() || {}
  return Object.entries(datos).map(([id, destino]) => ({ id, ...destino }))
}

function coordenadasValidas(destino) {
  const latitud = Number(destino?.latitud)
  const longitud = Number(destino?.longitud)
  return Number.isFinite(latitud) && Number.isFinite(longitud) && latitud >= -90 && latitud <= 90 && longitud >= -180 && longitud <= 180
}

// Devuelve los destinos que tienen coordenadas para mostrarlos en un mapa.
export async function getDestinosParaMapa() {
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'destinos')))
  return aLista(instantanea).filter(coordenadasValidas)
}

// Crea un enlace de Google Maps usando las coordenadas o el nombre del destino.
export function crearEnlaceGoogleMaps(destino) {
  if (coordenadasValidas(destino)) {
    const latitud = Number(destino.latitud)
    const longitud = Number(destino.longitud)
    return `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`
  }

  const busqueda = [destino?.nombre, destino?.ubicacion].filter(Boolean).join(', ')
  return busqueda ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}` : ''
}
