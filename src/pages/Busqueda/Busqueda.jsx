import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BedDouble, Compass, LayoutGrid, MapPin, Mountain, Search, SearchX, UtensilsCrossed } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { Chip, EstadoVacio, claseBoton } from '../../components/ui'
import { getAlojamientos } from '../../services/alojamientosService.js'
import { getActividades } from '../../services/actividadesService.js'
import { getDestinos } from '../../services/destinosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { coincideConBusqueda } from '../../utils/texto.js'

const TIPOS = [
  { id: 'todos', etiqueta: 'Todos', icono: LayoutGrid },
  { id: 'destino', etiqueta: 'Destinos', icono: Compass },
  { id: 'actividad', etiqueta: 'Actividades', icono: Mountain },
  { id: 'restaurante', etiqueta: 'Restaurantes', icono: UtensilsCrossed },
  { id: 'alojamiento', etiqueta: 'Alojamientos', icono: BedDouble },
]

function crearResultados({ destinos, actividades, restaurantes, alojamientos }) {
  const nombreDestino = new Map(destinos.map((destino) => [destino.id, destino.nombre]))
  const textoPlatos = (restaurante) => Array.isArray(restaurante.platos_tipicos)
    ? restaurante.platos_tipicos.join(' ')
    : restaurante.platos_tipicos || ''
  return [
    ...destinos.map((destino) => ({
      id: `destino-${destino.id}`,
      tipo: 'destino',
      titulo: destino.nombre,
      descripcion: destino.descripcion || '',
      ubicacion: destino.ubicacion || destino.direccion || '',
      texto: `${destino.nombre} ${destino.descripcion} ${destino.ubicacion} ${destino.direccion} ${destino.categoria}`,
      enlace: `/destinos/${destino.id}`,
      accion: 'Ver destino',
    })),
    ...actividades.map((actividad) => ({
      id: `actividad-${actividad.id}`,
      tipo: 'actividad',
      titulo: actividad.nombre,
      descripcion: actividad.descripcion || '',
      ubicacion: nombreDestino.get(actividad.id_destino) || '',
      texto: `${actividad.nombre} ${actividad.descripcion} ${nombreDestino.get(actividad.id_destino) || ''}`,
      enlace: actividad.id_destino ? `/destinos/${actividad.id_destino}` : '/destinos',
      accion: actividad.id_destino ? 'Ver destino' : 'Explorar destinos',
    })),
    ...restaurantes.map((restaurante) => ({
      id: `restaurante-${restaurante.id}`,
      tipo: 'restaurante',
      titulo: restaurante.nombre,
      descripcion: [restaurante.especialidad, restaurante.horario].filter(Boolean).join(' · '),
      ubicacion: restaurante.ubicacion || restaurante.direccion || '',
      texto: `${restaurante.nombre} ${restaurante.especialidad} ${restaurante.horario} ${restaurante.ubicacion} ${restaurante.direccion} ${textoPlatos(restaurante)}`,
      enlace: `/restaurantes/${restaurante.id}`,
      accion: 'Ver restaurante',
    })),
    ...alojamientos.map((alojamiento) => ({
      id: `alojamiento-${alojamiento.id}`,
      tipo: 'alojamiento',
      titulo: alojamiento.nombre,
      descripcion: [alojamiento.tipo, alojamiento.precio_noche != null ? `Bs ${alojamiento.precio_noche} por noche` : ''].filter(Boolean).join(' · '),
      ubicacion: alojamiento.ubicacion || alojamiento.direccion || '',
      texto: `${alojamiento.nombre} ${alojamiento.tipo} ${alojamiento.ubicacion} ${alojamiento.direccion}`,
      enlace: `/alojamientos/${alojamiento.id}`,
      accion: 'Ver alojamiento',
    })),
  ]
}

