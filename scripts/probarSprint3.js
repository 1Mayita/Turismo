// Prueba de punta a punta del Sprint 3 contra los EMULADORES de Firebase
// (nunca contra la base real). Verifica servicios y reglas de seguridad.
//
//   1. npm run emuladores            (en otra terminal)
//   2. npm run probar:sprint3
//
// Crea cuentas de prueba en el emulador, siembra el catálogo como
// administradora y recorre viajes, compartir, notificaciones, reportes,
// visitas y estadísticas, comprobando también lo que NO se debe poder hacer.
import process from 'node:process'

process.env.VITE_USAR_EMULADORES = '1'

const { auth, db } = await import('../src/services/firebase.js')
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } = await import('firebase/auth')
const { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } = await import('firebase/firestore')
const sembrado = await import('../src/services/sembradoService.js')
const viajes = await import('../src/services/viajesService.js')
const notificaciones = await import('../src/services/notificacionesService.js')
const reportes = await import('../src/services/reportesService.js')
const estadisticas = await import('../src/services/estadisticasService.js')
const favoritos = await import('../src/services/favoritosService.js')

const PROYECTO = 'turismo-e0465'
const ADMIN = { email: 'admin.prueba@rutas.test', clave: 'prueba123', nombre: 'Admin Prueba' }
const ANA = { email: 'ana.prueba@rutas.test', clave: 'prueba123', nombre: 'Ana Viajera' }
const LUIS = { email: 'luis.prueba@rutas.test', clave: 'prueba123', nombre: 'Luis Curioso' }

let fallas = 0
let pruebas = 0
function comprobar(condicion, descripcion) {
  pruebas += 1
  if (condicion) console.log(`  ✓ ${descripcion}`)
  else {
    fallas += 1
    console.log(`  ✗ ${descripcion}`)
  }
}
async function debeFallar(promesa, descripcion) {
  try {
    await promesa
    comprobar(false, `${descripcion} (se permitió y no debía)`)
  } catch (error) {
    // Rechazos esperados: reglas de Firestore o validaciones propias (que no traen código).
    comprobar(error.code === 'permission-denied' || !error.code, `${descripcion} → rechazado (${error.code || error.message})`)
  }
}

async function entrar({ email, clave, nombre }) {
  await signOut(auth).catch(() => {})
  try {
    const credencial = await createUserWithEmailAndPassword(auth, email, clave)
    await updateProfile(credencial.user, { displayName: nombre })
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') throw error
    await signInWithEmailAndPassword(auth, email, clave)
  }
  return auth.currentUser
}

// Borra los datos del emulador para empezar de cero.
await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`, { method: 'DELETE' })
await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROYECTO}/accounts`, { method: 'DELETE' })

// La administradora se registra "a mano" con privilegios del emulador
// (como se hace en la consola de Firebase): las reglas no dejan crearla desde la app.
await fetch(`http://127.0.0.1:8080/v1/projects/${PROYECTO}/databases/(default)/documents/administradores?documentId=${encodeURIComponent(ADMIN.email)}`, {
  method: 'POST',
  headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: { email: { stringValue: ADMIN.email }, nombre: { stringValue: ADMIN.nombre }, rol: { stringValue: 'superadmin' } } }),
})

console.log('\n1. Administradora: sembrar catálogo')
await entrar(ADMIN)
const vacias = await sembrado.sembrarColeccionesVacias()
comprobar(vacias.includes('destinos') && vacias.includes('platos'), `colecciones sembradas: ${vacias.join(', ')}`)
const { cargadas, fallidas } = await sembrado.actualizarDatosDeEjemplo()
comprobar(fallidas.length === 0, `datos de ejemplo actualizados (${Object.keys(cargadas).join(', ')})`)

console.log('\n2. Turista sin permisos de administración')
const ana = await entrar(ANA)
await debeFallar(setDoc(doc(db, 'destinos', 'hackeo'), { nombre: 'x' }), 'Ana crea un destino')
await debeFallar(setDoc(doc(db, 'administradores', ANA.email), { email: ANA.email }), 'Ana se hace administradora')
await debeFallar(getDocs(collection(db, 'visitas')), 'Ana lee las visitas')
await debeFallar(getDocs(collection(db, 'reportes')), 'Ana lista todos los reportes')

