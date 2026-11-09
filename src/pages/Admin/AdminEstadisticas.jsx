import { useEffect, useState } from 'react'
import { BedDouble, LayoutDashboard, MapPin, UtensilsCrossed } from 'lucide-react'
import PanelAdmin from '../../components/PanelAdmin.jsx'
import Grafico from './estadisticas/Grafico.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getDestinos } from '../../services/destinosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { getAlojamientos } from '../../services/alojamientosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getTodasLasResenas } from '../../services/resenasService.js'
import { getUsuarios } from '../../services/usuariosService.js'
import { idElementoDeFavorito, tipoDeFavorito } from '../../services/favoritosService.js'
import { getContadoresDeVisitas, getTodosLosFavoritos, getVisitas, sincronizarContadores } from '../../services/estadisticasService.js'
import { descargarCSV } from '../../utils/csv.js'
import { TIPOS_DE_LUGAR, aFecha, desdeISO, enZona, indicadoresPorLugar, isoDe, porPeriodo, promedioPorZona, rankingDeLugares, sumaPorZona, totalesDe } from '../../utils/popularidad.js'

const DIA_MS = 24 * 60 * 60 * 1000
const PRESETS = [
  { id: '7', etiqueta: '7 días', dias: 7 },
  { id: '30', etiqueta: '30 días', dias: 30 },
  { id: '90', etiqueta: '90 días', dias: 90 },
  { id: 'todo', etiqueta: 'Todo', dias: null },
]
const VISTAS = [
  { id: 'resumen', etiqueta: 'Resumen general', icono: LayoutDashboard },
  { id: 'destino', etiqueta: 'Destinos', icono: MapPin },
  { id: 'restaurante', etiqueta: 'Restaurantes', icono: UtensilsCrossed },
  { id: 'alojamiento', etiqueta: 'Alojamientos', icono: BedDouble },
]
const CLASE_FILTRO = 'mt-1 block w-full min-w-0 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 disabled:bg-slate-50 disabled:text-slate-400'
const UNIDAD_PERIODO = { dia: 'por día', semana: 'por semana', mes: 'por mes' }

function Tarjeta({ titulo, valor, detalle }) {
  return (
    <div className="rounded-xl border border-panel-borde bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{titulo}</p>
      <p className="mt-2 truncate text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums text-slate-900">{valor}</p>
      {detalle && <p className="mt-2 text-xs font-medium text-slate-500">{detalle}</p>}
    </div>
  )
}

