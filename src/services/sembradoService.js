import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'
import {
  actividadesDeEjemplo,
  alojamientosDeEjemplo,
  categoriasDeEjemplo,
  departamentosDeEjemplo,
  destinosDeEjemplo,
  eventosDeEjemplo,
  municipiosDeEjemplo,
  novedadesDeEjemplo,
  platosDeEjemplo,
  regionesDeEjemplo,
  restaurantesDeEjemplo,
} from './datosDeEjemplo.js'

const CATALOGO_DE_EJEMPLO = {
  categorias: categoriasDeEjemplo,
  departamentos: departamentosDeEjemplo,
  municipios: municipiosDeEjemplo,
  regiones: regionesDeEjemplo,
  destinos: destinosDeEjemplo,
  actividades: actividadesDeEjemplo,
  eventos: eventosDeEjemplo,
  platos: platosDeEjemplo,
  restaurantes: restaurantesDeEjemplo,
  alojamientos: alojamientosDeEjemplo,
}

async function coleccionVacia(nombreColeccion) {
  const instantanea = await getDocs(query(collection(db, nombreColeccion), limit(1)))
  return instantanea.empty
}

// Escribe los datos de ejemplo solo en las colecciones que todavía están
// vacías, así nunca pisa lo que un administrador ya cargó. Los documentos
// usan el "id" fijo de datosDeEjemplo.js para que las relaciones coincidan.
// "extras" permite sembrar colecciones adicionales (ej. administradores
// desde el script de consola).
export async function sembrarColeccionesVacias(extras = {}) {
  const colecciones = { ...CATALOGO_DE_EJEMPLO, ...extras }
  const lote = writeBatch(db)
  const sembradas = []

  for (const [nombreColeccion, registros] of Object.entries(colecciones)) {
    if (!(await coleccionVacia(nombreColeccion))) continue
    registros.forEach(({ id, ...datos }) => lote.set(doc(db, nombreColeccion, id), datos))
    sembradas.push(nombreColeccion)
  }

  if (sembradas.length > 0) await lote.commit()
  return sembradas
}

// Las reglas de seguridad reconocen a un administrador buscando un documento
// de "administradores" cuyo ID sea su correo. Los que se crearon antes tenían
// un ID cualquiera: aquí se copian a un documento con el correo como ID.
// No borra nada y la app sigue encontrándolos por el campo "email".
export async function indexarAdministradoresPorCorreo() {
  const instantanea = await getDocs(collection(db, 'administradores'))
  const existentes = new Set(instantanea.docs.map((documento) => documento.id))
  const copiados = []
  for (const documento of instantanea.docs) {
    const { email } = documento.data()
    if (!email || existentes.has(email)) continue
    await setDoc(doc(db, 'administradores', email), documento.data())
    existentes.add(email)
    copiados.push(email)
  }
  return copiados
}

// Vuelve a escribir los datos de ejemplo aunque las colecciones ya tengan
// datos. Usa "merge": actualiza los documentos de ejemplo (por su id fijo) y
// no toca los que creó el administrador. Cada colección se guarda por
// separado para que, si una falla (ej. falta su regla de seguridad), las
// demás se carguen igual. Devuelve { cargadas: { coleccion: cantidad }, fallidas: [] }.
// Lo usan el botón del panel de administración y el script de consola.
export async function actualizarDatosDeEjemplo() {
  const colecciones = {
    departamentos: departamentosDeEjemplo,
    destinos: destinosDeEjemplo,
    actividades: actividadesDeEjemplo,
    eventos: eventosDeEjemplo,
    platos: platosDeEjemplo,
    restaurantes: restaurantesDeEjemplo,
    alojamientos: alojamientosDeEjemplo,
    novedades: novedadesDeEjemplo.map((novedad) => ({ ...novedad, fecha: serverTimestamp() })),
  }
  const cargadas = {}
  const fallidas = []
  for (const [nombreColeccion, registros] of Object.entries(colecciones)) {
    const lote = writeBatch(db)
    registros.forEach(({ id, ...datos }) => lote.set(doc(db, nombreColeccion, id), datos, { merge: true }))
    try {
      await lote.commit()
      cargadas[nombreColeccion] = registros.length
    } catch (error) {
      console.error(`No se pudo cargar la colección "${nombreColeccion}":`, error)
      fallidas.push(nombreColeccion)
    }
  }
  return { cargadas, fallidas }
}

// Cachea la promesa de sembrado para que llamadas concurrentes (ej. doble
// efecto de React StrictMode en desarrollo) no escriban dos veces.
let sembradoEnProgreso = null

export function sembrarCatalogoDeEjemplo() {
  if (!sembradoEnProgreso) {
    sembradoEnProgreso = conLimiteDeTiempo(sembrarColeccionesVacias(), 15000).catch((error) => {
      sembradoEnProgreso = null
      throw error
    })
  }
  return sembradoEnProgreso
}