console.log('\n3. Viajes (HU-18 y HU-19)')
let viaje = await viajes.crearViaje(ana.uid, { nombre: 'Ruta del salar', fecha_inicio: '2026-11-01', fecha_fin: '2026-11-05', notas: 'Llevar abrigo' })
comprobar(Boolean(viaje.id), 'Ana crea un viaje')
viaje = await viajes.agregarDestinoAViaje(viaje, 'salar-de-uyuni')
viaje = await viajes.agregarDestinoAViaje(viaje, 'laguna-colorada')
viaje = await viajes.agregarDestinoAViaje(viaje, 'casa-de-la-moneda')
comprobar(viaje.paradas.length === 3, 'agrega 3 destinos')
await debeFallar(viajes.agregarDestinoAViaje(viaje, 'salar-de-uyuni'), 'agregar un destino repetido')
viaje = await viajes.guardarParadas(viaje, [viaje.paradas[2], viaje.paradas[0], viaje.paradas[1]])
const releido = await viajes.getViaje(viaje.id)
comprobar(releido.paradas.map((parada) => parada.id_destino).join(',') === 'casa-de-la-moneda,salar-de-uyuni,laguna-colorada', 'el nuevo orden se guarda')
await debeFallar(viajes.crearViaje(ana.uid, { nombre: '' }), 'crear viaje sin nombre')
await debeFallar(viajes.editarDatosDeViaje(viaje, { nombre: 'Ok', fecha_inicio: '2026-11-05', fecha_fin: '2026-11-01' }), 'fecha de regreso antes de la salida')
const muchas = Array.from({ length: 31 }, (_, indice) => ({ id_destino: `d${indice}`, nota: '' }))
await debeFallar(setDoc(doc(db, 'viajes', viaje.id), { ...releido, paradas: muchas }), 'guardar 31 paradas saltándose la app (regla)')
await debeFallar(addDoc(collection(db, 'viajes'), { id_usuario: 'otra-persona', nombre: 'Falso', paradas: [] }), 'crear un viaje a nombre de otra persona')

console.log('\n4. Compartir (HU-25)')
viaje = await viajes.activarEnlaceCompartido(viaje, 'Ana')
comprobar(viaje.token_compartido?.length >= 20, `se crea un enlace con token largo (${viaje.token_compartido.length} caracteres)`)
const luis = await entrar(LUIS)
await debeFallar(viajes.getViaje(viaje.id), 'Luis abre el viaje privado de Ana por su id')
await debeFallar(getDocs(collection(db, 'viajes_compartidos')), 'Luis lista los viajes compartidos para adivinar tokens')
const compartido = await viajes.getViajeCompartido(viaje.token_compartido)
comprobar(compartido?.paradas.length === 3 && compartido.nombre_autor === 'Ana', 'Luis ve el viaje compartido en solo lectura')
await debeFallar(setDoc(doc(db, 'viajes_compartidos', viaje.token_compartido), { ...compartido, nombre: 'Cambiado' }), 'Luis modifica el viaje compartido de Ana')
const copia = await viajes.copiarViajeCompartido(compartido, luis.uid)
comprobar(copia.paradas.length === 3 && copia.id_usuario === luis.uid, 'Luis copia el viaje a su cuenta')
await signOut(auth)
comprobar(Boolean(await viajes.getViajeCompartido(viaje.token_compartido)), 'sin sesión también se abre el enlace')
await entrar(ANA)
viaje = await viajes.editarDatosDeViaje(viaje, { ...viaje, nombre: 'Ruta del salar 2026' })
comprobar((await viajes.getViajeCompartido(viaje.token_compartido))?.nombre === 'Ruta del salar 2026', 'los cambios de Ana se ven en el enlace')
const tokenViejo = viaje.token_compartido
viaje = await viajes.desactivarEnlaceCompartido(viaje)
comprobar((await viajes.getViajeCompartido(tokenViejo)) === null, 'al desactivar, el enlace deja de funcionar')

console.log('\n5. Favoritos y notificaciones (HU-24)')
await favoritos.agregarFavorito(ana.uid, 'salar-de-uyuni', 'destino')
const novedades = await notificaciones.getNovedadesRecientes()
comprobar(novedades.length >= 4, `Ana lee las novedades (${novedades.length})`)
let ajustes = await notificaciones.getAjustesDeNotificaciones(ana.uid)
const sinLeer = notificaciones.armarNotificaciones(novedades, ajustes, ['Aventura']).filter((item) => !item.leida)
comprobar(sinLeer.length === novedades.length, 'al principio todas están sin leer')
comprobar(notificaciones.armarNotificaciones(novedades, ajustes, ['Aventura']).some((item) => item.tipoMostrado === 'recomendaciones'), 'un destino de Aventura aparece como recomendación para quien le gusta la aventura')
await notificaciones.guardarAjustesDeNotificaciones(ana.uid, { ...ajustes, leidas: [novedades[0].id], tipos: { ...ajustes.tipos, eventos: false } })
ajustes = await notificaciones.getAjustesDeNotificaciones(ana.uid)
const conFiltro = notificaciones.armarNotificaciones(novedades, ajustes, [])
comprobar(!conFiltro.some((item) => item.tipoMostrado === 'eventos'), 'si desactiva "eventos", ya no le aparecen')
comprobar(conFiltro.find((item) => item.id === novedades[0].id)?.leida !== false, 'la notificación marcada queda leída')
await entrar(LUIS)
await debeFallar(getDoc(doc(db, 'ajustes_notificaciones', ana.uid)), 'Luis lee los ajustes de Ana')
await debeFallar(addDoc(collection(db, 'novedades'), { tipo: 'aviso', titulo: 'Spam', fecha: serverTimestamp() }), 'Luis publica una novedad')

