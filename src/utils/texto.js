// Minúsculas y sin tildes, para comparar textos como los escribiría cualquiera.
export function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es')
}

// true si TODAS las palabras de la consulta aparecen en alguno de los textos.
// Así "hotel uyuni" encuentra un hotel cuyo nombre y ubicación están en campos distintos.
export function coincideConBusqueda(textos, consulta) {
  const contenido = normalizar([].concat(textos).flat().filter(Boolean).join(' '))
  return normalizar(consulta).split(/\s+/).filter(Boolean).every((termino) => contenido.includes(termino))
}
