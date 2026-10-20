import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import TarjetaEstablecimiento from '../../components/TarjetaEstablecimiento.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { coincideConBusqueda } from '../../utils/texto.js'
import { ESTABLECIMIENTOS } from './configuracion.js'

const CLASE_CAMPO = 'mt-1 w-full rounded-xl border border-borde bg-white/70 px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-noche outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30'
const CLASE_ETIQUETA = 'block text-xs font-bold uppercase tracking-wider text-piedra-texto'

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
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">{configuracion.rotulo}</p>
          <h1 className="text-4xl font-bold tracking-tight text-noche sm:text-5xl">{configuracion.titulo}</h1>
          <p className="mt-4 text-lg text-piedra-texto">{configuracion.bajada}</p>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl cristal p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <label className={CLASE_ETIQUETA}>
            {configuracion.etiquetaBusqueda}
            <input value={busqueda} onChange={(evento) => cambiarFiltro('buscar', evento.target.value)} placeholder={configuracion.ejemploBusqueda} className={CLASE_CAMPO} />
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
            className="rounded-xl border border-borde bg-white/70 px-4 py-2.5 text-sm font-bold text-noche/80 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>

        {error && <p className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        {cargando ? (
          <GrillaEsqueleto cantidad={6} />
        ) : visibles.length === 0 ? (
          !error && (
            <div className="rounded-2xl bg-white/60 px-5 py-6 text-piedra-texto ring-1 ring-white/80">
              <p>{hayFiltros ? `No hay ${configuracion.plural} que coincidan con tu búsqueda.` : `Aún no hay ${configuracion.plural} registrados.`}</p>
              {hayFiltros && (
                <button type="button" onClick={() => setParametros({}, { replace: true })} className="mt-3 font-semibold text-cielo-700 underline">
                  Quitar los filtros y ver todos
                </button>
              )}
            </div>
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
