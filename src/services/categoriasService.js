import { equalTo, get, orderByChild, push, query, ref, remove, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export const categoriasDeEjemplo = [
  { nombre: 'Naturaleza', descripcion: 'Paisajes, parques y reservas naturales.' },
  { nombre: 'Cultura', descripcion: 'Museos, tradiciones y patrimonio cultural.' },
  { nombre: 'Aventura', descripcion: 'Trekking, expediciones y deportes extremos.' },
  { nombre: 'Gastronomía', descripcion: 'Comida típica y experiencias culinarias.' },
  { nombre: 'Historia', descripcion: 'Sitios y monumentos históricos.' },
  { nombre: 'Entretenimiento', descripcion: 'Actividades recreativas y de esparcimiento.' },
  { nombre: 'Religioso', descripcion: 'Templos, santuarios y turismo de fe.' },
]

export async function getCategorias() {
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'categorias')))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

// Los destinos guardan el nombre de la categoría en el campo "categoria".
export async function getDestinosPorCategoria(nombreCategoria) {
  const consulta = query(ref(db, 'destinos'), orderByChild('categoria'), equalTo(nombreCategoria))
  const instantanea = await conLimiteDeTiempo(get(consulta))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

let sembradoEnProgreso = null

export function crearCategoriasDeEjemplo() {
  if (!sembradoEnProgreso) {
    sembradoEnProgreso = conLimiteDeTiempo(
      Promise.all(categoriasDeEjemplo.map((categoria) => push(ref(db, 'categorias'), categoria))),
      15000,
    ).catch((error) => {
      sembradoEnProgreso = null
      throw error
    })
  }
  return sembradoEnProgreso
}

export async function crearCategoria(datos) {
  await conLimiteDeTiempo(push(ref(db, 'categorias'), datos))
}

export async function actualizarCategoria(id, datos) {
  await conLimiteDeTiempo(update(ref(db, `categorias/${id}`), datos))
}

export async function eliminarCategoria(id) {
  await conLimiteDeTiempo(remove(ref(db, `categorias/${id}`)))
}
