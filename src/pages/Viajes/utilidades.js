import { formatearFechaEvento } from '../../services/eventosService.js'
import { coordenadasValidas, distanciaEnKm, estimarTrayecto } from '../../utils/geo.js'

// "12 oct – 15 oct 2026", "Desde el 12 oct 2026" o "Sin fechas".
export function textoDeFechas(viaje) {
  const { fecha_inicio: inicio, fecha_fin: fin } = viaje
  if (inicio && fin && inicio !== fin) return `${formatearFechaEvento(inicio, { day: 'numeric', month: 'short' })} – ${formatearFechaEvento(fin)}`
  if (inicio) return `Desde el ${formatearFechaEvento(inicio)}`
  if (fin) return `Hasta el ${formatearFechaEvento(fin)}`
  return 'Sin fechas'
}

// Cruza las paradas con los destinos: [{ parada, destino (o null si se eliminó) }].
export function paradasConDestino(paradas, destinos) {
  const porId = new Map(destinos.map((destino) => [destino.id, destino]))
  return (paradas || []).map((parada) => ({ parada, destino: porId.get(parada.id_destino) || null }))
}

// Tramo desde la parada anterior que tenga coordenadas: { km, kmPorCarretera, minutos } o null.
export function calcularTramos(items) {
  let anterior = null
  return items.map(({ destino }) => {
    const tieneCoordenadas = destino && coordenadasValidas(destino.latitud, destino.longitud)
    if (!tieneCoordenadas) return null
    const lugar = { latitud: Number(destino.latitud), longitud: Number(destino.longitud) }
    const tramo = anterior ? { km: distanciaEnKm(anterior, lugar), ...estimarTrayecto(distanciaEnKm(anterior, lugar)) } : null
    anterior = lugar
    return tramo
  })
}
