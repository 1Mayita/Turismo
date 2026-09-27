import { collection, doc, getDocs, limit, query, writeBatch } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'
import {
  categoriasDeEjemplo,
  departamentosDeEjemplo,
  destinosDeEjemplo,
  municipiosDeEjemplo,
  regionesDeEjemplo,
} from './datosDeEjemplo.js'

const CATALOGO_DE_EJEMPLO = {
  categorias: categoriasDeEjemplo,
  departamentos: departamentosDeEjemplo,
  municipios: municipiosDeEjemplo,
  regiones: regionesDeEjemplo,
  destinos: destinosDeEjemplo,
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
