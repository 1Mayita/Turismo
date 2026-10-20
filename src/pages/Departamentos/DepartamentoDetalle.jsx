import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import EstablecimientosCercanos from '../../components/EstablecimientosCercanos.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import Migas from '../../components/Migas.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { getDepartamentoPorId } from '../../services/departamentosService.js'
import { getDestinosPorDepartamento } from '../../services/destinosService.js'
import { getMunicipiosPorDepartamento } from '../../services/municipiosService.js'
import { getRegionesPorMunicipios } from '../../services/regionesService.js'
import { useTituloPagina } from '../../hooks/useTituloPagina.js'

const MAXIMO_EN_VISTA_PREVIA = 3

function DepartamentoDetalle() {
  const { id } = useParams()
  const [departamento, setDepartamento] = useState(null)
  const [destinos, setDestinos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [regiones, setRegiones] = useState([])
  const [idMunicipioAbierto, setIdMunicipioAbierto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDepartamento() {
      setCargando(true)
      setError('')
      setIdMunicipioAbierto(null)
      try {
        const departamentoEncontrado = await getDepartamentoPorId(id)
        if (!departamentoEncontrado) {
          setError('No encontramos este departamento.')
          return
        }
        setDepartamento(departamentoEncontrado)

        // Si falla traer destinos o municipios, no ocultamos la info del
        // departamento que sí se cargó bien: cada bloque falla por su cuenta.
        try {
          setDestinos(await getDestinosPorDepartamento(departamentoEncontrado.id))
        } catch (errorDestinos) {
          console.error('Error al consultar destinos del departamento:', errorDestinos)
          setDestinos([])
        }

        try {
          const municipiosEncontrados = await getMunicipiosPorDepartamento(departamentoEncontrado.id)
          setMunicipios(municipiosEncontrados)
          setRegiones(municipiosEncontrados.length > 0
            ? await getRegionesPorMunicipios(municipiosEncontrados.map((municipio) => municipio.id))
            : [])
        } catch (errorMunicipios) {
          console.error('Error al consultar municipios y regiones del departamento:', errorMunicipios)
          setMunicipios([])
          setRegiones([])
        }
      } catch (errorLectura) {
        console.error('Error al consultar el departamento:', errorLectura)
        setError('No se pudo cargar la información del departamento.')
      } finally {
        setCargando(false)
      }
    }

    cargarDepartamento()
  }, [id])

  useTituloPagina(departamento?.nombre || 'Departamentos')

  // Destacados primero: son "los más famosos" de cada municipio.
  const destinosOrdenados = [...destinos].sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)))
  const destinosDe = (idMunicipio) => destinosOrdenados.filter((destino) => destino.id_municipio === idMunicipio)
  const municipioAbierto = municipios.find((municipio) => municipio.id === idMunicipioAbierto)
  const destinosDelMunicipioAbierto = municipioAbierto ? destinosDe(municipioAbierto.id) : []

  const migas = [
    { etiqueta: 'Inicio', to: '/' },
    { etiqueta: 'Departamentos', to: '/departamentos' },
    { etiqueta: departamento?.nombre || 'Departamento' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {cargando ? (
        <main className="contenedor max-w-6xl py-12">
          <div className="mb-8 h-72 animate-pulse rounded-3xl bg-sal-2" />
          <GrillaEsqueleto cantidad={3} />
        </main>
      ) : error ? (
        <main className="contenedor max-w-6xl py-12">
          <Migas pasos={migas} />
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        </main>
      ) : (
        <>
          {/* Portada a todo el ancho, con velo oscuro abajo para leer el título. */}
          <header className="relative mx-3 mt-3 flex h-72 items-end overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(8,51,68,0.7)] sm:mx-5 sm:h-96">
            <ImagenSegura src={departamento.imagen_portada} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-noche/90 via-noche/30 to-transparent" />
            <div className="relative contenedor max-w-6xl pb-8 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cielo">Departamento</p>
              <h1 className="mt-1 text-4xl font-extrabold sm:text-6xl">{departamento.nombre}</h1>
              {departamento.eslogan && <p className="mt-2 text-lg font-semibold text-cielo sm:text-xl">“{departamento.eslogan}”</p>}
            </div>
          </header>

          <main className="contenedor max-w-6xl py-10">
            <Migas pasos={migas} />

            {departamento.descripcion && <p className="mb-10 max-w-3xl text-lg leading-8 text-noche/80">{departamento.descripcion}</p>}

            {municipios.length > 0 && (
              <section className="mb-12">
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Municipios</p>
                <h2 className="mb-2 text-2xl font-bold text-noche">¿A qué parte de {departamento.nombre} vas?</h2>
                <p className="mb-5 text-sm text-piedra-texto">Elige un municipio para ver sus lugares más visitados.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {municipios.map((municipio) => {
                    const abierto = municipio.id === idMunicipioAbierto
                    const cantidad = destinosDe(municipio.id).length
                    const regionesDelMunicipio = regiones.filter((region) => region.id_municipio === municipio.id)
                    return (
                      <button
                        key={municipio.id}
                        type="button"
                        aria-expanded={abierto}
                        onClick={() => setIdMunicipioAbierto(abierto ? null : municipio.id)}
                        className={`rounded-2xl p-5 text-left transition hover:-translate-y-0.5 ${
                          abierto ? 'bg-noche text-white shadow-lg shadow-brand-900/30' : 'cristal text-noche'
                        }`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-lg font-bold">{municipio.nombre}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${abierto ? 'bg-white/20' : 'bg-cielo text-cielo-700'}`}>
                            {cantidad} {cantidad === 1 ? 'destino' : 'destinos'}
                          </span>
                        </span>
                        {municipio.descripcion && <span className={`mt-1 block text-sm ${abierto ? 'text-white/85' : 'text-piedra-texto'}`}>{municipio.descripcion}</span>}
                        {regionesDelMunicipio.length > 0 && (
                          <span className={`mt-3 block text-xs ${abierto ? 'text-white/75' : 'text-piedra-texto'}`}>
                            Zonas: {regionesDelMunicipio.map((region) => region.nombre).join(' · ')}
                          </span>
                        )}
                        <span className={`mt-3 block text-sm font-semibold ${abierto ? 'text-white' : 'text-cielo-700'}`}>
                          {abierto ? 'Ocultar lugares ▲' : 'Ver lugares ▼'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {municipioAbierto && (
                  <div className="mt-5 rounded-3xl cristal p-6" aria-live="polite">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-noche">Lo más visitado de {municipioAbierto.nombre}</h3>
                      {destinosDelMunicipioAbierto.length > 0 && (
                        <Link
                          to={`/destinos?departamento=${encodeURIComponent(departamento.id)}&municipio=${encodeURIComponent(municipioAbierto.id)}`}
                          className="rounded-xl boton-principal px-4 py-2 text-sm font-bold"
                        >
                          Ver más: todos los destinos de {municipioAbierto.nombre}
                        </Link>
                      )}
                    </div>
                    {destinosDelMunicipioAbierto.length === 0 ? (
                      <p className="text-piedra-texto">Todavía no hay destinos registrados en {municipioAbierto.nombre}.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {destinosDelMunicipioAbierto.slice(0, MAXIMO_EN_VISTA_PREVIA).map((destino) => (
                          <TarjetaDestino key={destino.id} destino={destino} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="mb-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Destinos</p>
                  <h2 className="text-2xl font-bold text-noche">Qué ver en {departamento.nombre}</h2>
                </div>
                {destinos.length > 0 && (
                  <Link to={`/destinos?departamento=${encodeURIComponent(departamento.id)}`} className="text-sm font-semibold text-cielo-700 underline">
                    Abrir en el catálogo con filtros
                  </Link>
                )}
              </div>
              {destinos.length === 0 ? (
                <p className="rounded-2xl bg-white/60 px-5 py-4 text-piedra-texto ring-1 ring-white/80">Todavía no hay destinos cargados para {departamento.nombre}.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {destinosOrdenados.map((destino) => (
                    <TarjetaDestino key={destino.id} destino={destino} />
                  ))}
                </div>
              )}
            </section>

            {/* Solo restaurantes y alojamientos de este departamento. */}
            <EstablecimientosCercanos idDepartamento={departamento.id} nombreDepartamento={departamento.nombre} />
          </main>
        </>
      )}
    </div>
  )
}

export default DepartamentoDetalle
