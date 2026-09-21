import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { getDepartamentoPorId, getDestinosPorDepartamento } from '../../services/departamentosService.js'
import { getRegionesPorDepartamento } from '../../services/regionesService.js'

function DepartamentoDetalle() {
  const { id } = useParams()
  const [departamento, setDepartamento] = useState(null)
  const [destinos, setDestinos] = useState([])
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

        // Si falla traer destinos o regiones, no ocultamos la info del
        // departamento que sí se cargó bien: cada bloque falla por su cuenta.
        try {
          setDestinos(await getDestinosPorDepartamento(departamentoEncontrado.nombre))
        } catch (errorDestinos) {
          console.error('Error al consultar destinos del departamento:', errorDestinos)
          setDestinos([])
        }

        try {
          setRegiones(await getRegionesPorDepartamento(departamentoEncontrado.id))
        } catch (errorRegiones) {
          console.error('Error al consultar regiones del departamento:', errorRegiones)
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

            {regiones.length > 0 && (
              <div className="mb-10">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Regiones</p>
                <div className="flex flex-wrap gap-3">
                  {regiones.map((region) => (
                    <div key={region.id} className="rounded-xl bg-white px-4 py-3 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
                      <p className="font-bold text-brand-900">{region.nombre}</p>
                      {region.descripcion && <p className="max-w-xs text-sm text-slate-600">{region.descripcion}</p>}
                    </div>
                  ))}
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
