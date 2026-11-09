import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BedDouble, Eye, MapPin, Star, Trophy, UtensilsCrossed } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { Aparecer, EstadoVacio, claseControl, claseEtiqueta } from '../../components/ui'
import Grafico from '../Admin/estadisticas/Grafico.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getDestinos } from '../../services/destinosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { getAlojamientos } from '../../services/alojamientosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getTodasLasResenas } from '../../services/resenasService.js'
import { getContadoresDeVisitas } from '../../services/estadisticasService.js'
import { TIPOS_DE_LUGAR, enZona, indicadoresPorLugar, promedioPorZona, rankingDeLugares, sumaPorZona } from '../../utils/popularidad.js'

const PESTANAS = [
  { id: 'destino', etiqueta: 'Destinos', icono: MapPin },
  { id: 'restaurante', etiqueta: 'Restaurantes', icono: UtensilsCrossed },
  { id: 'alojamiento', etiqueta: 'Alojamientos', icono: BedDouble },
]

const formatoEstrellas = (valor) => valor.toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Podio (los 3 primeros con foto grande) y el resto de la lista con una barra
// proporcional, para leer el ranking de un vistazo.
function Ranking({ items, tipo, metrica, zonaDe }) {
  if (items.length === 0) return null
  const maximo = items[0].valor
  const valorTexto = (item) => (metrica === 'promedio'
    ? <><Star aria-hidden="true" size={14} className="fill-current text-atardecer-texto" /> {formatoEstrellas(item.valor)} <span className="font-normal text-piedra-texto">({item.indicador.resenas} {item.indicador.resenas === 1 ? 'reseña' : 'reseñas'})</span></>
    : <><Eye aria-hidden="true" size={14} className="text-cielo-700" /> {item.valor.toLocaleString('es-BO')} {item.valor === 1 ? 'visita' : 'visitas'}</>)

  return (
    <div>
      <ol className="grid gap-4 sm:grid-cols-3">
        {items.slice(0, 3).map((item, indice) => (
          <Aparecer key={item.lugar.id} como="li" indice={indice}>
            <Link to={`${tipo.ruta}/${item.lugar.id}`} className="group tarjeta-hover relative flex h-72 flex-col justify-end overflow-hidden rounded-tarjeta bg-noche text-white">
              <ImagenSegura src={tipo.foto(item.lugar)} alt="" loading="lazy" className="zoom-foto absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-noche via-noche/40 to-transparent" aria-hidden="true" />
              <span className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold shadow-suave ${indice === 0 ? 'bg-atardecer-700 text-noche' : 'bg-white/95 text-noche'}`}>
                <span className="sr-only">Puesto </span>{indice + 1}
              </span>
              <span className="relative p-5">
                <span className="titulo-display block text-[28px] leading-tight">{item.lugar.nombre}</span>
                {zonaDe(item.lugar) && <span className="mt-1 flex items-center gap-1 text-sm text-white/80"><MapPin aria-hidden="true" size={13} /> {zonaDe(item.lugar)}</span>}
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-noche">{valorTexto(item)}</span>
              </span>
            </Link>
          </Aparecer>
        ))}
      </ol>
      {items.length > 3 && (
        <ol start={4} className="mt-4 divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-white">
          {items.slice(3).map((item, indice) => (
            <li key={item.lugar.id}>
              <Link to={`${tipo.ruta}/${item.lugar.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-sal">
                <span className="w-6 shrink-0 text-center font-bold tabular-nums text-piedra-texto">{indice + 4}</span>
                <ImagenSegura src={tipo.foto(item.lugar)} alt="" loading="lazy" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-noche">{item.lugar.nombre}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-sal-2" aria-hidden="true">
                    <span className="block h-full rounded-full bg-cielo-700/70" style={{ width: `${Math.max(6, (item.valor / maximo) * 100)}%` }} />
                  </span>
                </span>
                <span className="hidden shrink-0 items-center gap-1 text-sm font-bold text-noche sm:inline-flex">{valorTexto(item)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// "Lo más popular": rankings públicos de destinos, restaurantes y alojamientos
// (más visitados y mejor calificados), por departamento, con gráficos.
function Populares() {
  const [parametros, setParametros] = useSearchParams()
  const vista = PESTANAS.some((item) => item.id === parametros.get('tipo')) ? parametros.get('tipo') : 'destino'
  const idDepartamento = parametros.get('departamento') || ''
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    Promise.all([
      getDestinos(),
      getRestaurantes(),
      getAlojamientos(),
      getDepartamentos().then((lista) => (lista.length ? lista : departamentosDeEjemplo)).catch(() => departamentosDeEjemplo),
      getMunicipios().then((lista) => (lista.length ? lista : municipiosDeEjemplo)).catch(() => municipiosDeEjemplo),
      getTodasLasResenas().catch(() => []),
      getContadoresDeVisitas().catch((errorContadores) => {
        console.warn('No se pudieron leer los contadores de visitas:', errorContadores.code || errorContadores.message)
        return null
      }),
    ])
      .then(([destinos, restaurantes, alojamientos, departamentos, municipios, resenas, contadores]) => {
        if (activo) setDatos({ lugares: { destino: destinos, restaurante: restaurantes, alojamiento: alojamientos }, departamentos, municipios, resenas, contadores })
      })
      .catch((errorLectura) => {
        console.error('Error al cargar los rankings:', errorLectura)
        if (activo) setError('No pudimos cargar los rankings. Revisa tu conexión e inténtalo de nuevo.')
      })
    return () => {
      activo = false
    }
  }, [])

  function cambiar(campo, valor) {
    setParametros((actuales) => {
      const nuevos = new URLSearchParams(actuales)
      if (valor) nuevos.set(campo, valor)
      else nuevos.delete(campo)
      return nuevos
    }, { replace: true })
  }

  const tipo = TIPOS_DE_LUGAR[vista]
  const plural = tipo.plural.toLocaleLowerCase('es')
  let contenido

  if (error) {
    contenido = <p className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
  } else if (!datos) {
    contenido = <div className="grid gap-4 sm:grid-cols-3" aria-label="Cargando rankings">{[0, 1, 2].map((indice) => <div key={indice} className="h-72 animate-pulse rounded-tarjeta bg-sal-2" />)}</div>
  } else {
    const todos = datos.lugares[vista]
    const lugares = enZona(todos, { idDepartamento })
    const indicadores = indicadoresPorLugar(vista, todos, { visitas: datos.contadores || {}, resenas: datos.resenas })
    const masVisitados = rankingDeLugares(lugares, indicadores, 'visitas', 10)
    const mejorCalificados = rankingDeLugares(lugares, indicadores, 'promedio', 10)
    const nombreDe = (lista, id) => lista.find((item) => item.id === id)?.nombre
    const zonaDe = (lugar) => [nombreDe(datos.municipios, lugar.id_municipio), idDepartamento ? '' : nombreDe(datos.departamentos, lugar.id_departamento)].filter(Boolean).join(', ') || lugar.ubicacion
    const porMunicipio = Boolean(idDepartamento)
    const zonas = porMunicipio ? datos.municipios.filter((municipio) => municipio.id_departamento === idDepartamento) : datos.departamentos
    const campo = porMunicipio ? 'id_municipio' : 'id_departamento'
    const nombreZona = porMunicipio ? 'municipio' : 'departamento'
    const visitasPorZona = sumaPorZona(lugares, indicadores, 'visitas', zonas, campo)
    const calificacionPorZona = promedioPorZona(lugares, indicadores, zonas, campo)
    const nada = masVisitados.length === 0 && mejorCalificados.length === 0

    contenido = nada ? (
      <EstadoVacio
        icono={Trophy}
        titulo={`Todavía no hay ${plural} destacados${idDepartamento ? ' en este departamento' : ''}`}
        mensaje="El ranking se arma con las visitas y las reseñas de los viajeros. ¡Explora y deja tu opinión!"
        accion={<Link to={tipo.ruta} className="inline-flex min-h-11 items-center rounded-control bg-noche px-5 font-bold text-white">Ver {plural}</Link>}
      />
    ) : (
      <div className="space-y-14">
        <section aria-labelledby="titulo-visitados">
          <div className="mb-5">
            <h2 id="titulo-visitados" className="titulo-display text-[34px] sm:text-[40px]">Los más visitados</h2>
            <p className="text-piedra-texto">Los {plural} que más personas abrieron en Kuntur.</p>
          </div>
          {datos.contadores === null ? (
            <p className="rounded-control bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">Por ahora no podemos mostrar las visitas. Mira abajo los mejor calificados.</p>
          ) : masVisitados.length > 0 ? (
            <Ranking items={masVisitados} tipo={tipo} metrica="visitas" zonaDe={zonaDe} />
          ) : (
            <p className="rounded-control border border-dashed border-borde bg-white/60 px-4 py-6 text-center text-sm text-piedra-texto">Todavía no hay visitas registradas para {plural}{idDepartamento ? ' de este departamento' : ''}.</p>
          )}
        </section>

        <section aria-labelledby="titulo-calificados">
          <div className="mb-5">
            <h2 id="titulo-calificados" className="titulo-display text-[34px] sm:text-[40px]">Los mejor calificados</h2>
            <p className="text-piedra-texto">Según las estrellas que dejaron los viajeros en sus reseñas.</p>
          </div>
          {mejorCalificados.length > 0 ? (
            <Ranking items={mejorCalificados} tipo={tipo} metrica="promedio" zonaDe={zonaDe} />
          ) : (
            <p className="rounded-control border border-dashed border-borde bg-white/60 px-4 py-6 text-center text-sm text-piedra-texto">Todavía no hay reseñas de {plural}{idDepartamento ? ' de este departamento' : ''}.</p>
          )}
        </section>

        <section aria-labelledby="titulo-zonas">
          <h2 id="titulo-zonas" className="titulo-display mb-5 text-[34px] sm:text-[40px]">{porMunicipio ? 'Por municipio' : 'Por departamento'}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {datos.contadores !== null && (
              <Grafico className="shadow-suave" titulo={`Visitas a ${plural} por ${nombreZona}`} descripcion="Dónde está lo que más se visita" datos={visitasPorZona} unidad="visitas" orientacion="vertical" columna={porMunicipio ? 'Municipio' : 'Departamento'} archivo={`visitas-${plural}-por-${nombreZona}`} vacio="Todavía no hay visitas registradas." />
            )}
            <Grafico className="shadow-suave" titulo={`Calificación de ${plural} por ${nombreZona}`} descripcion="Promedio de estrellas de las reseñas" datos={calificacionPorZona} unidad="estrellas" decimales maximo={5} archivo={`calificacion-${plural}-por-${nombreZona}`} vacio="Todavía no hay reseñas." />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] py-12">
        <div className="mb-8 max-w-3xl">
          <p className="rotulo mb-3">Ranking de Bolivia</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">Lo más popular</h1>
          <p className="texto-lectura mt-3 text-lg text-piedra-texto">Los lugares que más visitan y mejor califican los viajeros, en todo el país o en el departamento que elijas.</p>
        </div>

        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 rounded-tarjeta border border-borde bg-white p-4 shadow-suave sm:p-5">
          <div className="flex flex-wrap gap-1 rounded-full border border-borde bg-sal p-1" role="tablist" aria-label="Tipo de lugar">
            {PESTANAS.map(({ id, etiqueta, icono: Icono }) => (
              <button key={id} type="button" role="tab" aria-selected={vista === id} onClick={() => cambiar('tipo', id === 'destino' ? '' : id)} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-200 ${vista === id ? 'bg-noche text-white' : 'text-noche hover:bg-white'}`}>
                <Icono aria-hidden="true" size={17} /> {etiqueta}
              </button>
            ))}
          </div>
          <label className={`${claseEtiqueta} mb-0 w-full sm:w-64`}>
            Departamento
            <select value={idDepartamento} onChange={(evento) => cambiar('departamento', evento.target.value)} className={`${claseControl} mt-1.5 text-sm font-normal`}>
              <option value="">Toda Bolivia</option>
              {(datos?.departamentos || departamentosDeEjemplo).map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>)}
            </select>
          </label>
        </div>

        {contenido}
      </main>
    </div>
  )
}

export default Populares