const numero = (valor) => Number(valor || 0).toLocaleString('es-BO')
const estrellas = (promedio) => (promedio ? `★ ${promedio.toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : '—')

// Reportes y estadísticas (panel de administración): lo más visitado, mejor
// calificado y más guardado de cada tipo de lugar, por departamento o
// municipio y en el período elegido.
function AdminEstadisticas() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState('destino')
  const [preset, setPreset] = useState('30')
  const [rango, setRango] = useState(() => {
    const hoy = new Date()
    return { desde: isoDe(new Date(hoy.getTime() - 29 * DIA_MS)), hasta: isoDe(hoy) }
  })
  const [zona, setZona] = useState({ idDepartamento: '', idMunicipio: '' })

  useEffect(() => {
    let activo = true
    // Se lee todo una vez y los filtros se aplican en el navegador: cambiar
    // el período o la zona es instantáneo y no gasta lecturas de Firestore.
    Promise.all([
      getUsuarios(),
      getDestinos(),
      getRestaurantes(),
      getAlojamientos(),
      getDepartamentos().then((lista) => (lista.length ? lista : departamentosDeEjemplo)),
      getMunicipios().then((lista) => (lista.length ? lista : municipiosDeEjemplo)).catch(() => municipiosDeEjemplo),
      getTodasLasResenas(),
      getTodosLosFavoritos(),
      getVisitas(),
      getContadoresDeVisitas().catch(() => null),
    ])
      .then(([usuarios, destinos, restaurantes, alojamientos, departamentos, municipios, resenas, favoritos, visitas, contadores]) => {
        if (!activo) return
        setDatos({
          usuarios,
          lugares: { destino: destinos, restaurante: restaurantes, alojamiento: alojamientos },
          departamentos,
          municipios,
          resenas: resenas.filter((resena) => resena.estado !== 'oculta'),
          favoritos: favoritos.map((favorito) => ({ tipo: tipoDeFavorito(favorito), id: idElementoDeFavorito(favorito), fecha: favorito.fecha })),
          visitas,
        })
        // Mantiene al día los totales públicos de "Lo más popular" (incluye
        // las visitas registradas antes de que existieran los contadores).
        if (contadores) {
          sincronizarContadores(visitas, contadores).catch((errorSincronizar) => console.warn('No se pudieron actualizar los contadores públicos:', errorSincronizar.code || errorSincronizar.message))
        }
      })
      .catch((errorLectura) => {
        console.error('Error al cargar los reportes:', errorLectura)
        if (activo) setError('No se pudieron cargar los reportes. Revisa tu conexión y que las reglas de Firestore estén publicadas.')
      })
    return () => {
      activo = false
    }
  }, [])

  function elegirPreset(item) {
    setPreset(item.id)
    const hoy = new Date()
    if (item.dias === null) {
      // "Todo": desde el registro más antiguo que haya.
      const fechas = datos ? [...datos.visitas, ...datos.resenas, ...datos.favoritos].map((registro) => aFecha(registro.fecha)).filter(Boolean) : []
      const masAntigua = fechas.length ? new Date(Math.min(...fechas.map((fecha) => fecha.getTime()))) : hoy
      setRango({ desde: isoDe(masAntigua), hasta: isoDe(hoy) })
      return
    }
    setRango({ desde: isoDe(new Date(hoy.getTime() - (item.dias - 1) * DIA_MS)), hasta: isoDe(hoy) })
  }

  function cambiarFecha(campo, valor) {
    if (!valor) return
    setPreset('personalizado')
    setRango((actual) => ({ ...actual, [campo]: valor }))
  }

  const encabezado = (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-panel-borde bg-white p-1" role="tablist" aria-label="Qué reporte ver">
      {VISTAS.map(({ id, etiqueta, icono: Icono }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={vista === id}
          onClick={() => setVista(id)}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition-colors ${vista === id ? 'bg-panel-texto text-white' : 'text-panel-texto hover:bg-panel-fondo'}`}
        >
          <Icono aria-hidden="true" size={16} /> {etiqueta}
        </button>
      ))}
    </div>
  )

  if (error || !datos) {
    return (
      <PanelAdmin titulo="Reportes y estadísticas">
        {encabezado}
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, indice) => <div key={indice} className="h-28 animate-pulse rounded-xl border border-panel-borde bg-white" />)}
          </div>
        )}
      </PanelAdmin>
    )
  }

  // ---------- Filtros aplicados ----------
  const desde = desdeISO(rango.desde)
  const hasta = desdeISO(rango.hasta, true)
  const enRango = (registro) => {
    const fecha = aFecha(registro.fecha)
    return fecha && fecha >= desde && fecha <= hasta
  }
  const visitas = datos.visitas.filter(enRango)
  const resenas = datos.resenas.filter(enRango)
  const favoritos = datos.favoritos.filter(enRango)
  const nombreDepartamento = datos.departamentos.find((item) => item.id === zona.idDepartamento)?.nombre
  const nombreMunicipio = datos.municipios.find((item) => item.id === zona.idMunicipio)?.nombre
  const textoZona = nombreMunicipio ? `${nombreMunicipio}, ${nombreDepartamento}` : nombreDepartamento || 'toda Bolivia'
  // Con un departamento elegido, los gráficos por zona pasan a mostrar sus municipios.
  const porMunicipio = Boolean(zona.idDepartamento)
  const zonas = porMunicipio ? datos.municipios.filter((municipio) => municipio.id_departamento === zona.idDepartamento) : datos.departamentos
  const campoZona = porMunicipio ? 'id_municipio' : 'id_departamento'
  const nombreZona = porMunicipio ? 'Municipio' : 'Departamento'

  const porTipo = Object.fromEntries(Object.keys(TIPOS_DE_LUGAR).map((tipo) => {
    const lugares = enZona(datos.lugares[tipo], zona)
    const indicadores = indicadoresPorLugar(tipo, datos.lugares[tipo], { visitas, resenas, favoritos })
    return [tipo, { lugares, indicadores, totales: totalesDe(lugares, indicadores) }]
  }))

  const filtros = (
    <div className="mb-6 space-y-3 rounded-2xl p-4 cristal">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Período rápido">
          {PRESETS.map((item) => (
            <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => elegirPreset(item)} className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${preset === item.id ? 'border-panel-texto bg-panel-texto text-white' : 'border-panel-borde bg-white text-panel-texto hover:border-slate-300'}`}>
              {item.etiqueta}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Desde
          <input type="date" value={rango.desde} max={rango.hasta} onChange={(evento) => cambiarFecha('desde', evento.target.value)} className={CLASE_FILTRO} />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Hasta
          <input type="date" value={rango.hasta} min={rango.desde} onChange={(evento) => cambiarFecha('hasta', evento.target.value)} className={CLASE_FILTRO} />
        </label>
        <label className="min-w-44 text-xs font-bold uppercase tracking-wider text-slate-500">
          Departamento
          <select value={zona.idDepartamento} onChange={(evento) => setZona({ idDepartamento: evento.target.value, idMunicipio: '' })} className={CLASE_FILTRO}>
            <option value="">Toda Bolivia</option>
            {datos.departamentos.map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>)}
          </select>
        </label>
        <label className="min-w-44 text-xs font-bold uppercase tracking-wider text-slate-500">
          Municipio
          <select value={zona.idMunicipio} disabled={!zona.idDepartamento} onChange={(evento) => setZona((actual) => ({ ...actual, idMunicipio: evento.target.value }))} className={CLASE_FILTRO}>
            <option value="">{zona.idDepartamento ? 'Todos' : 'Elige un departamento'}</option>
            {porMunicipio && zonas.map((municipio) => <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>)}
          </select>
        </label>
        {(zona.idDepartamento || preset !== '30') && (
          <button type="button" onClick={() => { setZona({ idDepartamento: '', idMunicipio: '' }); elegirPreset(PRESETS[1]) }} className="rounded-lg px-3 py-2 text-sm font-bold text-panel-texto hover:bg-white">Limpiar filtros</button>
        )}
      </div>
    </div>
  )

  let contenido
  if (vista === 'resumen') {
    const nuevosUsuarios = datos.usuarios.filter((usuario) => {
      const fecha = aFecha(usuario.fechaRegistro)
      return fecha && fecha >= desde && fecha <= hasta
    })
    const total = (campo) => Object.values(porTipo).reduce((suma, { totales }) => suma + totales[campo], 0)
    const resenasZona = Object.values(porTipo).reduce((suma, { totales }) => suma + (totales.promedio || 0) * totales.resenas, 0)
    const promedioGeneral = total('resenas') ? resenasZona / total('resenas') : null
    const visitasPorTipo = Object.values(TIPOS_DE_LUGAR).map((tipo) => ({ clave: tipo.id, etiqueta: tipo.plural, valor: porTipo[tipo.id].totales.visitas }))
    // Popularidad de cada zona = visitas + reseñas + favoritos de todos sus lugares.
    const popularidadPorZona = zonas.map((item) => {
      const valor = Object.keys(TIPOS_DE_LUGAR).reduce((suma, tipo) => {
        const { lugares, indicadores } = porTipo[tipo]
        return suma + lugares.filter((lugar) => lugar[campoZona] === item.id).reduce((parcial, lugar) => {
          const indicador = indicadores.get(lugar.id)
          return parcial + indicador.visitas + indicador.resenas + indicador.favoritos
        }, 0)
      }, 0)
      return { clave: item.id, etiqueta: item.nombre, valor }
    }).sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta, 'es'))
    const idsEnZona = new Set(Object.entries(porTipo).flatMap(([tipo, { lugares }]) => lugares.map((lugar) => `${tipo}:${lugar.id}`)))
    const visitasZona = visitas.filter((visita) => idsEnZona.has(`${visita.tipo_elemento}:${visita.id_elemento}`))
    const evolucion = porPeriodo(visitasZona.map((visita) => aFecha(visita.fecha)), desde, hasta)
    const resenasZonaLista = resenas.filter((resena) => idsEnZona.has(`${resena.tipo_elemento}:${resena.id_elemento}`))
    const distribucion = [5, 4, 3, 2, 1].map((cantidad) => ({
      etiqueta: `${'★'.repeat(cantidad)} (${cantidad})`,
      valor: resenasZonaLista.filter((resena) => Math.round(Number(resena.calificacion)) === cantidad).length,
    }))

    contenido = (
      <>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Tarjeta titulo="Usuarios" valor={numero(datos.usuarios.length)} detalle={`+${nuevosUsuarios.length} nuevos en el período`} />
          <Tarjeta titulo="Visitas" valor={numero(total('visitas'))} detalle={`a fichas en ${textoZona}`} />
          <Tarjeta titulo="Reseñas" valor={numero(total('resenas'))} detalle={promedioGeneral ? `${estrellas(promedioGeneral)} de promedio` : 'sin calificaciones'} />
          <Tarjeta titulo="Favoritos" valor={numero(total('favoritos'))} detalle="lugares guardados" />
          <Tarjeta titulo="Lugares publicados" valor={numero(total('lugares'))} detalle="destinos, restaurantes y alojamientos" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Grafico titulo="Visitas por tipo de lugar" descripcion="Visitas a las fichas en el período" datos={visitasPorTipo} unidad="visitas" archivo="visitas-por-tipo" vacio="Aún no hay visitas en este período. Las de restaurantes y alojamientos se cuentan desde esta actualización." />
          <Grafico titulo="Distribución de calificaciones" descripcion="Cuántas reseñas recibió cada puntuación" datos={distribucion} unidad="reseñas" archivo="distribucion-calificaciones" />
          <div className="lg:col-span-2">
            <Grafico titulo={`${nombreZona === 'Municipio' ? 'Municipios' : 'Departamentos'} más populares`} descripcion="Visitas, reseñas y favoritos de todos sus lugares" datos={popularidadPorZona} unidad="interacciones" orientacion="vertical" columna={nombreZona} archivo="zonas-mas-populares" />
          </div>
          <div className="lg:col-span-2">
            <Grafico titulo={`Visitas ${UNIDAD_PERIODO[evolucion.unidad]}`} descripcion={`Todas las fichas visitadas en ${textoZona}`} datos={evolucion.datos} unidad="visitas" tipo="linea" archivo="visitas-en-el-tiempo" />
          </div>
        </div>
      </>
    )
  } else {
    const tipo = TIPOS_DE_LUGAR[vista]
    const { lugares, indicadores, totales } = porTipo[vista]
    const detalle = (lugar) => lugar.ubicacion || [datos.municipios.find((item) => item.id === lugar.id_municipio)?.nombre, datos.departamentos.find((item) => item.id === lugar.id_departamento)?.nombre].filter(Boolean).join(', ')
    const aGrafico = (lista, conResenas = false) => lista.map(({ lugar, valor, indicador }) => ({
      etiqueta: lugar.nombre || 'Sin nombre',
      valor: conResenas ? Math.round(valor * 10) / 10 : valor,
      detalle: conResenas ? `${indicador.resenas} ${indicador.resenas === 1 ? 'reseña' : 'reseñas'} · ${detalle(lugar)}` : detalle(lugar),
    }))
    const masVisitados = aGrafico(rankingDeLugares(lugares, indicadores, 'visitas'))
    const mejorCalificados = aGrafico(rankingDeLugares(lugares, indicadores, 'promedio'), true)
    const masGuardados = aGrafico(rankingDeLugares(lugares, indicadores, 'favoritos'))
    const visitasPorZona = sumaPorZona(lugares, indicadores, 'visitas', zonas, campoZona)
    const calificacionPorZona = promedioPorZona(lugares, indicadores, zonas, campoZona)
    const idsEnZona = new Set(lugares.map((lugar) => lugar.id))
    const evolucion = porPeriodo(visitas.filter((visita) => visita.tipo_elemento === vista && idsEnZona.has(visita.id_elemento)).map((visita) => aFecha(visita.fecha)), desde, hasta)
    const lider = rankingDeLugares(lugares, indicadores, 'visitas', 1)[0]
    const plural = tipo.plural.toLocaleLowerCase('es')

    function exportarDetalle() {
      descargarCSV(`reporte-${plural}-${rango.desde}-a-${rango.hasta}`, lugares.map((lugar) => {
        const indicador = indicadores.get(lugar.id)
        return {
          Nombre: lugar.nombre,
          Departamento: datos.departamentos.find((item) => item.id === lugar.id_departamento)?.nombre || '',
          Municipio: datos.municipios.find((item) => item.id === lugar.id_municipio)?.nombre || '',
          Visitas: indicador.visitas,
          Reseñas: indicador.resenas,
          'Calificación promedio': indicador.promedio ? indicador.promedio.toFixed(2) : '',
          Favoritos: indicador.favoritos,
        }
      }).sort((a, b) => b.Visitas - a.Visitas))
    }

    contenido = (
      <>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta titulo={`${tipo.plural} publicados`} valor={numero(totales.lugares)} detalle={`en ${textoZona}`} />
          <Tarjeta titulo="Visitas" valor={numero(totales.visitas)} detalle={lider ? `La más visitada: ${lider.lugar.nombre}` : 'sin visitas en el período'} />
          <Tarjeta titulo="Calificación promedio" valor={estrellas(totales.promedio)} detalle={`${numero(totales.resenas)} reseñas en el período`} />
          <Tarjeta titulo="Favoritos" valor={numero(totales.favoritos)} detalle={`veces que guardaron ${plural}`} />
        </div>
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={exportarDetalle} className="rounded-lg border border-panel-borde bg-white px-4 py-2.5 text-sm font-bold text-panel-texto transition-colors hover:border-slate-300 hover:bg-panel-fondo">
            Exportar reporte de {plural} (CSV)
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Grafico titulo={`${tipo.plural} más visitados`} descripcion="Visitas a su ficha en el período" datos={masVisitados} unidad="visitas" archivo={`${plural}-mas-visitados`} vacio={vista === 'destino' ? 'Aún no hay visitas en este período.' : `Aún no hay visitas en este período. Las visitas a ${plural} se cuentan desde esta actualización.`} />
          <Grafico titulo={`${tipo.plural} mejor calificados`} descripcion="Promedio de estrellas de las reseñas del período" datos={mejorCalificados} unidad="estrellas" decimales maximo={5} archivo={`${plural}-mejor-calificados`} vacio="Aún no hay reseñas en este período." />
          <Grafico titulo={`Visitas por ${nombreZona.toLocaleLowerCase('es')}`} descripcion={`Comparación de las visitas a ${plural}`} datos={visitasPorZona} unidad="visitas" orientacion="vertical" columna={nombreZona} archivo={`visitas-${plural}-por-zona`} />
          <Grafico titulo={`Calificación por ${nombreZona.toLocaleLowerCase('es')}`} descripcion="Promedio de las reseñas de sus lugares" datos={calificacionPorZona} unidad="estrellas" decimales maximo={5} archivo={`calificacion-${plural}-por-zona`} vacio="Aún no hay reseñas en este período." />
          <Grafico titulo={`${tipo.plural} más guardados en favoritos`} datos={masGuardados} unidad="favoritos" archivo={`${plural}-mas-guardados`} />
          <Grafico titulo={`Visitas ${UNIDAD_PERIODO[evolucion.unidad]}`} descripcion={`Evolución de las visitas a ${plural}`} datos={evolucion.datos} unidad="visitas" tipo="linea" archivo={`visitas-${plural}-en-el-tiempo`} />
        </div>
      </>
    )
  }

  return (
    <PanelAdmin titulo="Reportes y estadísticas">
      {encabezado}
      {filtros}
      {contenido}
    </PanelAdmin>
  )
}

export default AdminEstadisticas
