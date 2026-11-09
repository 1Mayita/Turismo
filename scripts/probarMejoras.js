// Prueba de punta a punta de: historial de viajes realizados, relación
// restaurantes ↔ platos típicos (la registra solo el administrador) y
// reportes de popularidad (visitas, contadores públicos, rankings por
// departamento). Corre contra los EMULADORES de Firebase (nunca contra la
// base real) y verifica servicios y reglas de seguridad.
//
//   1. npm run emuladores            (en otra terminal)
//   2. npm run probar:mejoras
import process from 'node:process'

process.env.VITE_USAR_EMULADORES = '1'

const { auth, db } = await import('../src/services/firebase.js')
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } = await import('firebase/auth')
const { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } = await import('firebase/firestore')
const sembrado = await import('../src/services/sembradoService.js')
const viajes = await import('../src/services/viajesService.js')
const restaurantes = await import('../src/services/restaurantesService.js')
const platos = await import('../src/services/platosService.js')
const estadisticas = await import('../src/services/estadisticasService.js')
const resenas = await import('../src/services/resenasService.js')
const pop = await import('../src/utils/popularidad.js')

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
const ids = (lista) => lista.map((item) => item.id).sort().join(',')

await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`, { method: 'DELETE' })
await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROYECTO}/accounts`, { method: 'DELETE' })
await fetch(`http://127.0.0.1:8080/v1/projects/${PROYECTO}/databases/(default)/documents/administradores?documentId=${encodeURIComponent(ADMIN.email)}`, {
  method: 'POST',
  headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: { email: { stringValue: ADMIN.email }, nombre: { stringValue: ADMIN.nombre } } }),
})

console.log('\n1. Administradora: catálogo')
await entrar(ADMIN)
await sembrado.sembrarColeccionesVacias()
const catalogoPlatos = await platos.getPlatos()
comprobar(catalogoPlatos.length >= 10, `catálogo de platos sembrado (${catalogoPlatos.length})`)

console.log('\n2. Relación muchos a muchos restaurantes ↔ platos')
const valle = await restaurantes.getRestaurantePorId('sabores-del-valle')
comprobar(['silpancho', 'pique-macho', 'chicharron', 'sopa-de-mani'].every((id) => valle.platos_ids.includes(id)), 'un restaurante ofrece varios platos (por id)')
const conSilpancho = await restaurantes.getRestaurantesConPlato({ id: 'silpancho', nombre: 'Silpancho' })
comprobar(conSilpancho.some((item) => item.id === 'sabores-del-valle') && conSilpancho.some((item) => item.id === 'la-casa-del-chicharron'), `un mismo plato está en varios restaurantes (${ids(conSilpancho)})`)
comprobar(!('platos_tipicos' in valle), 'el restaurante no duplica los nombres de los platos')
// Restaurante antiguo con solo nombres: se relaciona por nombre hasta que se edite.
await setDoc(doc(db, 'restaurantes', 'antiguo'), { nombre: 'Pensión Antigua', platos_tipicos: ['Silpancho'], id_departamento: 'cochabamba' })
comprobar((await restaurantes.getRestaurantesConPlato({ id: 'silpancho', nombre: 'Silpancho' })).some((item) => item.id === 'antiguo'), 'un restaurante con datos anteriores (solo nombres) también aparece')
comprobar(restaurantes.idsDePlatos({ platos_tipicos: ['SOPA DE MANI'] }, catalogoPlatos).join() === 'sopa-de-mani', 'los nombres antiguos se convierten a ids ignorando tildes y mayúsculas')

