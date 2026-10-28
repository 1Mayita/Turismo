import { lazy, Suspense, useEffect, useState } from 'react'
import { Clock, Lightbulb, MapPin, Ticket } from 'lucide-react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BotonAgregarAViaje from '../../components/BotonAgregarAViaje.jsx'
import BotonCompartir from '../../components/BotonCompartir.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import BotonReportar from '../../components/BotonReportar.jsx'
import EstablecimientosCercanos from '../../components/EstablecimientosCercanos.jsx'
import GaleriaMosaico from '../../components/GaleriaMosaico.jsx'
import DatoClave from '../../components/ui/DatoClave.jsx'
import { ChipCategoria } from '../../components/ui/Chip.jsx'
import TituloSeccion from '../../components/ui/TituloSeccion.jsx'
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

  const precio = destino && (destino.precio_ingreso > 0 ? `Bs ${destino.precio_ingreso}` : 'Entrada libre')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-[1440px] pb-32 pt-8 lg:pb-12">
        <Migas pasos={migas} />

        {cargando ? (
          <div className="space-y-6" aria-hidden="true">
            <div className="h-80 w-full animate-pulse rounded-tarjeta bg-sal-2 sm:h-[440px]" />
            <div className="h-10 w-1/2 animate-pulse rounded-control bg-sal-2" />
            <div className="h-4 w-2/3 animate-pulse rounded-control bg-sal-2" />
          </div>
        ) : error ? (
          <p className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        ) : (
          <article>
            <GaleriaMosaico fotos={galeria} nombre={destino.nombre} credito={destino.credito_imagenes} alAbrir={setIndiceVisor} />

            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-12">
              <div className="min-w-0">
                <header className="mb-8">
                  {destino.categoria && <ChipCategoria nombre={destino.categoria} tamano="pequeno" className="mb-3" />}
                  <h1 className="titulo-display text-[40px] sm:text-[52px]">{destino.nombre}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {errorCalificacion ? (
                      <p className="text-sm font-semibold text-red-700" role="alert">{errorCalificacion}</p>
                    ) : calificacion && (
                      <ResumenCalificacion promedio={calificacion.promedio} total={calificacion.total} />
                    )}
                    <p className="flex items-center gap-1.5 text-piedra-texto">
                      <MapPin aria-hidden="true" size={18} className="text-piedra" /> {destino.ubicacion}
                    </p>
                  </div>
                  {/* En celular, compartir va aquí; guardar y agregar van en la barra de abajo. */}
                  <BotonCompartir titulo={destino.nombre} texto={`Mira ${destino.nombre} en Rutas de Bolivia:`} className="mt-4 lg:hidden" />
                </header>

                <p className="texto-lectura mb-8 text-lg text-noche/85">{destino.descripcion}</p>

                <div className="mb-14 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DatoClave icono={Ticket} etiqueta="Entrada">{precio}</DatoClave>
                  {destino.horario && <DatoClave icono={Clock} etiqueta="Horario">{destino.horario}</DatoClave>}
                  {destino.direccion && <DatoClave icono={MapPin} etiqueta="Dirección">{destino.direccion}</DatoClave>}
                  {destino.recomendaciones && <DatoClave icono={Lightbulb} etiqueta="Recomendaciones" ancho>{destino.recomendaciones}</DatoClave>}
                </div>

                {coordenadasValidas(destino.latitud, destino.longitud) && (
                  <section className="mb-14" aria-labelledby="titulo-ubicacion">
                    <TituloSeccion id="titulo-ubicacion">Ubicación</TituloSeccion>
                    <div className="overflow-hidden rounded-tarjeta border border-borde shadow-suave">
                      <Suspense fallback={<div className="h-72 animate-pulse bg-sal-2" />}>
                        <MapaUbicacion latitud={destino.latitud} longitud={destino.longitud} titulo={destino.nombre} clave={destino.categoria} />
                      </Suspense>
                    </div>
                  </section>
                )}

                <InfoPractica destino={destino} />

                <ActividadesDestino idDestino={destino.id} />

                <EstablecimientosCercanos
                  idDepartamento={destino.id_departamento}
                  idMunicipio={destino.id_municipio}
                  nombreDepartamento={departamento?.nombre}
                  angosto
                />

                <ResenasDestino idDestino={destino.id} onResenaCreada={() => setVersionCalificacion((valorAnterior) => valorAnterior + 1)} />

                <div className="border-t border-borde pt-6">
                  <BotonReportar tipo="destino" elemento={destino} enlace={`/destinos/${destino.id}`} />
                </div>
              </div>

              {/* Escritorio: acciones siempre a la vista mientras se baja. */}
              <aside className="hidden lg:block" aria-label="Acciones">
                <div className="sticky top-24 rounded-tarjeta border border-borde bg-white p-5 shadow-suave">
                  <p className="rotulo">Entrada</p>
                  <p className="titulo-display text-[36px] leading-tight">{precio}</p>
                  {calificacion?.total > 0 && <ResumenCalificacion promedio={calificacion.promedio} total={calificacion.total} className="mt-1" />}
                  <div className="mt-5 space-y-2.5">
                    <BotonAgregarAViaje destino={destino} className="w-full" />
                    <BotonFavorito idDestino={destino.id} conTexto />
                    <BotonCompartir titulo={destino.nombre} texto={`Mira ${destino.nombre} en Rutas de Bolivia:`} className="w-full" />
                  </div>
                  {destino.horario && (
                    <p className="mt-5 flex gap-2 border-t border-borde pt-4 text-sm text-piedra-texto">
                      <Clock aria-hidden="true" size={18} className="shrink-0 text-piedra" />
                      {destino.horario}
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </article>
        )}
      </main>

      {/* Celular: guardar y agregar al viaje siempre a mano (DESIGN.md §7). */}
      {destino && !cargando && !error && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-[auto_1fr] gap-3">
            <BotonFavorito idDestino={destino.id} conTexto />
            <BotonAgregarAViaje destino={destino} className="w-full" />
          </div>
        </div>
      )}

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
