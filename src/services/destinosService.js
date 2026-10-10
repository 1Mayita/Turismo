import { collection, getDocs, query, where } from 'firebase/firestore'
import { crearServicio, SOLO_EJEMPLOS } from './coleccion.js'
import { destinosDeEjemplo } from './datosDeEjemplo.js'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export { destinosDeEjemplo }

const destinos = crearServicio('destinos', destinosDeEjemplo)

export const getDestinos = destinos.todos
export const getDestinoPorId = destinos.uno
export const crearDestino = destinos.crear
export const actualizarDestino = destinos.actualizar
export const eliminarDestino = destinos.eliminar

// Solo filtros de igualdad: Firestore los combina sin pedir índices compuestos.
// Los rangos (precio, valoración) se aplican luego en el cliente.
export function getDestinosFiltrados({ categoria, idDepartamento, idMunicipio, idRegion } = {}) {
  return destinos.donde({ categoria, id_departamento: idDepartamento, id_municipio: idMunicipio, id_region: idRegion })
}

// Filtra por la zona más específica que se indique: región > municipio > departamento.
export function getDestinosPorZona({ idDepartamento, idMunicipio, idRegion } = {}) {
  if (idRegion) return destinos.donde({ id_region: idRegion })
  if (idMunicipio) return destinos.donde({ id_municipio: idMunicipio })
  return destinos.donde({ id_departamento: idDepartamento })
}

export function getDestinosPorDepartamento(idDepartamento) {
  return getDestinosPorZona({ idDepartamento })
}

// Búsqueda por prefijo: "Sal" encuentra "Salar de Uyuni". Firestore distingue
// mayúsculas, así que también se prueba con la primera letra en mayúscula
// para que "salar" encuentre "Salar".
export async function buscarDestinosPorNombre(texto) {
  const limpio = texto.trim()
  if (!limpio) return []

  const variantes = [...new Set([limpio, limpio.charAt(0).toUpperCase() + limpio.slice(1)])]
  if (SOLO_EJEMPLOS) {
    return destinosDeEjemplo.filter((destino) => variantes.some((variante) => destino.nombre.startsWith(variante)))
  }

  // FIN_DE_PREFIJO es el último carácter Unicode de uso privado: cualquier
  // nombre que empiece con el texto queda entre "texto" y "texto + FIN_DE_PREFIJO".
  const FIN_DE_PREFIJO = String.fromCharCode(0xf8ff)
  const instantaneas = await conLimiteDeTiempo(Promise.all(variantes.map((variante) => getDocs(query(
    collection(db, 'destinos'),
    where('nombre', '>=', variante),
    where('nombre', '<=', variante + FIN_DE_PREFIJO),
  )))))

  const porId = new Map()
  instantaneas.forEach((instantanea) => {
    instantanea.docs.forEach((documento) => porId.set(documento.id, { id: documento.id, ...documento.data() }))
  })
  return [...porId.values()]
}
