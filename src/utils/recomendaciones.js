// Recomendaciones simples y explicables, sin aprendizaje automático.
// Cada destino suma puntos por cada señal del usuario y guarda el motivo
// más fuerte para mostrarlo ("Porque te gusta la naturaleza").
//
//   +3  su categoría está entre las preferencias del perfil
//   +2  su categoría coincide con destinos que guardó en favoritos
//   +1  está en un departamento que ya le interesa (favoritos o reseñas de 4-5★)
//   +0 a 1.5  popularidad (promedio de reseñas, pesado por cantidad)
//   +0.5  destacado por el equipo
//
// Se excluyen los destinos que ya guardó o reseñó. Si el usuario no tiene
// ninguna señal, la lista queda ordenada solo por popularidad.

function departamentoDe(destino) {
  return destino.ubicacion?.split(',').pop()?.trim() || ''
}

function popularidad(resumenDestino) {
  if (!resumenDestino?.total) return 0
  return (resumenDestino.promedio / 5) * Math.min(resumenDestino.total, 10) / 10 * 1.5
}

export function calcularRecomendaciones({ destinos, categoriasPreferidas = [], idsFavoritos = [], misResenas = [], resumen = {} }) {
  const favoritos = destinos.filter((destino) => idsFavoritos.includes(destino.id))
  const categoriasDeFavoritos = new Set(favoritos.map((destino) => destino.categoria).filter(Boolean))
  const reseñadosBien = misResenas.filter((resena) => Number(resena.calificacion) >= 4).map((resena) => resena.id_destino)
  const idsReseñados = new Set(misResenas.map((resena) => resena.id_destino))
  const departamentosDeInteres = new Set([
    ...favoritos.map(departamentoDe),
    ...destinos.filter((destino) => reseñadosBien.includes(destino.id)).map(departamentoDe),
  ].filter(Boolean))
  const preferidas = new Set(categoriasPreferidas)
  const esPersonalizada = preferidas.size > 0 || categoriasDeFavoritos.size > 0 || departamentosDeInteres.size > 0

  const puntuados = destinos
    .filter((destino) => destino.id && !idsFavoritos.includes(destino.id) && !idsReseñados.has(destino.id))
    .map((destino) => {
      const motivos = []
      let puntaje = 0
      if (preferidas.has(destino.categoria)) {
        puntaje += 3
        motivos.push(`Porque te gusta: ${destino.categoria.toLocaleLowerCase('es')}`)
      }
      if (categoriasDeFavoritos.has(destino.categoria)) {
        puntaje += 2
        motivos.push('Parecido a lugares que guardaste')
      }
      const departamento = departamentoDe(destino)
      if (departamentosDeInteres.has(departamento)) {
        puntaje += 1
        motivos.push(`En ${departamento}, que ya te interesa`)
      }
      const puntosPopularidad = popularidad(resumen[destino.id])
      puntaje += puntosPopularidad + (destino.destacado ? 0.5 : 0)
      if (motivos.length === 0) motivos.push(puntosPopularidad > 0.6 ? 'Muy bien valorado por viajeros' : 'Destacado en Bolivia')
      return { destino, puntaje, motivo: motivos[0], coincide: motivos.length > 0 && puntaje >= 1 }
    })
    .sort((a, b) => b.puntaje - a.puntaje || a.destino.nombre.localeCompare(b.destino.nombre, 'es'))

  return { esPersonalizada, recomendaciones: puntuados }
}
