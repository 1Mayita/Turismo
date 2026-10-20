import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BotonAgregarAViaje from '../../components/BotonAgregarAViaje.jsx'
import BotonCompartir from '../../components/BotonCompartir.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import BotonReportar from '../../components/BotonReportar.jsx'
import EstablecimientosCercanos from '../../components/EstablecimientosCercanos.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import InsigniaCategoria from '../../components/InsigniaCategoria.jsx'
import Migas from '../../components/Migas.jsx'
import VisorImagenes from '../../components/VisorImagenes.jsx'
import { ResumenCalificacion } from '../../components/Estrellas.jsx'
import { getDepartamentoPorId } from '../../services/departamentosService.js'
import { getDestinoPorId } from '../../services/destinosService.js'
import { useTituloPagina } from '../../hooks/useTituloPagina.js'
import { coordenadasValidas } from '../../utils/geo.js'
import { getPromedioCalificacion } from '../../services/resenasService.js'
import ActividadesDestino from './ActividadesDestino.jsx'
import InfoPractica from './InfoPractica.jsx'
import { useAuth } from '../../context/useAuth.js'
import { registrarVisita } from '../../services/estadisticasService.js'
import ResenasDestino from './ResenasDestino.jsx'

// El mapa (Leaflet) se descarga aparte, solo cuando el destino tiene coordenadas.
const MapaUbicacion = lazy(() => import('../../components/mapa/MapaUbicacion.jsx'))

