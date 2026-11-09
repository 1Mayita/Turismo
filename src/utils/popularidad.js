// Cálculos de los reportes de popularidad (panel de administración y página
// pública "Lo más popular"): visitas, reseñas y favoritos de cada destino,
// restaurante y alojamiento, agrupados por lugar y por departamento.
// Son funciones puras: reciben lo ya leído de Firestore.

export const TIPOS_DE_LUGAR = {
  destino: { id: 'destino', singular: 'destino', plural: 'Destinos', ruta: '/destinos', foto: (lugar) => lugar.imagen_principal || lugar.imagenes?.[0] },
  restaurante: { id: 'restaurante', singular: 'restaurante', plural: 'Restaurantes', ruta: '/restaurantes', foto: (lugar) => lugar.imagen_principal || lugar.imagenes?.[0] },
  alojamiento: { id: 'alojamiento', singular: 'alojamiento', plural: 'Alojamientos', ruta: '/alojamientos', foto: (lugar) => lugar.imagen_principal || lugar.imagenes?.[0] },
}

const DIA_MS = 24 * 60 * 60 * 1000

// ---------- Fechas ----------

export function aFecha(valor) {
  if (typeof valor?.toDate === 'function') return valor.toDate()
  if (valor instanceof Date) return valor
  if (typeof valor === 'number' || typeof valor === 'string') return new Date(valor)
  return null
}

export function isoDe(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function desdeISO(texto, finDelDia = false) {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return finDelDia ? new Date(anio, mes - 1, dia, 23, 59, 59) : new Date(anio, mes - 1, dia)
}

// Agrupa fechas por día, semana o mes según el largo del rango, con todos
// los períodos del rango (también los que tienen 0).
export function porPeriodo(fechas, desde, hasta) {
  const dias = Math.max(1, Math.round((hasta - desde) / DIA_MS))
  const unidad = dias <= 31 ? 'dia' : dias <= 182 ? 'semana' : 'mes'
  const claveDe = (fecha) => {
    if (unidad === 'dia') return isoDe(fecha)
    if (unidad === 'mes') return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const lunes = new Date(fecha)
    lunes.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7))
    return isoDe(lunes)
  }
  const etiquetaDe = (clave) => {
    if (unidad === 'mes') {
      const [anio, mes] = clave.split('-').map(Number)
      return new Date(anio, mes - 1, 1).toLocaleDateString('es-BO', { month: 'short', year: '2-digit' })
    }
    const texto = desdeISO(clave).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
    return unidad === 'semana' ? `Sem. ${texto}` : texto
  }
  const claves = []
  for (let cursor = new Date(desde); cursor <= hasta; cursor = new Date(cursor.getTime() + DIA_MS)) {
    const clave = claveDe(cursor)
    if (!claves.includes(clave)) claves.push(clave)
  }
  const conteo = new Map(claves.map((clave) => [clave, 0]))
  fechas.forEach((fecha) => {
    const clave = claveDe(fecha)
    if (conteo.has(clave)) conteo.set(clave, conteo.get(clave) + 1)
  })
  return { unidad, datos: claves.map((clave) => ({ clave, etiqueta: etiquetaDe(clave), valor: conteo.get(clave) })) }
}

// ---------- Indicadores por lugar ----------

// Indicadores de cada lugar de un tipo:
//   Map id → { visitas, resenas, promedio (o null), favoritos }
//   visitas: lista de visitas [{ tipo_elemento, id_elemento }] o, en la página
//            pública, el objeto de contadores { 'tipo:id': total }.
//   resenas: [{ tipo_elemento, id_elemento, calificacion, estado }]
//   favoritos: [{ tipo, id }] ya normalizados (opcional).
export function indicadoresPorLugar(tipo, lugares, { visitas = [], resenas = [], favoritos = [] } = {}) {
  const mapa = new Map(lugares.map((lugar) => [lugar.id, { visitas: 0, resenas: 0, suma: 0, promedio: null, favoritos: 0 }]))
  if (Array.isArray(visitas)) {
    visitas.forEach((visita) => {
      if (visita.tipo_elemento === tipo && mapa.has(visita.id_elemento)) mapa.get(visita.id_elemento).visitas += 1
    })
  } else {
    mapa.forEach((indicador, id) => {
      indicador.visitas = visitas[`${tipo}:${id}`] || 0
    })
  }
  resenas.forEach((resena) => {
    if (resena.tipo_elemento !== tipo || resena.estado === 'oculta' || !mapa.has(resena.id_elemento)) return
    const indicador = mapa.get(resena.id_elemento)
    indicador.resenas += 1
    indicador.suma += Number(resena.calificacion) || 0
  })
  favoritos.forEach((favorito) => {
    if (favorito.tipo === tipo && mapa.has(favorito.id)) mapa.get(favorito.id).favoritos += 1
  })
  mapa.forEach((indicador) => {
    indicador.promedio = indicador.resenas > 0 ? indicador.suma / indicador.resenas : null
  })
  return mapa
}

