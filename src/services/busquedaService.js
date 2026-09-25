import { getDestinos } from './destinosService.js'

export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function buscarEnDestinos(destinos, termino) {
  const consulta = normalizarTexto(termino)
  if (!consulta) return destinos

  return destinos.filter((destino) => {
    const campos = [
      destino.nombre,
      destino.descripcion,
      destino.categoria,
      destino.ubicacion,
      destino.direccion,
      destino.recomendaciones,
    ]
    return campos.some((campo) => normalizarTexto(campo).includes(consulta))
  })
}

export async function buscarDestinos(termino) {
  const destinos = await getDestinos()
  return buscarEnDestinos(destinos, termino)
}
