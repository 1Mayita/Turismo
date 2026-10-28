import { useEffect, useState } from 'react'
import PanelAdmin from '../../components/PanelAdmin.jsx'
import Grafico from './estadisticas/Grafico.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getDestinos } from '../../services/destinosService.js'
import { getTodasLasResenas } from '../../services/resenasService.js'
import { getUsuarios } from '../../services/usuariosService.js'
import { getTodosLosFavoritos, getVisitas } from '../../services/estadisticasService.js'
import { descargarCSV } from '../../utils/csv.js'

const DIA_MS = 24 * 60 * 60 * 1000
const MAXIMO_EN_RANKING = 8
const PRESETS = [
  { id: '7', etiqueta: '7 días', dias: 7 },
  { id: '30', etiqueta: '30 días', dias: 30 },
  { id: '90', etiqueta: '90 días', dias: 90 },
  { id: 'todo', etiqueta: 'Todo', dias: null },
]

function aFecha(valor) {
  if (typeof valor?.toDate === 'function') return valor.toDate()
  if (typeof valor === 'number' || typeof valor === 'string') return new Date(valor)
  return null
}

function isoDe(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function desdeISO(texto, finDelDia = false) {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return finDelDia ? new Date(anio, mes - 1, dia, 23, 59, 59) : new Date(anio, mes - 1, dia)
}

// Cuenta por clave y devuelve el ranking [{ etiqueta, valor, detalle }].
function ranking(lista, claveDe, etiquetaDe, detalleDe) {
  const conteo = new Map()
  lista.forEach((item) => {
    const clave = claveDe(item)
    if (clave) conteo.set(clave, (conteo.get(clave) || 0) + 1)
  })
  return [...conteo.entries()]
    .map(([clave, valor]) => ({ etiqueta: etiquetaDe(clave), valor, detalle: detalleDe?.(clave) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, MAXIMO_EN_RANKING)
}

// Agrupa fechas por día, semana o mes según el largo del rango.
function porPeriodo(fechas, desde, hasta) {
  const dias = Math.max(1, Math.round((hasta - desde) / DIA_MS))
  const unidad = dias <= 31 ? 'dia' : dias <= 182 ? 'semana' : 'mes'
  const claveDe = (fecha) => {
    if (unidad === 'dia') return isoDe(fecha)
    if (unidad === 'mes') return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const lunes = new Date(fecha)
    lunes.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7))
    return isoDe(lunes)
  }
  const etiquetaDe = (clave) => {
    if (unidad === 'mes') {
      const [anio, mes] = clave.split('-').map(Number)
      return new Date(anio, mes - 1, 1).toLocaleDateString('es-BO', { month: 'short', year: '2-digit' })
    }
    const texto = desdeISO(clave).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
    return unidad === 'semana' ? `Sem. ${texto}` : texto
  }
  // Todos los períodos del rango, también los que tienen 0.
  const claves = []
  for (let cursor = new Date(desde); cursor <= hasta; cursor = new Date(cursor.getTime() + DIA_MS)) {
    const clave = claveDe(cursor)
    if (claves[claves.length - 1] !== clave && !claves.includes(clave)) claves.push(clave)
  }
  const conteo = new Map(claves.map((clave) => [clave, 0]))
  fechas.forEach((fecha) => {
    const clave = claveDe(fecha)
    if (conteo.has(clave)) conteo.set(clave, conteo.get(clave) + 1)
  })
  return { unidad, datos: claves.map((clave) => ({ etiqueta: etiquetaDe(clave), valor: conteo.get(clave) })) }
}

function Tarjeta({ titulo, valor, detalle }) {
  return (
    <div className="rounded-xl border border-panel-borde bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{titulo}</p>
      <p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums text-slate-900">{valor}</p>
      {detalle && <p className="mt-2 text-xs font-medium text-slate-500">{detalle}</p>}
    </div>
  )
}

// Panel de estadísticas para administradores (HU-36).
function AdminEstadisticas() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [preset, setPreset] = useState('30')
  const [rango, setRango] = useState(() => {
    const hoy = new Date()
    return { desde: isoDe(new Date(hoy.getTime() - 29 * DIA_MS)), hasta: isoDe(hoy) }
  })

  useEffect(() => {
    let activo = true
    // Se lee todo una vez y el filtro de fechas se aplica en el navegador:
    // cambiar el rango es instantáneo y no gasta lecturas de Firestore.
    Promise.all([
      getUsuarios(),
      getDestinos(),
      getDepartamentos().then((lista) => (lista.length ? lista : departamentosDeEjemplo)),
      getTodasLasResenas(),
      getTodosLosFavoritos(),
      getVisitas(),
    ])
      .then(([usuarios, destinos, departamentos, resenas, favoritos, visitas]) => {
        if (activo) setDatos({ usuarios, destinos, departamentos, resenas, favoritos, visitas })
      })
      .catch((errorLectura) => {
        console.error('Error al cargar estadísticas:', errorLectura)
        if (activo) setError('No se pudieron cargar las estadísticas. Revisa tu conexión y que las reglas de Firestore publicadas incluyan "visitas".')
      })
    return () => {
      activo = false
    }
  }, [])

  function elegirPreset(item) {
    setPreset(item.id)
    if (!datos || item.dias === null) {
      // "Todo": desde el registro más antiguo que haya.
      const fechas = datos ? [...datos.visitas, ...datos.resenas, ...datos.favoritos].map((registro) => aFecha(registro.fecha)).filter(Boolean) : []
      const masAntigua = fechas.length ? new Date(Math.min(...fechas.map((fecha) => fecha.getTime()))) : new Date()
      setRango({ desde: isoDe(masAntigua), hasta: isoDe(new Date()) })
      return
    }
    const hoy = new Date()
    setRango({ desde: isoDe(new Date(hoy.getTime() - (item.dias - 1) * DIA_MS)), hasta: isoDe(hoy) })
  }

  function cambiarFecha(campo, valor) {
    if (!valor) return
    setPreset('personalizado')
    setRango((actual) => ({ ...actual, [campo]: valor }))
  }

  if (error || !datos) {
    return (
      <PanelAdmin titulo="Estadísticas">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, indice) => <div key={indice} className="h-28 animate-pulse rounded-xl border border-panel-borde bg-white" />)}
          </div>
        )}
      </PanelAdmin>
    )
  }

  const desde = desdeISO(rango.desde)
  const hasta = desdeISO(rango.hasta, true)
  const enRango = (registro) => {
    const fecha = aFecha(registro.fecha)
    return fecha && fecha >= desde && fecha <= hasta
  }
  const destinoPorId = new Map(datos.destinos.map((destino) => [destino.id, destino]))
  const nombreDestino = (id) => destinoPorId.get(id)?.nombre || 'Destino eliminado'
  const departamentoPorId = new Map(datos.departamentos.map((departamento) => [departamento.id, departamento.nombre]))

  const visitas = datos.visitas.filter(enRango)
  const resenas = datos.resenas.filter((resena) => (resena.tipo_elemento || 'destino') === 'destino' && enRango(resena))
  const favoritosDestino = datos.favoritos.filter((favorito) => (favorito.tipo_favorito || 'destino') === 'destino' && enRango(favorito))
  const nuevosUsuarios = datos.usuarios.filter((usuario) => {
    const fecha = aFecha(usuario.fechaRegistro)
    return fecha && fecha >= desde && fecha <= hasta
  })

  const masVisitados = ranking(visitas, (visita) => visita.id_destino, nombreDestino, (id) => destinoPorId.get(id)?.ubicacion)
  // Popularidad del departamento = visitas + favoritos + reseñas de sus destinos.
  const interacciones = [...visitas, ...favoritosDestino.map((favorito) => ({ id_destino: favorito.id_elemento || favorito.id_destino })), ...resenas]
  const departamentosPopulares = ranking(interacciones, (registro) => destinoPorId.get(registro.id_destino)?.id_departamento, (id) => departamentoPorId.get(id) || id)
  const masGuardados = ranking(favoritosDestino, (favorito) => favorito.id_elemento || favorito.id_destino, nombreDestino, (id) => destinoPorId.get(id)?.ubicacion)
  const resenasPorPeriodo = porPeriodo(resenas.map((resena) => aFecha(resena.fecha)), desde, hasta)
  const promedio = resenas.length ? resenas.reduce((suma, resena) => suma + (Number(resena.calificacion) || 0), 0) / resenas.length : 0
  const distribucion = [5, 4, 3, 2, 1].map((estrellas) => ({
    etiqueta: `${'★'.repeat(estrellas)} (${estrellas})`,
    valor: resenas.filter((resena) => Math.round(Number(resena.calificacion)) === estrellas).length,
  }))
  const etiquetaUnidad = { dia: 'por día', semana: 'por semana', mes: 'por mes' }[resenasPorPeriodo.unidad]

  function exportarResumen() {
    descargarCSV(`resumen-${rango.desde}-a-${rango.hasta}`, [
      { Indicador: 'Usuarios registrados (total)', Valor: datos.usuarios.length },
      { Indicador: 'Usuarios nuevos en el período', Valor: nuevosUsuarios.length },
      { Indicador: 'Destinos publicados', Valor: datos.destinos.length },
      { Indicador: 'Visitas a destinos en el período', Valor: visitas.length },
      { Indicador: 'Reseñas de destinos en el período', Valor: resenas.length },
      { Indicador: 'Calificación promedio en el período', Valor: promedio ? promedio.toFixed(2) : '' },
      { Indicador: 'Destinos guardados en favoritos en el período', Valor: favoritosDestino.length },
    ])
  }

  return (
    <PanelAdmin titulo="Estadísticas">
      {/* Filtros en una sola fila sobre los gráficos. */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4 cristal">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Período rápido">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={preset === item.id}
              onClick={() => elegirPreset(item)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${preset === item.id ? 'border-panel-texto bg-panel-texto text-white' : 'border-panel-borde bg-white text-panel-texto hover:border-slate-300'}`}
            >
              {item.etiqueta}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Desde
          <input type="date" value={rango.desde} max={rango.hasta} onChange={(evento) => cambiarFecha('desde', evento.target.value)} className="mt-1 block rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-normal text-slate-800" />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Hasta
          <input type="date" value={rango.hasta} min={rango.desde} onChange={(evento) => cambiarFecha('hasta', evento.target.value)} className="mt-1 block rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-normal text-slate-800" />
        </label>
        <button type="button" onClick={exportarResumen} className="ml-auto rounded-lg border border-panel-borde bg-white px-4 py-2.5 text-sm font-bold text-panel-texto transition-colors hover:border-slate-300 hover:bg-panel-fondo">Exportar resumen (CSV)</button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Tarjeta titulo="Usuarios" valor={datos.usuarios.length.toLocaleString('es-BO')} detalle={`+${nuevosUsuarios.length} nuevos en el período`} />
        <Tarjeta titulo="Destinos" valor={datos.destinos.length.toLocaleString('es-BO')} detalle="publicados" />
        <Tarjeta titulo="Visitas" valor={visitas.length.toLocaleString('es-BO')} detalle="a fichas de destinos" />
        <Tarjeta titulo="Reseñas" valor={resenas.length.toLocaleString('es-BO')} detalle={promedio ? `★ ${promedio.toFixed(1)} de promedio` : 'sin calificaciones'} />
        <Tarjeta titulo="Favoritos" valor={favoritosDestino.length.toLocaleString('es-BO')} detalle="destinos guardados" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Grafico titulo="Destinos más visitados" descripcion="Visitas a la ficha de cada destino" datos={masVisitados} unidad="visitas" archivo="destinos-mas-visitados" vacio="Aún no hay visitas registradas en este período. Se cuentan desde que se activó el Sprint 3." />
        <Grafico titulo="Departamentos más populares" descripcion="Visitas, favoritos y reseñas de sus destinos" datos={departamentosPopulares} unidad="interacciones" archivo="departamentos-populares" />
        <Grafico titulo="Destinos más guardados en favoritos" datos={masGuardados} unidad="favoritos" archivo="destinos-mas-guardados" />
        <Grafico titulo={`Reseñas ${etiquetaUnidad}`} descripcion="Reseñas de destinos publicadas" datos={resenasPorPeriodo.datos} unidad="reseñas" orientacion="vertical" archivo="resenas-por-periodo" />
        <div className="lg:col-span-2">
          <Grafico
            titulo={promedio ? `Calificaciones: ★ ${promedio.toFixed(2)} de promedio` : 'Calificaciones'}
            descripcion="Cuántas reseñas recibió cada puntuación"
            datos={distribucion}
            unidad="reseñas"
            archivo="distribucion-calificaciones"
          />
        </div>
      </div>
    </PanelAdmin>
  )
}

export default AdminEstadisticas
