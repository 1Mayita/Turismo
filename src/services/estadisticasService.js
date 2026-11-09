import { Timestamp, addDoc, collection, doc, getDocs, increment, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore'
import { db } from './firebase.js'
import { SOLO_EJEMPLOS } from './coleccion.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Visitas a la ficha de cada lugar, para los reportes de "más visitados".
//
//   visitas/{id}                     una por visita, con fecha (solo la lee el administrador)
//     tipo_elemento ('destino' | 'restaurante' | 'alojamiento'), id_elemento,
//     id_usuario (o null si no inició sesión), fecha.
//     Las visitas antiguas de destinos solo tienen { id_destino }.
//
//   contadores_visitas/{tipo}_{id}   total acumulado, lo puede leer cualquiera
//     tipo_elemento, id_elemento, total
//     Así los turistas ven "lo más visitado" sin acceder a las visitas
//     individuales (que dicen quién visitó qué).

export const TIPOS_CON_VISITAS = ['destino', 'restaurante', 'alojamiento']
const MINUTOS_SIN_REPETIR = 30

export function tipoDeVisita(visita) {
  return visita.tipo_elemento || 'destino'
}

export function idElementoDeVisita(visita) {
  return visita.id_elemento || visita.id_destino
}

function idContador(tipo, idElemento) {
  return `${tipo}_${idElemento}`
}

// Registra una visita, salvo que la misma persona haya abierto ese lugar en
// los últimos 30 minutos en este navegador (así una recarga no cuenta doble).
export async function registrarVisita(tipo, idElemento, idUsuario = null) {
  if (SOLO_EJEMPLOS || !idElemento || !TIPOS_CON_VISITAS.includes(tipo)) return

  const clave = `visita:${tipo}:${idElemento}`
  try {
    const ultima = Number(sessionStorage.getItem(clave) || 0)
    if (Date.now() - ultima < MINUTOS_SIN_REPETIR * 60 * 1000) return
    sessionStorage.setItem(clave, String(Date.now()))
  } catch {
    // Sin sessionStorage (modo privado estricto) se registra igual.
  }
  try {
    await conLimiteDeTiempo(addDoc(collection(db, 'visitas'), { tipo_elemento: tipo, id_elemento: idElemento, id_usuario: idUsuario || null, fecha: serverTimestamp() }))
    await conLimiteDeTiempo(setDoc(doc(db, 'contadores_visitas', idContador(tipo, idElemento)), { tipo_elemento: tipo, id_elemento: idElemento, total: increment(1) }, { merge: true }))
  } catch (error) {
    // Una visita no registrada no debe molestar a quien navega.
    console.warn('No se pudo registrar la visita:', error.code || error.message)
  }
}

// Visitas desde una fecha (Date) o todas. Solo para administradores.
export async function getVisitas(desde) {
  const referencia = desde
    ? query(collection(db, 'visitas'), where('fecha', '>=', Timestamp.fromDate(desde)))
    : collection(db, 'visitas')
  const instantanea = await conLimiteDeTiempo(getDocs(referencia), 20000)
  return instantanea.docs.map((documento) => {
    const datos = documento.data()
    return { id: documento.id, ...datos, tipo_elemento: tipoDeVisita(datos), id_elemento: idElementoDeVisita(datos) }
  })
}

// Totales públicos: { 'destino:salar-de-uyuni': 120, ... }
export async function getContadoresDeVisitas() {
  if (SOLO_EJEMPLOS) return {}
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'contadores_visitas')))
  return Object.fromEntries(instantanea.docs.map((documento) => {
    const { tipo_elemento: tipo, id_elemento: id, total } = documento.data()
    return [`${tipo}:${id}`, Number(total) || 0]
  }))
}

// Recalcula los contadores públicos a partir de las visitas (que son la
// fuente de verdad), por ejemplo para incluir las visitas anteriores a los
// contadores. Solo escribe los que cambiaron. Solo para administradores.
export async function sincronizarContadores(visitas, contadores) {
  const reales = new Map()
  visitas.forEach((visita) => {
    const clave = `${tipoDeVisita(visita)}:${idElementoDeVisita(visita)}`
    reales.set(clave, (reales.get(clave) || 0) + 1)
  })
  const distintos = [...reales.entries()].filter(([clave, total]) => contadores[clave] !== total)
  for (let inicio = 0; inicio < distintos.length; inicio += 400) {
    const lote = writeBatch(db)
    distintos.slice(inicio, inicio + 400).forEach(([clave, total]) => {
      const [tipo, ...resto] = clave.split(':')
      const id = resto.join(':')
      lote.set(doc(db, 'contadores_visitas', idContador(tipo, id)), { tipo_elemento: tipo, id_elemento: id, total })
    })
    await conLimiteDeTiempo(lote.commit(), 20000)
  }
  return distintos.length
}

// Todos los favoritos de todos los usuarios. Solo para administradores.
export async function getTodosLosFavoritos() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'favoritos')), 20000)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}
