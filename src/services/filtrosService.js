import { buscarEnDestinos } from './busquedaService.js'

// Aplica solo los filtros recibidos; los que estén vacíos no cambian la lista.
export function filtrarDestinos(destinos, filtros = {}) {
  let resultado = [...destinos]

  const categoria = String(filtros.categoria ?? '').trim()
  if (categoria && categoria !== 'Todas') {
    resultado = resultado.filter((destino) => destino.categoria === categoria)
  }

  const ubicacion = String(filtros.ubicacion ?? filtros.departamento ?? '').trim()
  if (ubicacion) {
    resultado = resultado.filter((destino) => destino.ubicacion === ubicacion)
  }

  const precioMaximo = Number(filtros.precioMaximo)
  if (filtros.precioMaximo !== '' && filtros.precioMaximo != null && Number.isFinite(precioMaximo)) {
    resultado = resultado.filter((destino) => Number(destino.precio_entrada || 0) <= precioMaximo)
  }

  if (filtros.soloGratis) {
    resultado = resultado.filter((destino) => Number(destino.precio_entrada || 0) === 0)
  }

  if (filtros.soloDestacados) {
    resultado = resultado.filter((destino) => destino.destacado === true)
  }

  if (filtros.texto) {
    resultado = buscarEnDestinos(resultado, filtros.texto)
  }

  return resultado
}