console.log('\n3. Solo la administradora registra restaurantes y platos')
await restaurantes.actualizarRestaurante('sabores-del-valle', { platos_ids: ['pique-macho', 'chicharron', 'sopa-de-mani'] })
const sinSilpancho = await restaurantes.getRestaurantesConPlato({ id: 'silpancho', nombre: 'Silpancho' })
comprobar(!sinSilpancho.some((item) => item.id === 'sabores-del-valle'), 'al quitarle el silpancho al restaurante, deja de aparecer en la ficha del plato (relación dinámica)')
await restaurantes.actualizarRestaurante('sabores-del-valle', { platos_ids: restaurantes.limpiarIdsDePlatos(['silpancho', 'pique-macho', 'chicharron', 'sopa-de-mani', 'silpancho']) })
comprobar((await restaurantes.getRestaurantePorId('sabores-del-valle')).platos_ids.length === 4, 'al volver a agregarlo no se guardan repetidos')
// "¿No está el plato? Registrar nuevo plato": se crea en el catálogo y se elige para el restaurante.
comprobar(platos.buscarPlatoDuplicado('  sopa de MANÍ ', catalogoPlatos)?.id === 'sopa-de-mani', 'detecta un plato repetido aunque cambien tildes, mayúsculas y espacios')
const idQuinua = await platos.crearPlato({ nombre: 'Sopa de quinua', id_departamento: 'potosi', descripcion: 'Sopa espesa de quinua.' })
await restaurantes.actualizarRestaurante('sabores-del-valle', { platos_ids: [...(await restaurantes.getRestaurantePorId('sabores-del-valle')).platos_ids, idQuinua] })
comprobar((await restaurantes.getRestaurantesConPlato({ id: idQuinua, nombre: 'Sopa de quinua' })).some((item) => item.id === 'sabores-del-valle'), 'un plato nuevo registrado por la administradora queda vinculado al restaurante')
const luis = await entrar(LUIS)
await debeFallar(updateDoc(doc(db, 'restaurantes', 'sabores-del-valle'), { platos_ids: [] }), 'un usuario cambia los platos de un restaurante')
await debeFallar(updateDoc(doc(db, 'restaurantes', 'sabores-del-valle'), { nombre: 'Cambiado' }), 'un usuario edita un restaurante')
await debeFallar(addDoc(collection(db, 'restaurantes'), { nombre: 'Mi restaurante' }), 'un usuario registra un restaurante')
await debeFallar(addDoc(collection(db, 'platos'), { nombre: 'Plato sin control' }), 'un usuario registra un plato típico')
await debeFallar(addDoc(collection(db, 'solicitudes_platos'), { id_usuario: luis.uid, nombre: 'X', estado: 'pendiente' }), 'la colección de solicitudes ya no existe para nadie')

console.log('\n4. Viajes realizados (Ana)')
const ana = await entrar(ANA)
const destinoSalar = { id: 'salar-de-uyuni', nombre: 'Salar de Uyuni' }
let manual = await viajes.registrarViajeRealizado(ana.uid, { destino: destinoSalar, fecha_visita: '2025-03-10', fotos: ['https://res.cloudinary.com/x/a.jpg', 'https://res.cloudinary.com/x/b.jpg'], recuerdo: 'Atardecer increíble' })
comprobar(manual.estado === 'realizado' && manual.origen === 'manual' && manual.destinos_visitados.join() === 'salar-de-uyuni', 'registra un viaje manual eligiendo un destino existente')
await debeFallar(viajes.registrarViajeRealizado(ana.uid, { destino: destinoSalar, fecha_visita: '2999-01-01' }), 'fecha de visita en el futuro')
await debeFallar(viajes.registrarViajeRealizado(ana.uid, { fecha_visita: '2025-01-01' }), 'viaje manual sin destino')
await debeFallar(addDoc(collection(db, 'viajes'), { id_usuario: ana.uid, nombre: 'Trampa', paradas: [], estado: 'realizado' }), 'guardar un realizado sin fecha ni destinos (regla)')
await debeFallar(addDoc(collection(db, 'viajes'), { id_usuario: ana.uid, nombre: 'Trampa', paradas: [], estado: 'inventado' }), 'guardar un estado que no existe (regla)')

let plan = await viajes.crearViaje(ana.uid, { nombre: 'Valles 2026', fecha_inicio: '2026-01-05' })
for (const id of ['casa-de-la-moneda', 'salar-de-uyuni', 'laguna-colorada']) plan = await viajes.agregarDestinoAViaje(plan, id)
plan = await viajes.marcarViajeComoRealizado(plan, { fecha_visita: '2026-01-06', destinos_visitados: ['casa-de-la-moneda', 'salar-de-uyuni', 'destino-que-no-esta'], fotos: [], recuerdo: 'Frío pero hermoso' })
const releido = await viajes.getViaje(plan.id)
comprobar(releido.estado === 'realizado' && releido.origen === 'plan' && releido.nombre === 'Valles 2026', 'un viaje planificado pasa a realizado en el MISMO documento')
comprobar(releido.paradas.length === 3 && releido.fecha_inicio === '2026-01-05', 'conserva sus paradas y fechas originales')
comprobar(releido.destinos_visitados.join() === 'casa-de-la-moneda,salar-de-uyuni', 'solo cuenta los destinos visitados que son paradas del viaje')
await debeFallar(viajes.marcarViajeComoRealizado(releido, { fecha_visita: '2026-01-06', destinos_visitados: ['salar-de-uyuni'] }), 'marcar dos veces el mismo viaje')
let cancelado = await viajes.crearViaje(ana.uid, { nombre: 'Viaje cancelado' })
cancelado = await viajes.agregarDestinoAViaje(cancelado, 'laguna-colorada')
cancelado = await viajes.cancelarViaje(cancelado)
let pendiente = await viajes.crearViaje(ana.uid, { nombre: 'Algún día' })
pendiente = await viajes.agregarDestinoAViaje(pendiente, 'isla-del-sol')

