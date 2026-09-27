import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { getDepartamentoPorId } from '../../services/departamentosService.js'
import { getDestinosPorDepartamento } from '../../services/destinosService.js'
import { getMunicipiosPorDepartamento } from '../../services/municipiosService.js'
import { getRegionesPorMunicipios } from '../../services/regionesService.js'

function DepartamentoDetalle() {
  const { id } = useParams()
  const [departamento, setDepartamento] = useState(null)
  const [destinos, setDestinos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [regiones, setRegiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDepartamento() {
      setCargando(true)
      setError('')
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

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Link to="/departamentos" className="mb-6 inline-block text-sm font-semibold text-brand-700 underline">
          ← Volver a departamentos
        </Link>

        {cargando ? (
          <GrillaEsqueleto />
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        ) : (
          <>
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Departamento</p>
              <h1 className="text-5xl font-bold tracking-tight text-brand-900">{departamento.nombre}</h1>
              <p className="mt-4 text-lg text-slate-600">{departamento.descripcion}</p>
            </div>

            {municipios.length > 0 && (
              <div className="mb-10">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Municipios</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {municipios.map((municipio) => {
                    const regionesDelMunicipio = regiones.filter((region) => region.id_municipio === municipio.id)
                    return (
                      <div key={municipio.id} className="rounded-xl bg-white px-4 py-3 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
                        <p className="font-bold text-brand-900">{municipio.nombre}</p>
                        {municipio.descripcion && <p className="text-sm text-slate-600">{municipio.descripcion}</p>}
                        {regionesDelMunicipio.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {regionesDelMunicipio.map((region) => (
                              <span key={region.id} title={region.descripcion} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                                {region.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Destinos</p>
            {destinos.length === 0 ? (
              <p className="text-slate-600">Todavía no hay destinos cargados para {departamento.nombre}.</p>
            ) : (
              <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
                {destinos.map((destino) => (
                  <TarjetaDestino key={destino.id} destino={destino} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default DepartamentoDetalle
