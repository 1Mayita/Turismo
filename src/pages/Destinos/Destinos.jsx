import { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getRegiones, regionesDeEjemplo } from '../../services/regionesService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'

const ZONA_VACIA = { idDepartamento: '', idMunicipio: '', idRegion: '' }

const CLASE_SELECT = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-slate-100'

async function leerCatalogo() {
  const [destinos, categorias, departamentos, municipios, regiones] = await Promise.all([
    getDestinos(),
    getCategorias(),
    getDepartamentos(),
    getMunicipios(),
    getRegiones(),
  ])
  return { destinos, categorias, departamentos, municipios, regiones }
}

const CATALOGO_DE_EJEMPLO = {
  destinos: destinosDeEjemplo,
  categorias: categoriasDeEjemplo,
  departamentos: departamentosDeEjemplo,
  municipios: municipiosDeEjemplo,
  regiones: regionesDeEjemplo,
}

function Destinos() {
  const [catalogo, setCatalogo] = useState({ destinos: [], categorias: [], departamentos: [], municipios: [], regiones: [] })
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')
  const [zona, setZona] = useState(ZONA_VACIA)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        let datos = await leerCatalogo()
        if (datos.destinos.length === 0 || datos.categorias.length === 0) {
          try {
            await sembrarCatalogoDeEjemplo()
            datos = await leerCatalogo()
          } catch (errorSembrado) {
            console.error('Error al sembrar el catálogo de ejemplo:', errorSembrado)
            datos = CATALOGO_DE_EJEMPLO
            setError('Mostrando destinos de ejemplo. Configura las reglas de escritura de Firestore para guardarlos.')
          }
        }
        setCatalogo(datos)
      } catch (errorLectura) {
        console.error('Error al consultar el catálogo en Firestore:', errorLectura)
        setCatalogo(CATALOGO_DE_EJEMPLO)
        setError('No se pudo consultar Firestore. Mostramos destinos de ejemplo para la demo.')
      } finally {
        setCargando(false)
      }
    }

    cargarCatalogo()
  }, [])

  const municipiosDisponibles = catalogo.municipios.filter((municipio) => municipio.id_departamento === zona.idDepartamento)
  const regionesDisponibles = catalogo.regiones.filter((region) => region.id_municipio === zona.idMunicipio)

  const destinosFiltrados = useMemo(() => catalogo.destinos.filter((destino) =>
    (categoriaActiva === 'Todas' || destino.categoria === categoriaActiva)
    && (!zona.idDepartamento || destino.id_departamento === zona.idDepartamento)
    && (!zona.idMunicipio || destino.id_municipio === zona.idMunicipio)
    && (!zona.idRegion || destino.id_region === zona.idRegion),
  ), [catalogo.destinos, categoriaActiva, zona])

  // Al cambiar un nivel se limpian los niveles de abajo.
  function cambiarDepartamento(evento) {
    setZona({ ...ZONA_VACIA, idDepartamento: evento.target.value })
  }

  function cambiarMunicipio(evento) {
    setZona({ ...zona, idMunicipio: evento.target.value, idRegion: '' })
  }

  function cambiarRegion(evento) {
    setZona({ ...zona, idRegion: evento.target.value })
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Catálogo de experiencias</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Encuentra tu próximo paisaje</h1>
          <p className="mt-4 text-lg text-slate-600">Desde el altiplano hasta la Amazonía, Bolivia te espera.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoriaActiva('Todas')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              categoriaActiva === 'Todas' ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
            }`}
          >
            Todas
          </button>
          {catalogo.categorias.map((categoria) => (
            <button
              key={categoria.id || categoria.nombre}
              type="button"
              onClick={() => setCategoriaActiva(categoria.nombre)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoriaActiva === categoria.nombre ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Departamento
            <select value={zona.idDepartamento} onChange={cambiarDepartamento} className={`mt-1 ${CLASE_SELECT}`}>
              <option value="">Todos</option>
              {catalogo.departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Municipio
            <select value={zona.idMunicipio} onChange={cambiarMunicipio} disabled={!zona.idDepartamento} className={`mt-1 ${CLASE_SELECT}`}>
              <option value="">Todos</option>
              {municipiosDisponibles.map((municipio) => (
                <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Región
            <select value={zona.idRegion} onChange={cambiarRegion} disabled={!zona.idMunicipio} className={`mt-1 ${CLASE_SELECT}`}>
              <option value="">Todas</option>
              {regionesDisponibles.map((region) => (
                <option key={region.id} value={region.id}>{region.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        {cargando ? (
          <GrillaEsqueleto />
        ) : destinosFiltrados.length === 0 ? (
          <p className="text-slate-600">No hay destinos que coincidan con estos filtros todavía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
            {destinosFiltrados.map((destino) => (
              <TarjetaDestino key={destino.id || destino.nombre} destino={destino} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Destinos