function Busqueda() {
  const [parametros] = useSearchParams()
  const consulta = parametros.get('buscar')?.trim() || ''
  const [resultadosBase, setResultadosBase] = useState([])
  const [tipoActivo, setTipoActivo] = useState('todos')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      setCargando(true)
      setError('')
      try {
        const [destinos, actividades, restaurantes, alojamientos] = await Promise.all([
          getDestinos(),
          getActividades(),
          getRestaurantes(),
          getAlojamientos(),
        ])
        if (activo) setResultadosBase(crearResultados({ destinos, actividades, restaurantes, alojamientos }))
      } catch (errorLectura) {
        console.error('Error al consultar catálogos para la búsqueda global:', errorLectura)
        if (activo) {
          setResultadosBase([])
          setError('No se pudo completar la búsqueda. Inténtalo de nuevo más tarde.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarCatalogos()
    return () => { activo = false }
  }, [])

  const coincidencias = useMemo(
    () => consulta ? resultadosBase.filter((resultado) => coincideConBusqueda(resultado.texto, consulta)) : [],
    [consulta, resultadosBase],
  )
  const resultados = coincidencias.filter((resultado) => tipoActivo === 'todos' || resultado.tipo === tipoActivo)
  const cantidades = TIPOS.reduce((conteo, tipo) => {
    conteo[tipo.id] = tipo.id === 'todos'
      ? coincidencias.length
      : coincidencias.filter((resultado) => resultado.tipo === tipo.id).length
    return conteo
  }, {})

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cobre-texto">Explora Bolivia</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">Resultados de búsqueda</h1>
          {consulta ? (
            <p className="texto-lectura mt-3 text-lg text-piedra-texto">
              Coincidencias para <span className="font-bold text-noche">“{consulta}”</span> en destinos, actividades, restaurantes y alojamientos.
            </p>
          ) : (
            <p className="texto-lectura mt-3 text-lg text-piedra-texto">Busca destinos, actividades, restaurantes y alojamientos desde el buscador superior.</p>
          )}
        </div>

        {error && <p className="mb-6 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {consulta && (
          <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Filtrar resultados por categoría">
            {TIPOS.map((tipo) => (
              <Chip key={tipo.id} icono={tipo.icono} activo={tipoActivo === tipo.id} onClick={() => setTipoActivo(tipo.id)}>
                {tipo.etiqueta} <span className="font-medium opacity-70">{cantidades[tipo.id]}</span>
              </Chip>
            ))}
          </div>
        )}

        {cargando ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => <div key={indice} className="h-48 animate-pulse rounded-tarjeta bg-sal-2" />)}
          </div>
        ) : !consulta ? (
          <EstadoVacio icono={Search} titulo="¿Qué estás buscando?" mensaje="Prueba con el nombre de un lugar, una actividad o un servicio turístico." />
        ) : resultados.length === 0 ? (
          <EstadoVacio
            icono={SearchX}
            titulo={coincidencias.length === 0 ? `No encontramos nada para “${consulta}”.` : 'No hay resultados de este tipo.'}
            mensaje={coincidencias.length === 0 ? 'Revisa la ortografía o prueba con una palabra más general, como el nombre de un departamento.' : 'Cambia el filtro de arriba para ver los demás resultados.'}
          />
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-piedra-texto">{resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((resultado) => (
                <article key={resultado.id} className="flex flex-col rounded-tarjeta border border-borde bg-white p-5 shadow-suave transition-shadow duration-150 hover:shadow-elevada">
                  <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-cielo px-2.5 py-1 text-xs font-bold text-noche">
                    {(() => {
                      const tipo = TIPOS.find((item) => item.id === resultado.tipo)
                      const Icono = tipo?.icono || Compass
                      return <><Icono aria-hidden="true" size={14} className="text-cielo-700" />{tipo?.etiqueta}</>
                    })()}
                  </span>
                  <h2 className="text-lg font-bold text-noche">{resultado.titulo}</h2>
                  {resultado.ubicacion && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-piedra-texto">
                      <MapPin aria-hidden="true" size={16} className="shrink-0 text-piedra" /> {resultado.ubicacion}
                    </p>
                  )}
                  {resultado.descripcion && <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-piedra-texto">{resultado.descripcion}</p>}
                  <Link to={resultado.enlace} className={claseBoton('secundario', 'pequeno', 'mt-5 w-fit')}>
                    {resultado.accion}
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Busqueda
