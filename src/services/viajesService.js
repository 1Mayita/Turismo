import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Viajes del planificador (colección "viajes"):
//   id_usuario, nombre, fecha_inicio, fecha_fin ("AAAA-MM-DD" u ""), notas,
//   paradas [{ id_destino, nota }]  ← el orden de la lista es el orden de visita,
//   token_compartido (texto o null), creado, actualizado.
// Las reglas de Firestore solo dejan leer y escribir sus propios viajes a cada usuario.
//
// Al compartir, se guarda una copia de solo lectura en "viajes_compartidos/{token}".
// El token es largo y aleatorio: quien no tiene el enlace no puede adivinarlo.

export const MAXIMO_PARADAS = 30
export const LARGO_MAXIMO_NOMBRE = 80
export const LARGO_MAXIMO_NOTAS = 1000

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

// Devuelve un mensaje de error para mostrar, o '' si los datos están bien.
export function validarDatosDeViaje({ nombre = '', fecha_inicio: inicio = '', fecha_fin: fin = '', notas = '' }) {
  if (!nombre.trim()) return 'Ponle un nombre a tu viaje.'
  if (nombre.trim().length > LARGO_MAXIMO_NOMBRE) return `El nombre puede tener hasta ${LARGO_MAXIMO_NOMBRE} caracteres.`
  if (inicio && fin && fin < inicio) return 'La fecha de regreso no puede ser anterior a la de salida.'
  if (notas.length > LARGO_MAXIMO_NOTAS) return `Las notas pueden tener hasta ${LARGO_MAXIMO_NOTAS} caracteres.`
  return ''
}

function datosLimpios({ nombre = '', fecha_inicio: inicio = '', fecha_fin: fin = '', notas = '' }) {
  return { nombre: nombre.trim(), fecha_inicio: inicio || '', fecha_fin: fin || '', notas: notas.trim() }
}

export async function getViajesDeUsuario(idUsuario) {
  const consulta = query(collection(db, 'viajes'), where('id_usuario', '==', idUsuario))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .sort((a, b) => milisegundos(b.actualizado) - milisegundos(a.actualizado))
}

export async function getViaje(id) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'viajes', id)))
  return documento.exists() ? { id: documento.id, ...documento.data() } : null
}

// Crea el viaje y devuelve el viaje completo (con su id).
export async function crearViaje(idUsuario, datos, paradas = []) {
  const error = validarDatosDeViaje(datos)
  if (error) throw new Error(error)
  const nuevo = {
    id_usuario: idUsuario,
    ...datosLimpios(datos),
    paradas: paradas.slice(0, MAXIMO_PARADAS),
    token_compartido: null,
    creado: serverTimestamp(),
    actualizado: serverTimestamp(),
  }
  const referencia = await conLimiteDeTiempo(addDoc(collection(db, 'viajes'), nuevo))
  return { ...nuevo, id: referencia.id }
}

// Guarda cambios del viaje y, si está compartido, actualiza también la copia pública.
async function guardarCambios(viaje, cambios) {
  await conLimiteDeTiempo(updateDoc(doc(db, 'viajes', viaje.id), { ...cambios, actualizado: serverTimestamp() }))
  const actualizado = { ...viaje, ...cambios }
  if (actualizado.token_compartido) await escribirCopiaCompartida(actualizado)
  return actualizado
}

export async function editarDatosDeViaje(viaje, datos) {
  const error = validarDatosDeViaje(datos)
  if (error) throw new Error(error)
  return guardarCambios(viaje, datosLimpios(datos))
}

export async function agregarDestinoAViaje(viaje, idDestino) {
  const paradas = Array.isArray(viaje.paradas) ? viaje.paradas : []
  if (paradas.some((parada) => parada.id_destino === idDestino)) throw new Error('Este destino ya está en el viaje.')
  if (paradas.length >= MAXIMO_PARADAS) throw new Error(`Un viaje puede tener hasta ${MAXIMO_PARADAS} destinos.`)
  return guardarCambios(viaje, { paradas: [...paradas, { id_destino: idDestino, nota: '' }] })
}

export async function quitarDestinoDeViaje(viaje, idDestino) {
  return guardarCambios(viaje, { paradas: viaje.paradas.filter((parada) => parada.id_destino !== idDestino) })
}

// Guarda un nuevo orden (o notas) de las paradas. Descarta repetidos por seguridad.
export async function guardarParadas(viaje, paradas) {
  const vistos = new Set()
  const sinRepetidos = paradas.filter((parada) => !vistos.has(parada.id_destino) && vistos.add(parada.id_destino))
  return guardarCambios(viaje, { paradas: sinRepetidos.slice(0, MAXIMO_PARADAS) })
}

export async function eliminarViaje(viaje) {
  if (viaje.token_compartido) {
    await conLimiteDeTiempo(deleteDoc(doc(db, 'viajes_compartidos', viaje.token_compartido))).catch(() => {})
  }
  await conLimiteDeTiempo(deleteDoc(doc(db, 'viajes', viaje.id)))
}

// ---------- Compartir ----------

function generarToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 32)
}

async function escribirCopiaCompartida(viaje, nombreAutor) {
  const datos = {
    id_viaje: viaje.id,
    id_usuario: viaje.id_usuario,
    nombre: viaje.nombre,
    fecha_inicio: viaje.fecha_inicio || '',
    fecha_fin: viaje.fecha_fin || '',
    notas: viaje.notas || '',
    paradas: viaje.paradas || [],
    actualizado: serverTimestamp(),
    ...(nombreAutor !== undefined ? { nombre_autor: nombreAutor } : {}),
  }
  await conLimiteDeTiempo(setDoc(doc(db, 'viajes_compartidos', viaje.token_compartido), datos, { merge: true }))
}

export function enlaceDeViajeCompartido(token) {
  return `${window.location.origin}/viaje-compartido/${token}`
}

// Crea (o reutiliza) el enlace público de solo lectura. Devuelve el viaje actualizado.
export async function activarEnlaceCompartido(viaje, nombreAutor) {
  if (viaje.token_compartido) return viaje
  const conToken = { ...viaje, token_compartido: generarToken() }
  await escribirCopiaCompartida(conToken, nombreAutor || 'Un viajero')
  await conLimiteDeTiempo(updateDoc(doc(db, 'viajes', viaje.id), { token_compartido: conToken.token_compartido }))
  return conToken
}

// Borra la copia pública: el enlace deja de funcionar para todos.
export async function desactivarEnlaceCompartido(viaje) {
  if (!viaje.token_compartido) return viaje
  await conLimiteDeTiempo(deleteDoc(doc(db, 'viajes_compartidos', viaje.token_compartido)))
  await conLimiteDeTiempo(updateDoc(doc(db, 'viajes', viaje.id), { token_compartido: null }))
  return { ...viaje, token_compartido: null }
}

export async function getViajeCompartido(token) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'viajes_compartidos', token)))
  return documento.exists() ? { token, ...documento.data() } : null
}

// "Copiar este viaje a mi cuenta": crea un viaje nuevo del visitante con las mismas paradas.
export function copiarViajeCompartido(compartido, idUsuario) {
  return crearViaje(idUsuario, {
    nombre: `${compartido.nombre} (copia)`.slice(0, LARGO_MAXIMO_NOMBRE),
    fecha_inicio: compartido.fecha_inicio,
    fecha_fin: compartido.fecha_fin,
    notas: compartido.notas,
  }, (compartido.paradas || []).map((parada) => ({ id_destino: parada.id_destino, nota: parada.nota || '' })))
}
