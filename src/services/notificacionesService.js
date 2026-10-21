import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Notificaciones dentro de la web (HU-24). Dos colecciones:
//
//   novedades/{id}                 lo que publica el administrador, igual para todos
//     tipo ('evento' | 'destino' | 'aviso'), titulo, mensaje, enlace,
//     categoria (en destinos), fecha
//
//   ajustes_notificaciones/{uid}   lo propio de cada usuario
//     leidas [ids], leidas_hasta (fecha de "marcar todas"),
//     tipos { eventos, destinos, recomendaciones } (true = recibir)
//
// Así, publicar un evento es UNA escritura (no una por usuario) y cada
// persona solo guarda qué leyó y qué quiere recibir.
// Las "recomendaciones" son novedades de destinos cuya categoría coincide con
// las preferencias del perfil: se muestran destacadas como recomendación.
// Los avisos de "reportes" salen de los reportes de la propia persona: cuando
// el administrador cambia su estado, aparece una notificación con su respuesta.

export const TIPOS_DE_NOTIFICACION = [
  { id: 'eventos', etiqueta: 'Nuevos eventos', descripcion: 'Festivales, ferias y celebraciones que se publiquen.' },
  { id: 'destinos', etiqueta: 'Nuevos destinos', descripcion: 'Lugares que se agreguen al catálogo.' },
  { id: 'recomendaciones', etiqueta: 'Recomendaciones para ti', descripcion: 'Novedades que coinciden con tus intereses.' },
  { id: 'reportes', etiqueta: 'Mis reportes', descripcion: 'Cuando revisemos o resolvamos un problema que reportaste.' },
]

export const TIPOS_POR_DEFECTO = { eventos: true, destinos: true, recomendaciones: true, reportes: true }
const MAXIMO_NOVEDADES = 40
const MAXIMO_LEIDAS_GUARDADAS = 200

export async function getNovedadesRecientes() {
  const consulta = query(collection(db, 'novedades'), orderBy('fecha', 'desc'), limit(MAXIMO_NOVEDADES))
  const instantanea = await conLimiteDeTiempo(getDocs(consulta))
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

// La usa el panel de administración al publicar un evento o un destino.
export async function publicarNovedad({ tipo, titulo, mensaje, enlace, categoria = '' }) {
  await conLimiteDeTiempo(addDoc(collection(db, 'novedades'), { tipo, titulo, mensaje, enlace, categoria, fecha: serverTimestamp() }))
}

export async function getAjustesDeNotificaciones(idUsuario) {
  const documento = await conLimiteDeTiempo(getDoc(doc(db, 'ajustes_notificaciones', idUsuario)))
  const datos = documento.exists() ? documento.data() : {}
  return {
    leidas: Array.isArray(datos.leidas) ? datos.leidas : [],
    leidas_hasta: datos.leidas_hasta || null,
    tipos: { ...TIPOS_POR_DEFECTO, ...(datos.tipos || {}) },
  }
}

export async function guardarAjustesDeNotificaciones(idUsuario, ajustes) {
  await conLimiteDeTiempo(setDoc(doc(db, 'ajustes_notificaciones', idUsuario), {
    leidas: ajustes.leidas.slice(-MAXIMO_LEIDAS_GUARDADAS),
    leidas_hasta: ajustes.leidas_hasta || null,
    tipos: ajustes.tipos,
  }))
}

function milisegundos(fecha) {
  return typeof fecha?.toMillis === 'function' ? fecha.toMillis() : 0
}

const TEXTOS_DE_REPORTE = {
  en_revision: (nombre) => ({ titulo: `Estamos revisando tu reporte sobre ${nombre}`, mensaje: 'Gracias por avisarnos. Te contaremos cuando lo resolvamos.' }),
  resuelto: (nombre) => ({ titulo: `¡Gracias! Corregimos ${nombre}`, mensaje: 'Revisamos tu reporte y actualizamos la información.' }),
  descartado: (nombre) => ({ titulo: `Revisamos tu reporte sobre ${nombre}`, mensaje: 'No encontramos un error en la información publicada. ¡Gracias igual por avisarnos!' }),
}

// Un reporte genera una notificación por cada estado al que pasa (el ID
// incluye el estado), así un cambio nuevo vuelve a aparecer como no leído.
function notificacionesDeReportes(reportes) {
  return reportes
    .filter((reporte) => TEXTOS_DE_REPORTE[reporte.estado])
    .map((reporte) => {
      const textos = TEXTOS_DE_REPORTE[reporte.estado](reporte.nombre_elemento || 'un lugar')
      const nota = reporte.nota_admin?.trim()
      return {
        id: `reporte_${reporte.id}_${reporte.estado}`,
        tipo: 'reporte',
        titulo: textos.titulo,
        mensaje: nota ? `Respuesta del equipo: “${nota}”` : textos.mensaje,
        enlace: reporte.enlace || '',
        fecha: reporte.actualizado || reporte.fecha,
      }
    })
}

// Convierte las novedades (y los reportes propios) en las notificaciones de
// una persona: aplica sus tipos activados, marca las recomendaciones y
// calcula cuáles no leyó.
export function armarNotificaciones(novedades, ajustes, categoriasPreferidas = [], reportes = []) {
  const preferidas = new Set(categoriasPreferidas)
  const leidasHasta = milisegundos(ajustes.leidas_hasta)
  return [...novedades, ...notificacionesDeReportes(reportes)]
    .map((novedad) => {
      if (novedad.tipo === 'reporte') {
        return { ...novedad, tipoMostrado: 'reportes', leida: milisegundos(novedad.fecha) <= leidasHasta || ajustes.leidas.includes(novedad.id) }
      }
      const esRecomendacion = novedad.tipo === 'destino' && preferidas.has(novedad.categoria)
      const tipo = esRecomendacion ? 'recomendaciones' : novedad.tipo === 'evento' ? 'eventos' : novedad.tipo === 'destino' ? 'destinos' : 'avisos'
      return {
        ...novedad,
        tipoMostrado: tipo,
        titulo: esRecomendacion ? `Te puede gustar: ${novedad.titulo.replace(/^Nuevo destino:\s*/i, '')}` : novedad.titulo,
        mensaje: esRecomendacion ? `Es de ${novedad.categoria.toLocaleLowerCase('es')}, uno de tus intereses. ${novedad.mensaje || ''}`.trim() : novedad.mensaje,
        leida: milisegundos(novedad.fecha) <= leidasHasta || ajustes.leidas.includes(novedad.id),
      }
    })
    .filter((notificacion) => notificacion.tipoMostrado === 'avisos' || ajustes.tipos[notificacion.tipoMostrado] !== false)
    .sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha))
}
