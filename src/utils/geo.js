// true si latitud y longitud son números reales dentro del rango del planeta.
// Number(null) y Number('') dan 0, por eso se descartan antes de convertir.
export function coordenadasValidas(latitud, longitud) {
  const lat = Number(latitud)
  const lon = Number(longitud)
  return latitud !== null && latitud !== undefined && latitud !== ''
    && longitud !== null && longitud !== undefined && longitud !== ''
    && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

// Distancia en línea recta (fórmula del haversine) entre la ubicación del
// usuario { latitud, longitud } y un lugar con esos mismos campos.
// Devuelve null si el lugar no tiene coordenadas.
export function distanciaEnKm(origen, lugar) {
  if (!coordenadasValidas(lugar.latitud, lugar.longitud)) return null
  const radianes = (grados) => grados * (Math.PI / 180)
  const deltaLatitud = radianes(Number(lugar.latitud) - origen.latitud)
  const deltaLongitud = radianes(Number(lugar.longitud) - origen.longitud)
  const a = Math.sin(deltaLatitud / 2) ** 2
    + Math.cos(radianes(origen.latitud)) * Math.cos(radianes(Number(lugar.latitud)))
    * Math.sin(deltaLongitud / 2) ** 2
  const segura = Math.min(1, Math.max(0, a))
  return 6371 * 2 * Math.atan2(Math.sqrt(segura), Math.sqrt(1 - segura))
}

// Estimación sencilla del viaje por tierra entre dos puntos a partir de la
// distancia en línea recta: las carreteras suman cerca de un 30 % de recorrido
// y se calcula a unos 50 km/h de promedio. Es solo orientativa.
const FACTOR_CARRETERA = 1.3
const VELOCIDAD_PROMEDIO_KMH = 50

export function estimarTrayecto(distanciaLineaRectaKm) {
  const kmPorCarretera = distanciaLineaRectaKm * FACTOR_CARRETERA
  const minutos = Math.round((kmPorCarretera / VELOCIDAD_PROMEDIO_KMH) * 60)
  return { kmPorCarretera, minutos }
}

export function formatearDuracion(minutos) {
  if (minutos < 60) return `${Math.max(minutos, 5)} min`
  const horas = Math.floor(minutos / 60)
  const resto = Math.round((minutos % 60) / 5) * 5
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}

// Pide la ubicación al navegador. Resuelve con { latitud, longitud } o
// rechaza con un Error cuyo mensaje ya está listo para mostrar al usuario.
export function obtenerUbicacionDelUsuario() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no permite consultar la ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitud: coords.latitude, longitud: coords.longitude }),
      (errorGeolocalizacion) => {
        const mensajes = {
          1: 'No se autorizó el acceso a la ubicación. Puedes permitirlo en los permisos de la app o del navegador.',
          2: 'No se pudo determinar tu ubicación. Inténtalo de nuevo.',
          3: 'La consulta de ubicación tardó demasiado. Inténtalo de nuevo.',
        }
        reject(new Error(mensajes[errorGeolocalizacion.code] || 'No se pudo obtener tu ubicación.'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  })
}
