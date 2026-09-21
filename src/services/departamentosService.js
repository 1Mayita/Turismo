import { equalTo, get, orderByChild, push, query, ref, remove, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export const departamentosDeEjemplo = [
  { nombre: 'La Paz', descripcion: 'Sede de gobierno, cuna del Valle de la Luna y puerta de entrada al altiplano.' },
  { nombre: 'Cochabamba', descripcion: 'El "jardín de Bolivia", famosa por su gastronomía y el Cristo de la Concordia.' },
  { nombre: 'Santa Cruz', descripcion: 'Motor económico del país, con tierras bajas tropicales y las Misiones Jesuíticas.' },
  { nombre: 'Oruro', descripcion: 'Hogar del carnaval declarado Patrimonio de la Humanidad y del Salar de Coipasa.' },
  { nombre: 'Potosí', descripcion: 'Ciudad minera histórica y hogar del imponente Salar de Uyuni.' },
  { nombre: 'Chuquisaca', descripcion: 'Capital constitucional de Bolivia, con arquitectura colonial en Sucre.' },
  { nombre: 'Tarija', descripcion: 'Valles vitivinícolas y tradición chapaca en el sur del país.' },
  { nombre: 'Beni', descripcion: 'Llanos y humedales amazónicos, ideales para el ecoturismo.' },
  { nombre: 'Pando', descripcion: 'El departamento más joven, cubierto por selva amazónica virgen.' },
]

export async function getDepartamentos() {
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'departamentos')))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

export async function getDepartamentoPorId(id) {
  const instantanea = await conLimiteDeTiempo(get(ref(db, `departamentos/${id}`)))
  return instantanea.exists() ? { id, ...instantanea.val() } : null
}

// Los destinos guardan el nombre del departamento en el campo "ubicacion".
export async function getDestinosPorDepartamento(nombreDepartamento) {
  const consulta = query(ref(db, 'destinos'), orderByChild('ubicacion'), equalTo(nombreDepartamento))
  const instantanea = await conLimiteDeTiempo(get(consulta))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

let sembradoEnProgreso = null

export function crearDepartamentosDeEjemplo() {
  if (!sembradoEnProgreso) {
    sembradoEnProgreso = conLimiteDeTiempo(
      Promise.all(departamentosDeEjemplo.map((departamento) => push(ref(db, 'departamentos'), departamento))),
      15000,
    ).catch((error) => {
      sembradoEnProgreso = null
      throw error
    })
  }
  return sembradoEnProgreso
}

export async function crearDepartamento(datos) {
  await conLimiteDeTiempo(push(ref(db, 'departamentos'), datos))
}

export async function actualizarDepartamento(id, datos) {
  await conLimiteDeTiempo(update(ref(db, `departamentos/${id}`), datos))
}

export async function eliminarDepartamento(id) {
  await conLimiteDeTiempo(remove(ref(db, `departamentos/${id}`)))
}
