import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SearchX } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { EstadoVacio, EsqueletoTarjetaBase, claseBoton, claseControl, claseEtiqueta } from '../../components/ui'
import TarjetaEstablecimiento from '../../components/TarjetaEstablecimiento.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { coincideConBusqueda } from '../../utils/texto.js'
import { ESTABLECIMIENTOS } from './configuracion.js'

const CLASE_CAMPO = `${claseControl} mt-1.5 text-sm font-normal`
const CLASE_ETIQUETA = claseEtiqueta

// Listado de restaurantes o de alojamientos (según "tipo"), con búsqueda y
// filtros guardados en la URL: ?buscar=, ?departamento= y, en alojamientos, ?precio=.
function ListaEstablecimientos({ tipo }) {
  const configuracion = ESTABLECIMIENTOS[tipo]
  const [parametros, setParametros] = useSearchParams()
  const busqueda = parametros.get('buscar') || ''
  const idDepartamento = parametros.get('departamento') || ''
  const precioMaximo = parametros.get('precio') || ''

  const [elementos, setElementos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const [lista, listaDepartamentos] = await Promise.all([configuracion.listar(), getDepartamentos()])
        if (!activo) return
        setElementos(lista)
        setDepartamentos(listaDepartamentos.length > 0 ? listaDepartamentos : departamentosDeEjemplo)
      } catch (errorLectura) {
        console.error(`Error al consultar ${configuracion.plural} en Firestore:`, errorLectura)
        if (activo) setError(`No se pudieron cargar los ${configuracion.plural}. Inténtalo de nuevo más tarde.`)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [configuracion])

  function cambiarFiltro(nombre, valor) {
    const nuevos = new URLSearchParams(parametros)
    if (valor) nuevos.set(nombre, valor)
    else nuevos.delete(nombre)
    setParametros(nuevos, { replace: true })
  }

  const visibles = useMemo(() => elementos.filter((elemento) =>
    (!busqueda.trim() || coincideConBusqueda(configuracion.textosDeBusqueda(elemento), busqueda))
    && (!idDepartamento || elemento.id_departamento === idDepartamento)
    && (!precioMaximo || Number(elemento.precio_noche) <= Number(precioMaximo)),
  ), [elementos, busqueda, idDepartamento, precioMaximo, configuracion])

  const hayFiltros = Boolean(busqueda || idDepartamento || precioMaximo)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 rotulo">{configuracion.rotulo}</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">{configuracion.titulo}</h1>
          <p className="texto-lectura mt-3 text-lg text-piedra-texto">{configuracion.bajada}</p>
        </div>

        <div className="mb-8 grid gap-4 rounded-tarjeta border border-borde bg-white p-5 shadow-suave sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <label className={CLASE_ETIQUETA}>
            {configuracion.etiquetaBusqueda}
            <span className="relative mt-1.5 block">
              <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-piedra" />
              <input value={busqueda} onChange={(evento) => cambiarFiltro('buscar', evento.target.value)} placeholder={configuracion.ejemploBusqueda} className={`${CLASE_CAMPO} mt-0 pl-10`} />
            </span>
          </label>
          <label className={CLASE_ETIQUETA}>
            Departamento
            <select value={idDepartamento} onChange={(evento) => cambiarFiltro('departamento', evento.target.value)} className={CLASE_CAMPO}>
              <option value="">Todos</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
              ))}
            </select>
          </label>
          {tipo === 'alojamiento' ? (
            <label className={CLASE_ETIQUETA}>
              Precio máximo por noche (Bs)
              <input type="number" min="0" value={precioMaximo} onChange={(evento) => cambiarFiltro('precio', evento.target.value)} placeholder="Sin límite" className={CLASE_CAMPO} />
            </label>
          ) : <span className="hidden lg:block" />}
          <button
            type="button"
            onClick={() => setParametros({}, { replace: true })}
            disabled={!hayFiltros}
            className={claseBoton('fantasma', 'pequeno')}
          >
            Limpiar
          </button>
        </div>

        {error && <p className="mb-8 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => <EsqueletoTarjetaBase key={indice} className={indice > 1 ? 'hidden sm:block' : ''} />)}
          </div>
        ) : visibles.length === 0 ? (
          !error && (
            <EstadoVacio
              icono={SearchX}
              titulo={hayFiltros ? `No hay ${configuracion.plural} que coincidan con tu búsqueda.` : `Aún no hay ${configuracion.plural} registrados.`}
              mensaje={hayFiltros ? 'Prueba con otro nombre o con otro departamento.' : 'Pronto sumaremos más lugares.'}
              accion={hayFiltros && (
                <button type="button" onClick={() => setParametros({}, { replace: true })} className={claseBoton('secundario', 'normal', 'bg-white')}>
                  Quitar los filtros y ver todos
                </button>
              )}
            />
          )
        ) : (
          <>
            <p className="mb-4 text-sm text-piedra-texto">{visibles.length} {visibles.length === 1 ? configuracion.singular : configuracion.plural}</p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((elemento) => (
                <TarjetaEstablecimiento key={elemento.id} tipo={tipo} establecimiento={elemento} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default ListaEstablecimientos