function DestinoDetalle() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const [destino, setDestino] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [departamento, setDepartamento] = useState(null)
  const [indiceVisor, setIndiceVisor] = useState(null)
  const [calificacion, setCalificacion] = useState(null)
  const [errorCalificacion, setErrorCalificacion] = useState('')
  const [versionCalificacion, setVersionCalificacion] = useState(0)

  useEffect(() => {
    async function cargarCalificacion() {
      try {
        setCalificacion(await getPromedioCalificacion(id))
        setErrorCalificacion('')
      } catch (errorLectura) {
        console.error('Error al calcular el promedio de calificación:', errorLectura)
        setErrorCalificacion('No se pudo cargar la calificación.')
      }
    }

    cargarCalificacion()
  }, [id, versionCalificacion])

  useEffect(() => {
    async function cargarDestino() {
      setCargando(true)
      setError('')
      try {
        const destinoEncontrado = await getDestinoPorId(id)
        if (!destinoEncontrado) {
          setError('No encontramos este destino.')
          return
        }
        setDestino(destinoEncontrado)

        // El departamento solo se usa para las migas y los lugares cercanos:
        // si falla, el destino se muestra igual.
        if (destinoEncontrado.id_departamento) {
          getDepartamentoPorId(destinoEncontrado.id_departamento)
            .then(setDepartamento)
            .catch((errorDepartamento) => console.error('Error al consultar el departamento del destino:', errorDepartamento))
        }
      } catch (errorLectura) {
        console.error('Error al consultar el destino en Firestore:', errorLectura)
        setError('No se pudo cargar la información del destino.')
      } finally {
        setCargando(false)
      }
    }

    cargarDestino()
  }, [id])

  const galeria = destino ? (destino.imagenes?.length > 0 ? destino.imagenes : [destino.imagen_principal]).filter(Boolean) : []

  useTituloPagina(destino?.nombre || 'Destinos')

  // Cuenta la visita para las estadísticas (una vez cada 30 min por navegador).
  const idDestinoCargado = destino?.id
  const idUsuario = usuario?.uid || null
  useEffect(() => {
    if (idDestinoCargado) registrarVisita(idDestinoCargado, idUsuario)
  }, [idDestinoCargado, idUsuario])

  const migas = [
    { etiqueta: 'Inicio', to: '/' },
    { etiqueta: 'Destinos', to: '/destinos' },
    ...(departamento ? [{ etiqueta: departamento.nombre, to: `/departamentos/${departamento.id}` }] : []),
    { etiqueta: destino?.nombre || 'Destino' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-5xl py-12">
        <Migas pasos={migas} />

        {cargando ? (
          <div className="animate-pulse space-y-6">
            <div className="h-80 w-full rounded-3xl bg-white" />
            <div className="h-6 w-1/3 rounded bg-white" />
            <div className="h-4 w-2/3 rounded bg-white" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        ) : (
          <article>
            <div className="relative mb-8 h-72 w-full overflow-hidden rounded-3xl sm:h-[26rem]">
              <ImagenSegura key={destino.imagen_principal} src={destino.imagen_principal} alt={destino.nombre} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-noche/50 via-transparent to-transparent" />
              <InsigniaCategoria categoria={destino.categoria} className="absolute bottom-4 left-4 px-4 py-1.5 text-sm shadow-sm" />
            </div>

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-noche">{destino.nombre}</h1>
                  <BotonFavorito idDestino={destino.id} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <BotonAgregarAViaje destino={destino} />
                  <BotonCompartir titulo={destino.nombre} texto={`Mira ${destino.nombre} en Rutas de Bolivia:`} />
                </div>
                {errorCalificacion ? (
                  <p className="mt-1 text-sm font-semibold text-red-700" role="alert">{errorCalificacion}</p>
                ) : calificacion && (
                  <ResumenCalificacion promedio={calificacion.promedio} total={calificacion.total} className="mt-1" />
                )}
                <p className="mt-2 flex items-center gap-1 text-piedra-texto">
                  <span aria-hidden="true">📍</span> {destino.ubicacion}
                </p>
              </div>
              <p className="whitespace-nowrap rounded-full bg-cielo px-4 py-2 text-sm font-bold text-cielo-700">
                {destino.precio_ingreso > 0 ? `Bs ${destino.precio_ingreso}` : 'Entrada libre'}
              </p>
            </div>

            <p className="mb-8 text-lg leading-7 text-noche/80">{destino.descripcion}</p>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {destino.horario && (
                <div className="rounded-2xl p-5 cristal">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cobre-texto">Horario</p>
                  <p className="text-noche/80">{destino.horario}</p>
                </div>
              )}
              {destino.direccion && (
                <div className="rounded-2xl p-5 cristal">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cobre-texto">Dirección</p>
                  <p className="text-noche/80">{destino.direccion}</p>
                </div>
              )}
              {destino.recomendaciones && (
                <div className="rounded-2xl p-5 cristal">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cobre-texto">Recomendaciones</p>
                  <p className="text-noche/80">{destino.recomendaciones}</p>
                </div>
              )}
            </div>

            {coordenadasValidas(destino.latitud, destino.longitud) && (
              <section className="mb-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Ubicación</p>
                <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-sal-2" />}>
                  <MapaUbicacion latitud={destino.latitud} longitud={destino.longitud} titulo={destino.nombre} clave={destino.categoria} />
                </Suspense>
              </section>
            )}

            <InfoPractica destino={destino} />

            <ActividadesDestino idDestino={destino.id} />

            <EstablecimientosCercanos
              idDepartamento={destino.id_departamento}
              idMunicipio={destino.id_municipio}
              nombreDepartamento={departamento?.nombre}
            />

            {galeria.length > 0 && (
              <div className="mb-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Galería</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {galeria.map((url, indice) => (
                    <button
                      key={url + indice}
                      type="button"
                      onClick={() => setIndiceVisor(indice)}
                      aria-label={`Ampliar foto ${indice + 1} de ${galeria.length}`}
                      className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-cielo-600"
                    >
                      <ImagenSegura
                        src={url}
                        alt={`${destino.nombre}, foto ${indice + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="h-32 w-full object-cover transition hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
                {destino.credito_imagenes && <p className="mt-3 text-xs text-piedra-texto">{destino.credito_imagenes}</p>}
              </div>
            )}

            <ResenasDestino idDestino={destino.id} onResenaCreada={() => setVersionCalificacion((valorAnterior) => valorAnterior + 1)} />

            <div className="border-t border-white/80 pt-6">
              <BotonReportar tipo="destino" elemento={destino} enlace={`/destinos/${destino.id}`} />
            </div>
          </article>
        )}
      </main>

      {indiceVisor !== null && (
        <VisorImagenes
          imagenes={galeria}
          indice={indiceVisor}
          titulo={destino.nombre}
          onCambiar={setIndiceVisor}
          onCerrar={() => setIndiceVisor(null)}
        />
      )}
    </div>
  )
}

export default DestinoDetalle