// Lugares que están en la zona elegida (departamento y, si se indica, municipio).
export function enZona(lugares, { idDepartamento = '', idMunicipio = '' } = {}) {
  return lugares.filter((lugar) => (!idDepartamento || lugar.id_departamento === idDepartamento) && (!idMunicipio || lugar.id_municipio === idMunicipio))
}

// Ranking por un indicador: [{ lugar, valor, indicador }] de mayor a menor,
// solo los que tienen valor > 0. "mejorCalificados" ordena por promedio y,
// a igual promedio, por cantidad de reseñas.
export function rankingDeLugares(lugares, indicadores, metrica, cantidad = 10) {
  return lugares
    .map((lugar) => {
      const indicador = indicadores.get(lugar.id) || { visitas: 0, resenas: 0, promedio: null, favoritos: 0 }
      const valor = metrica === 'promedio' ? indicador.promedio || 0 : indicador[metrica] || 0
      return { lugar, valor, indicador }
    })
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor || b.indicador.resenas - a.indicador.resenas || (a.lugar.nombre || '').localeCompare(b.lugar.nombre || '', 'es'))
    .slice(0, cantidad)
}

// Suma un indicador por departamento (o por municipio si "porMunicipio"):
// [{ clave, etiqueta, valor }] con TODAS las zonas, también las que tienen 0.
export function sumaPorZona(lugares, indicadores, metrica, zonas, campo = 'id_departamento') {
  const totales = new Map(zonas.map((zona) => [zona.id, 0]))
  lugares.forEach((lugar) => {
    const clave = lugar[campo]
    if (totales.has(clave)) totales.set(clave, totales.get(clave) + (indicadores.get(lugar.id)?.[metrica] || 0))
  })
  return zonas
    .map((zona) => ({ clave: zona.id, etiqueta: zona.nombre, valor: totales.get(zona.id) }))
    .sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta, 'es'))
}

// Promedio de calificación por zona (solo zonas con reseñas).
export function promedioPorZona(lugares, indicadores, zonas, campo = 'id_departamento') {
  const sumas = new Map()
  lugares.forEach((lugar) => {
    const indicador = indicadores.get(lugar.id)
    if (!indicador?.resenas) return
    const actual = sumas.get(lugar[campo]) || { suma: 0, total: 0 }
    sumas.set(lugar[campo], { suma: actual.suma + indicador.suma, total: actual.total + indicador.resenas })
  })
  return zonas
    .filter((zona) => sumas.has(zona.id))
    .map((zona) => ({ clave: zona.id, etiqueta: zona.nombre, valor: Math.round((sumas.get(zona.id).suma / sumas.get(zona.id).total) * 10) / 10, detalle: `${sumas.get(zona.id).total} reseñas` }))
    .sort((a, b) => b.valor - a.valor)
}

// Totales de los indicadores de una lista de lugares.
export function totalesDe(lugares, indicadores) {
  let visitas = 0
  let resenas = 0
  let suma = 0
  let favoritos = 0
  lugares.forEach((lugar) => {
    const indicador = indicadores.get(lugar.id)
    if (!indicador) return
    visitas += indicador.visitas
    resenas += indicador.resenas
    suma += indicador.suma
    favoritos += indicador.favoritos
  })
  return { lugares: lugares.length, visitas, resenas, favoritos, promedio: resenas ? suma / resenas : null }
}
