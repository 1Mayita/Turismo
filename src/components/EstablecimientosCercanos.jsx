import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TarjetaEstablecimiento from './TarjetaEstablecimiento.jsx'
import { getRestaurantesPorDepartamento } from '../services/restaurantesService.js'
import { getAlojamientosPorDepartamento } from '../services/alojamientosService.js'

const MAXIMO_VISIBLE = 3

// Si hay lugares en el mismo municipio se muestran esos; si no, los del
// resto del departamento, avisando que no están en el mismo municipio.
// Nunca se muestran lugares de otro departamento.
function elegirCercanos(lista, idMunicipio) {
  const delMunicipio = idMunicipio ? lista.filter((item) => item.id_municipio === idMunicipio) : []
  return delMunicipio.length > 0
    ? { visibles: delMunicipio, soloDepartamento: false }
    : { visibles: lista, soloDepartamento: Boolean(idMunicipio) && lista.length > 0 }
}

function Bloque({ titulo, tipo, lista, idMunicipio, nombreDepartamento, textoVacio, enlace, textoEnlace }) {
  const { visibles, soloDepartamento } = elegirCercanos(lista, idMunicipio)

  return (
    <div className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-900">{titulo}</h3>
        <Link to={enlace} className="text-sm font-semibold text-brand-700 underline">{textoEnlace}</Link>
      </div>
      {visibles.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-5 py-4 text-sm text-slate-600 ring-1 ring-white/80">{textoVacio}</p>
      ) : (
        <>
          {soloDepartamento && (
            <p className="mb-4 text-sm text-slate-600">No hay registros en este municipio. Estas son opciones en el resto de {nombreDepartamento}.</p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.slice(0, MAXIMO_VISIBLE).map((item) => (
              <TarjetaEstablecimiento key={item.id} tipo={tipo} establecimiento={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Sección "Dónde comer / Dónde dormir" para el detalle de un destino o de un
// departamento. Consulta solo los negocios de ese departamento. idMunicipio
// es opcional.
function EstablecimientosCercanos({ idDepartamento, idMunicipio, nombreDepartamento = 'este departamento' }) {
  const [restaurantes, setRestaurantes] = useState([])
  const [alojamientos, setAlojamientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!idDepartamento) return
    let activo = true
    Promise.all([getRestaurantesPorDepartamento(idDepartamento), getAlojamientosPorDepartamento(idDepartamento)])
      .then(([listaRestaurantes, listaAlojamientos]) => {
        if (!activo) return
        setRestaurantes(listaRestaurantes)
        setAlojamientos(listaAlojamientos)
        setError('')
      })
      .catch((errorLectura) => {
        console.error('Error al consultar restaurantes y alojamientos cercanos:', errorLectura)
        if (activo) setError('No se pudieron cargar los restaurantes y alojamientos cercanos.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [idDepartamento])

  if (!idDepartamento) return null
  const filtro = `?departamento=${encodeURIComponent(idDepartamento)}`

  return (
    <section>
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Dónde comer y dónde dormir</p>
      {cargando ? (
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-3xl bg-sal-2" />
          <div className="h-64 animate-pulse rounded-3xl bg-sal-2" />
          <div className="hidden h-64 animate-pulse rounded-3xl bg-sal-2 lg:block" />
        </div>
      ) : error ? (
        <p className="mb-10 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
      ) : (
        <>
          <Bloque
            titulo="Dónde comer"
            tipo="restaurante"
            lista={restaurantes}
            idMunicipio={idMunicipio}
            nombreDepartamento={nombreDepartamento}
            textoVacio={`Todavía no hay restaurantes registrados en ${nombreDepartamento}.`}
            enlace={restaurantes.length > 0 ? `/restaurantes${filtro}` : '/restaurantes'}
            textoEnlace={restaurantes.length > 0 ? `Ver los ${restaurantes.length} restaurantes de ${nombreDepartamento}` : 'Ver todos los restaurantes'}
          />
          <Bloque
            titulo="Dónde dormir"
            tipo="alojamiento"
            lista={alojamientos}
            idMunicipio={idMunicipio}
            nombreDepartamento={nombreDepartamento}
            textoVacio={`Todavía no hay alojamientos registrados en ${nombreDepartamento}.`}
            enlace={alojamientos.length > 0 ? `/alojamientos${filtro}` : '/alojamientos'}
            textoEnlace={alojamientos.length > 0 ? `Ver los ${alojamientos.length} alojamientos de ${nombreDepartamento}` : 'Ver todos los alojamientos'}
          />
        </>
      )}
    </section>
  )
}

export default EstablecimientosCercanos