manual = await viajes.editarViajeRealizado(manual, { destino: { id: 'laguna-colorada', nombre: 'Laguna Colorada' }, fecha_visita: '2024-08-15', fotos: manual.fotos.slice(0, 1), recuerdo: 'Flamencos rosados' })
const manualReleido = await viajes.getViaje(manual.id)
comprobar(manualReleido.destinos_visitados.join() === 'laguna-colorada' && manualReleido.nombre === 'Visita a Laguna Colorada' && manualReleido.fotos.length === 1, 'edita destino, fecha, fotos y recuerdo de un registro manual')

const deAna = await viajes.getViajesDeUsuario(ana.uid)
const historial = viajes.ordenarHistorial(deAna)
comprobar(historial.map((viaje) => viaje.fecha_visita).join() === '2026-01-06,2024-08-15', 'el historial solo trae realizados, del más reciente al más antiguo')
comprobar(!historial.some((viaje) => viaje.id === cancelado.id || viaje.id === pendiente.id), 'los viajes cancelados y planificados no aparecen en el historial')


console.log('\n5. Privacidad de los viajes')
await entrar(LUIS)
await debeFallar(viajes.getViaje(plan.id), 'Luis abre un viaje realizado de Ana')
await debeFallar(updateDoc(doc(db, 'viajes', manual.id), { recuerdo: 'hackeado' }), 'Luis edita el recuerdo de Ana')
await entrar(ADMIN)
await debeFallar(getDocs(query(collection(db, 'viajes'), where('estado', '==', 'realizado'))), 'la administradora lista los viajes realizados de los usuarios (son privados)')
await debeFallar(viajes.getViaje(pendiente.id), 'la administradora abre un viaje privado')

console.log('\n6. Visitas y contadores públicos')
const idAlojamiento = (await getDocs(collection(db, 'alojamientos'))).docs[0].id
await signOut(auth)
for (let vez = 0; vez < 3; vez += 1) await estadisticas.registrarVisita('restaurante', 'sabores-del-valle', null)
await estadisticas.registrarVisita('restaurante', 'la-casa-del-chicharron', null)
await estadisticas.registrarVisita('alojamiento', idAlojamiento, null)
await estadisticas.registrarVisita('destino', 'salar-de-uyuni', null)
await estadisticas.registrarVisita('destino', 'salar-de-uyuni', null)
let contadores = await estadisticas.getContadoresDeVisitas()
comprobar(contadores['restaurante:sabores-del-valle'] === 3 && contadores['restaurante:la-casa-del-chicharron'] === 1, 'sin sesión se cuentan visitas a restaurantes y se leen los totales públicos')
comprobar(contadores['destino:salar-de-uyuni'] === 2 && contadores[`alojamiento:${idAlojamiento}`] === 1, 'también destinos y alojamientos')
await debeFallar(setDoc(doc(db, 'contadores_visitas', 'restaurante_sabores-del-valle'), { tipo_elemento: 'restaurante', id_elemento: 'sabores-del-valle', total: 999 }), 'inflar un contador a 999')
await debeFallar(updateDoc(doc(db, 'contadores_visitas', 'restaurante_sabores-del-valle'), { total: 8 }), 'sumar más de una visita de golpe')
await debeFallar(setDoc(doc(db, 'contadores_visitas', 'destino_inventado'), { tipo_elemento: 'destino', id_elemento: 'inventado', total: 50 }), 'crear un contador que empiece en 50')
await debeFallar(addDoc(collection(db, 'visitas'), { tipo_elemento: 'evento', id_elemento: 'x', id_usuario: null, fecha: serverTimestamp() }), 'una visita de un tipo no permitido')
await debeFallar(getDocs(collection(db, 'visitas')), 'leer las visitas individuales sin ser administrador')
// Visita con el formato antiguo (anterior a esta actualización).
await addDoc(collection(db, 'visitas'), { id_destino: 'salar-de-uyuni', id_usuario: null, fecha: serverTimestamp() })
comprobar(true, 'se sigue aceptando una visita con el formato antiguo')