console.log('\n6. Reportes (HU-26)')
await entrar(ANA)
const anaUsuario = auth.currentUser
await reportes.enviarReporte({ usuario: anaUsuario, tipo: 'destino', elemento: { id: 'salar-de-uyuni', nombre: 'Salar de Uyuni' }, enlace: '/destinos/salar-de-uyuni', motivo: 'desactualizado', descripcion: 'Cambió el precio' })
comprobar(true, 'Ana reporta un dato desactualizado')
await debeFallar(reportes.enviarReporte({ usuario: anaUsuario, tipo: 'destino', elemento: { id: 'salar-de-uyuni', nombre: 'Salar' }, motivo: 'otro' }), 'Ana reporta lo mismo mientras está pendiente')
await entrar(LUIS)
await debeFallar(reportes.getMiReporte(ana.uid, 'destino', 'salar-de-uyuni'), 'Luis lee el reporte de Ana')
await debeFallar(reportes.getReportesDeUsuario(ana.uid), 'Luis lista los reportes de Ana')

console.log('\n7. Visitas y estadísticas (HU-36)')
await signOut(auth)
await estadisticas.registrarVisita('salar-de-uyuni', null)
await addDoc(collection(db, 'visitas'), { id_destino: 'laguna-colorada', id_usuario: null, fecha: serverTimestamp() })
comprobar(true, 'una visita sin sesión se registra')
await debeFallar(addDoc(collection(db, 'visitas'), { id_destino: 'x', id_usuario: null, fecha: serverTimestamp(), extra: 'basura' }), 'una visita con campos de más')
await entrar(ADMIN)
const listaReportes = await reportes.getReportes()
comprobar(listaReportes.length === 1, 'la administradora ve el reporte en la bandeja')
await reportes.cambiarEstadoReporte(listaReportes[0].id, 'resuelto', 'Ya actualizamos el precio.')
const reporteResuelto = (await reportes.getReportes())[0]
comprobar(reporteResuelto.estado === 'resuelto' && reporteResuelto.nota_admin === 'Ya actualizamos el precio.', 'cambia el estado a "resuelto" con una respuesta')
const visitasLeidas = await estadisticas.getVisitas()
comprobar(visitasLeidas.length >= 1, `lee las visitas (${visitasLeidas.length})`)
const todosFavoritos = await estadisticas.getTodosLosFavoritos()
comprobar(todosFavoritos.length >= 1, 'lee los favoritos de todos para las estadísticas')
await notificaciones.publicarNovedad({ tipo: 'evento', titulo: 'Nuevo evento: Prueba', mensaje: 'Hoy', enlace: '/eventos' })
comprobar(true, 'publica una novedad de evento')
await entrar(ANA)
const misReportes = await reportes.getReportesDeUsuario(ana.uid)
const avisoReporte = notificaciones
  .armarNotificaciones([], await notificaciones.getAjustesDeNotificaciones(ana.uid), [], misReportes)
  .find((item) => item.tipoMostrado === 'reportes')
comprobar(Boolean(avisoReporte) && !avisoReporte.leida && avisoReporte.mensaje.includes('Ya actualizamos el precio.'), 'Ana recibe el aviso no leído con la respuesta')
await reportes.enviarReporte({ usuario: auth.currentUser, tipo: 'destino', elemento: { id: 'salar-de-uyuni', nombre: 'Salar de Uyuni' }, motivo: 'incorrecto' })
comprobar(true, 'tras resolverse, Ana puede volver a reportar')
await debeFallar(viajes.eliminarViaje({ ...copia }), 'Ana elimina el viaje de Luis')
await viajes.eliminarViaje(viaje)
comprobar(true, 'Ana elimina su viaje')

console.log(`\n${pruebas - fallas} de ${pruebas} comprobaciones correctas.`)
process.exit(fallas === 0 ? 0 : 1)
