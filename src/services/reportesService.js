import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Reportes de información incorrecta (HU-26). Colección "reportes".
// El ID del documento es "{usuario}_{tipo}_{elemento}": así cada persona tiene
// como máximo un reporte por lugar. Mientras está pendiente o en revisión no
// puede enviar otro; si ya se resolvió o descartó, puede volver a reportar.
//   id_usuario, nombre_usuario, tipo_elemento, id_elemento, nombre_elemento,
//   enlace, motivo, descripcion, estado, nota_admin, fecha, actualizado

export const MOTIVOS = [
  { id: 'incorrecto', etiqueta: 'Hay un dato incorrecto' },
  { id: 'desactualizado', etiqueta: 'La información está desactualizada' },
  { id: 'inapropiado', etiqueta: 'Contenido inapropiado u ofensivo' },
  { id: 'otro', etiqueta: 'Otro problema' },
]

export const ESTADOS = [
  { id: 'pendiente', etiqueta: 'Pendiente', clase: 'bg-amber-100 text-amber-800' },
  { id: 'en_revision', etiqueta: 'En revisión', clase: 'bg-sky-100 text-sky-800' },
  { id: 'resuelto', etiqueta: 'Resuelto', clase: 'bg-emerald-100 text-emerald-800' },
  { id: 'descartado', etiqueta: 'Descartado', clase: 'bg-slate-200 text-slate-700' },
]

export const TIPOS_REPORTABLES = { destino: 'Destino', restaurante: 'Restaurante', alojamiento: 'Alojamiento', evento: 'Evento' }
export const LARGO_MAXIMO_DESCRIPCION = 500
const ABIERTOS = ['pendiente', 'en_revision']

function idReporte(idUsuario, tipo, idElemento) {
  return `${idUsuario}_${tipo}_${idElemento}`
}

// Reporte que la persona ya tiene sobre este elemento (o null).
export async function getMiReporte(idUsuario, tipo, idElemento) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'reportes', idReporte(idUsuario, tipo, idElemento))))
  return documento.exists() ? { id: documento.id, ...documento.data() } : null
}

export async function enviarReporte({ usuario, tipo, elemento, enlace, motivo, descripcion = '' }) {
  if (!TIPOS_REPORTABLES[tipo]) throw new Error('No se puede reportar este tipo de contenido.')
  if (!MOTIVOS.some((item) => item.id === motivo)) throw new Error('Elige el motivo del reporte.')
  if (descripcion.length > LARGO_MAXIMO_DESCRIPCION) throw new Error(`La descripción puede tener hasta ${LARGO_MAXIMO_DESCRIPCION} caracteres.`)

  const existente = await getMiReporte(usuario.uid, tipo, elemento.id)
  if (existente && ABIERTOS.includes(existente.estado)) {
    throw new Error('Ya enviaste un reporte sobre este lugar y lo estamos revisando. ¡Gracias!')
  }

  await conLimiteDeTiempo(setDoc(doc(db, 'reportes', idReporte(usuario.uid, tipo, elemento.id)), {
    id_usuario: usuario.uid,
    nombre_usuario: usuario.displayName || usuario.email?.split('@')[0] || 'Turista',
    tipo_elemento: tipo,
    id_elemento: elemento.id,
    nombre_elemento: elemento.nombre || '',
    enlace: enlace || '',
    motivo,
    descripcion: descripcion.trim(),
    estado: 'pendiente',
    nota_admin: '',
    fecha: serverTimestamp(),
    actualizado: serverTimestamp(),
  }))
}

// ---------- Panel de administración ----------

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

export async function getReportes() {
  const instantanea = await conLimiteDeTiempo(getDocs(collection(db, 'reportes')))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
}

export async function cambiarEstadoReporte(id, estado, notaAdmin) {
  if (!ESTADOS.some((item) => item.id === estado)) throw new Error('Estado no válido.')
  await conLimiteDeTiempo(updateDoc(doc(db, 'reportes', id), {
    estado,
    ...(notaAdmin !== undefined ? { nota_admin: notaAdmin.trim().slice(0, 500) } : {}),
    actualizado: serverTimestamp(),
  }))
}
