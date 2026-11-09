import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Viajes del planificador (colección "viajes"):
//   id_usuario, nombre, fecha_inicio, fecha_fin ("AAAA-MM-DD" u ""), notas,
//   paradas [{ id_destino, nota }]  ← el orden de la lista es el orden de visita,
//   token_compartido (texto o null), creado, actualizado.
//   estado: 'planificado' | 'realizado' | 'cancelado' (los viajes antiguos sin
//   este campo se consideran planificados).
// Cuando el viaje se realizó (historial "Mis viajes realizados") se agregan:
//   fecha_visita ("AAAA-MM-DD"), destinos_visitados [ids] (subconjunto de las
//   paradas que realmente se visitaron), fotos [urls], recuerdo (texto),
//   origen ('manual' si se registró directamente como realizado, 'plan' si
//   salió de un viaje planificado). Es el MISMO documento: marcar un viaje como
//   realizado no crea un segundo registro del mismo viaje.
// Las reglas de Firestore solo dejan leer y escribir sus propios viajes a cada usuario.
//
// Al compartir, se guarda una copia de solo lectura en "viajes_compartidos/{token}".
// El token es largo y aleatorio: quien no tiene el enlace no puede adivinarlo.

export const MAXIMO_PARADAS = 30
export const LARGO_MAXIMO_NOMBRE = 80
export const LARGO_MAXIMO_NOTAS = 1000
export const LARGO_MAXIMO_RECUERDO = 2000
export const MAXIMO_FOTOS = 10

export const ESTADOS_DE_VIAJE = {
  planificado: { etiqueta: 'Planificado', clase: 'bg-cielo text-noche' },
  realizado: { etiqueta: 'Realizado', clase: 'bg-emerald-100 text-emerald-800' },
  cancelado: { etiqueta: 'Cancelado', clase: 'bg-slate-200 text-slate-700' },
}

export function estadoDeViaje(viaje) {
  return ESTADOS_DE_VIAJE[viaje?.estado] ? viaje.estado : 'planificado'
}

export function hoyISO() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

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
    estado: 'planificado',
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

// ---------- Viajes realizados (historial) ----------

// Valida los datos del recuerdo. Devuelve un mensaje o ''.
export function validarRecuerdo({ fecha_visita: fecha = '', destinos_visitados: visitados = [], fotos = [], recuerdo = '' }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'Indica la fecha de la visita.'
  if (fecha > hoyISO()) return 'La fecha de visita no puede estar en el futuro.'
  if (!Array.isArray(visitados) || visitados.length === 0) return 'Elige al menos un destino que hayas visitado.'
  if (fotos.length > MAXIMO_FOTOS) return `Puedes guardar hasta ${MAXIMO_FOTOS} fotos por viaje.`
  if (recuerdo.length > LARGO_MAXIMO_RECUERDO) return `El recuerdo puede tener hasta ${LARGO_MAXIMO_RECUERDO} caracteres.`
  return ''
}

function recuerdoLimpio({ fecha_visita: fecha, destinos_visitados: visitados, fotos = [], recuerdo = '' }) {
  return {
    fecha_visita: fecha,
    destinos_visitados: [...new Set(visitados)].slice(0, MAXIMO_PARADAS),
    fotos: [...new Set(fotos.filter(Boolean))].slice(0, MAXIMO_FOTOS),
    recuerdo: recuerdo.trim(),
  }
}

// Registro manual de un viaje que ya se hizo (aunque sea de antes de usar la app).
// Se elige un destino del catálogo: no se copian sus datos, solo su id.
export async function registrarViajeRealizado(idUsuario, { destino, fecha_visita: fecha, fotos = [], recuerdo = '' }) {
  if (!destino?.id) throw new Error('Elige el destino que visitaste.')
  const datos = { fecha_visita: fecha, destinos_visitados: [destino.id], fotos, recuerdo }
  const error = validarRecuerdo(datos)
  if (error) throw new Error(error)
  const nuevo = {
    id_usuario: idUsuario,
    nombre: `Visita a ${destino.nombre}`.slice(0, LARGO_MAXIMO_NOMBRE),
    fecha_inicio: fecha,
    fecha_fin: fecha,
    notas: '',
    paradas: [{ id_destino: destino.id, nota: '' }],
    token_compartido: null,
    estado: 'realizado',
    origen: 'manual',
    ...recuerdoLimpio(datos),
    creado: serverTimestamp(),
    actualizado: serverTimestamp(),
  }
  const referencia = await conLimiteDeTiempo(addDoc(collection(db, 'viajes'), nuevo))
  return { ...nuevo, id: referencia.id }
}

// Convierte un viaje planificado en realizado: mismo documento, se conservan
// nombre, fechas, notas y paradas originales.
export async function marcarViajeComoRealizado(viaje, datos) {
  if (estadoDeViaje(viaje) === 'realizado') throw new Error('Este viaje ya está en tu historial.')
  const idsParadas = new Set((viaje.paradas || []).map((parada) => parada.id_destino))
  const visitados = (datos.destinos_visitados || []).filter((id) => idsParadas.has(id))
  const error = validarRecuerdo({ ...datos, destinos_visitados: visitados })
  if (error) throw new Error(error)
  return guardarCambios(viaje, { estado: 'realizado', origen: 'plan', ...recuerdoLimpio({ ...datos, destinos_visitados: visitados }) })
}

// Edita fecha, fotos y recuerdo de un viaje realizado. En los manuales también
// se puede cambiar el destino.
export async function editarViajeRealizado(viaje, datos) {
  if (estadoDeViaje(viaje) !== 'realizado') throw new Error('Este viaje no está en tu historial.')
  const esManual = viaje.origen === 'manual'
  const visitados = esManual && datos.destino ? [datos.destino.id] : datos.destinos_visitados
  const error = validarRecuerdo({ ...datos, destinos_visitados: visitados })
  if (error) throw new Error(error)
  const cambios = recuerdoLimpio({ ...datos, destinos_visitados: visitados })
  if (esManual && datos.destino) {
    Object.assign(cambios, {
      nombre: `Visita a ${datos.destino.nombre}`.slice(0, LARGO_MAXIMO_NOMBRE),
      paradas: [{ id_destino: datos.destino.id, nota: '' }],
      fecha_inicio: cambios.fecha_visita,
      fecha_fin: cambios.fecha_visita,
    })
  }
  return guardarCambios(viaje, cambios)
}

// Un viaje que salió del planificador vuelve a "planificado" (sale del
// historial y de las estadísticas). Se conservan las fotos y el recuerdo por
// si se vuelve a marcar.
export function devolverAPlanificado(viaje) {
  return guardarCambios(viaje, { estado: 'planificado' })
}

export function cancelarViaje(viaje) {
  if (estadoDeViaje(viaje) === 'realizado') throw new Error('Un viaje realizado no se puede cancelar.')
  return guardarCambios(viaje, { estado: 'cancelado' })
}

export function reactivarViaje(viaje) {
  return guardarCambios(viaje, { estado: 'planificado' })
}

// Historial de la persona: solo realizados, el más reciente primero.
export function ordenarHistorial(viajes) {
  return viajes
    .filter((viaje) => estadoDeViaje(viaje) === 'realizado')
    .sort((a, b) => (b.fecha_visita || '').localeCompare(a.fecha_visita || '') || milisegundos(b.creado) - milisegundos(a.creado))
}