console.log('\n7. Reportes de popularidad')
const anaOtraVez = await entrar(ANA)
await resenas.crearResena({ id_usuario: anaOtraVez.uid, nombre_usuario: 'Ana', calificacion: 5, comentario: 'Excelente silpancho', tipo_elemento: 'restaurante', id_elemento: 'sabores-del-valle' })
await resenas.crearResena({ id_usuario: anaOtraVez.uid, nombre_usuario: 'Ana', calificacion: 3, comentario: 'Bien', tipo_elemento: 'restaurante', id_elemento: 'la-casa-del-chicharron' })
const luisResena = await entrar(LUIS)
await resenas.crearResena({ id_usuario: luisResena.uid, nombre_usuario: 'Luis', calificacion: 4, comentario: 'Rico', tipo_elemento: 'restaurante', id_elemento: 'sabores-del-valle' })
await entrar(ADMIN)
const todasVisitas = await estadisticas.getVisitas()
comprobar(todasVisitas.filter((visita) => visita.tipo_elemento === 'destino' && visita.id_elemento === 'salar-de-uyuni').length === 3, 'la administradora lee las visitas (las antiguas se interpretan como de destino)')
const cambiados = await estadisticas.sincronizarContadores(todasVisitas, await estadisticas.getContadoresDeVisitas())
contadores = await estadisticas.getContadoresDeVisitas()
comprobar(cambiados === 1 && contadores['destino:salar-de-uyuni'] === 3, 'la administradora recalcula los contadores e incluye la visita antigua')
await signOut(auth)
const todasResenas = await resenas.getTodasLasResenas()
const restaurantesTodos = await restaurantes.getRestaurantes()
const indicadores = pop.indicadoresPorLugar('restaurante', restaurantesTodos, { visitas: contadores, resenas: todasResenas })
const masVisitados = pop.rankingDeLugares(restaurantesTodos, indicadores, 'visitas')
comprobar(masVisitados[0].lugar.id === 'sabores-del-valle' && masVisitados[0].valor === 3, 'ranking público sin sesión: "Sabores del Valle" es el restaurante más visitado')
const mejores = pop.rankingDeLugares(restaurantesTodos, indicadores, 'promedio')
comprobar(mejores[0].lugar.id === 'sabores-del-valle' && mejores[0].valor === 4.5 && mejores[0].indicador.resenas === 2, 'ranking: mejor calificado con 4,5 estrellas (2 reseñas)')
const departamentosLista = (await getDocs(collection(db, 'departamentos'))).docs.map((documento) => ({ id: documento.id, ...documento.data() }))
const porDepartamento = pop.sumaPorZona(restaurantesTodos, indicadores, 'visitas', departamentosLista)
comprobar(porDepartamento[0].clave === 'cochabamba' && porDepartamento[0].valor === 4 && porDepartamento.length === departamentosLista.length, 'visitas por departamento: Cochabamba 4 (aparecen todos los departamentos, también con 0)')
const enLaPaz = pop.rankingDeLugares(pop.enZona(restaurantesTodos, { idDepartamento: 'la-paz' }), indicadores, 'visitas')
comprobar(enLaPaz.length === 0, 'filtro por departamento: en La Paz todavía no hay restaurantes visitados')
const calificacionDep = pop.promedioPorZona(restaurantesTodos, indicadores, departamentosLista)
comprobar(calificacionDep.length === 1 && calificacionDep[0].valor === 4, 'calificación promedio por departamento (Cochabamba: 4,0 con 3 reseñas)')
const periodo = pop.porPeriodo([new Date(2026, 0, 2), new Date(2026, 0, 2), new Date(2026, 0, 5)], new Date(2026, 0, 1), new Date(2026, 0, 7, 23))
comprobar(periodo.unidad === 'dia' && periodo.datos.length === 7 && periodo.datos[1].valor === 2, 'evolución por día con todos los días del rango')

console.log('\n8. Quitar del historial y eliminar')
await entrar(ANA)
const devuelto = await viajes.devolverAPlanificado(await viajes.getViaje(plan.id))
comprobar(viajes.estadoDeViaje(devuelto) === 'planificado' && devuelto.recuerdo === 'Frío pero hermoso', 'un viaje del planificador vuelve a "planificado" conservando su recuerdo')
await viajes.eliminarViaje(manual)
const final = viajes.ordenarHistorial(await viajes.getViajesDeUsuario(ana.uid))
comprobar(final.length === 0, 'eliminar el registro manual lo quita del historial')
comprobar(Boolean(await getDoc(doc(db, 'destinos', 'laguna-colorada')).then((documento) => documento.exists())), 'el destino original del catálogo no se ve afectado')

console.log(`\n${pruebas - fallas} de ${pruebas} comprobaciones correctas.`)
process.exit(fallas === 0 ? 0 : 1)
