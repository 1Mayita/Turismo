import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BedDouble, Check, Clock, ExternalLink, Globe, MapPin, Phone, UtensilsCrossed, Wallet } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import BotonCompartir from '../../components/BotonCompartir.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import BotonReportar from '../../components/BotonReportar.jsx'
import GaleriaMosaico from '../../components/GaleriaMosaico.jsx'
import DatoClave from '../../components/ui/DatoClave.jsx'
import TituloSeccion from '../../components/ui/TituloSeccion.jsx'
import { claseBoton } from '../../components/ui/estilos.js'
import Migas from '../../components/Migas.jsx'
import VisorImagenes from '../../components/VisorImagenes.jsx'
import { ResumenCalificacion } from '../../components/Estrellas.jsx'
import ResenasDestino from '../DestinoDetalle/ResenasDestino.jsx'
import { getPromedioDe } from '../../services/resenasService.js'
import { useTituloPagina } from '../../hooks/useTituloPagina.js'
import { coordenadasValidas } from '../../utils/geo.js'
import { ESTABLECIMIENTOS } from './configuracion.js'

// El mapa (Leaflet) se descarga aparte, solo cuando hay coordenadas que mostrar.
const MapaUbicacion = lazy(() => import('../../components/mapa/MapaUbicacion.jsx'))

const REDES = [
  { campo: 'facebook', etiqueta: 'Facebook' },
  { campo: 'instagram', etiqueta: 'Instagram' },
  { campo: 'sitio_web', etiqueta: 'Sitio web' },
]

// Detalle de un restaurante o de un alojamiento (según "tipo"): fotos, datos
// de contacto, menú o servicios, mapa y reseñas.
function EstablecimientoDetalle({ tipo }) {
  const configuracion = ESTABLECIMIENTOS[tipo]
  const esRestaurante = tipo === 'restaurante'
  const { id } = useParams()
  const [establecimiento, setEstablecimiento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [indiceVisor, setIndiceVisor] = useState(null)
  const [calificacion, setCalificacion] = useState(null)
  const [versionCalificacion, setVersionCalificacion] = useState(0)

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const encontrado = await configuracion.obtener(id)
        if (!activo) return
        if (!encontrado) setError(`No encontramos este ${configuracion.singular}.`)
        else setEstablecimiento(encontrado)
      } catch (errorLectura) {
        console.error(`Error al consultar el ${configuracion.singular}:`, errorLectura)
        if (activo) setError(`No se pudo cargar la información del ${configuracion.singular}.`)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [configuracion, id])

  useEffect(() => {
    let activo = true
    getPromedioDe(tipo, id)
      .then((resultado) => {
        if (activo) setCalificacion(resultado)
      })
      .catch((errorLectura) => console.error('Error al calcular el promedio de calificación:', errorLectura))
    return () => {
      activo = false
    }
  }, [tipo, id, versionCalificacion])

  useTituloPagina(establecimiento?.nombre || configuracion.titulo)

  const lugar = establecimiento || {}
  const galeria = (lugar.imagenes?.length > 0 ? lugar.imagenes : [lugar.imagen_principal]).filter(Boolean)
  const menu = Array.isArray(lugar.menu) ? lugar.menu : []
  const platos = Array.isArray(lugar.platos_tipicos) ? lugar.platos_tipicos : []
  const servicios = Array.isArray(lugar.servicios) ? lugar.servicios : []
  const redes = REDES.filter((red) => lugar[red.campo])
  const tieneMapa = coordenadasValidas(lugar.latitud, lugar.longitud)

  const migas = [
    { etiqueta: 'Inicio', to: '/' },
    { etiqueta: configuracion.titulo, to: configuracion.ruta },
    { etiqueta: lugar.nombre || configuracion.titulo },
  ]

  const IconoTipo = esRestaurante ? UtensilsCrossed : BedDouble

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-6xl pb-16 pt-8">
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
            {galeria.length > 0 && (
              <GaleriaMosaico
                fotos={galeria}
                nombre={lugar.nombre}
                credito="Fotos referenciales de Wikimedia Commons (licencias Creative Commons)."
                alAbrir={setIndiceVisor}
              />
            )}

            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
              <div className="min-w-0">
                <header className="mb-8">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cielo px-2.5 py-1 text-xs font-bold text-noche">
                    <IconoTipo aria-hidden="true" size={14} className="text-cielo-700" />
                    {esRestaurante ? 'Restaurante' : lugar.tipo || 'Alojamiento'}
                  </span>
                  <h1 className="titulo-display text-[40px] sm:text-[52px]">{lugar.nombre}</h1>
                  {esRestaurante && lugar.especialidad && <p className="mt-1 font-bold text-cobre-texto">{lugar.especialidad}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {calificacion && <ResumenCalificacion promedio={calificacion.promedio} total={calificacion.total} />}
                    {lugar.ubicacion && (
                      <p className="flex items-center gap-1.5 text-piedra-texto">
                        <MapPin aria-hidden="true" size={18} className="text-piedra" />
                        {[lugar.ubicacion, lugar.direccion].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                    <BotonFavorito idElemento={lugar.id} tipo={tipo} conTexto />
                    <BotonCompartir titulo={lugar.nombre} texto={`Mira ${lugar.nombre} en Rutas de Bolivia:`} />
                  </div>
                </header>

                {lugar.descripcion && <p className="texto-lectura mb-8 text-lg text-noche/85">{lugar.descripcion}</p>}

                <div className="mb-14 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {!esRestaurante && lugar.precio_noche != null && (
                    <DatoClave icono={Wallet} etiqueta="Precio por noche">Bs {Number(lugar.precio_noche).toFixed(0)} (referencial)</DatoClave>
                  )}
                  {esRestaurante && lugar.horario && <DatoClave icono={Clock} etiqueta="Días y horarios de atención">{lugar.horario}</DatoClave>}
                  {!esRestaurante && (lugar.check_in || lugar.check_out) && (
                    <DatoClave icono={Clock} etiqueta="Horarios">
                      {lugar.check_in && <span className="block">Entrada (check-in): desde las {lugar.check_in}</span>}
                      {lugar.check_out && <span className="block">Salida (check-out): hasta las {lugar.check_out}</span>}
                    </DatoClave>
                  )}
                  {lugar.telefono && (
                    <DatoClave icono={Phone} etiqueta="Teléfono de contacto">
                      <a href={`tel:${String(lugar.telefono).replace(/\s+/g, '')}`} className="font-bold text-cielo-700 underline">{lugar.telefono}</a>
                    </DatoClave>
                  )}
                  {redes.length > 0 && (
                    <DatoClave icono={Globe} etiqueta="Redes sociales y web">
                      <span className="mt-1 flex flex-wrap gap-2">
                        {redes.map((red) => (
                          <a key={red.campo} href={lugar[red.campo]} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full bg-cielo px-3 text-sm font-bold text-noche transition hover:bg-cielo-600/30">
                            {red.etiqueta}
                            <ExternalLink aria-hidden="true" size={14} />
                          </a>
                        ))}
                      </span>
                    </DatoClave>
                  )}
                </div>

                {esRestaurante && (menu.length > 0 || platos.length > 0) && (
                  <section className="mb-14" aria-labelledby="titulo-menu">
                    <TituloSeccion id="titulo-menu">Menú</TituloSeccion>
                    {menu.length > 0 ? (
                      <ul className="divide-y divide-borde rounded-tarjeta border border-borde bg-white px-5 shadow-suave">
                        {menu.map((plato) => (
                          <li key={plato.nombre} className="flex items-center justify-between gap-4 py-3.5">
                            <span className="font-bold text-noche">{plato.nombre}</span>
                            {plato.precio != null && plato.precio !== '' && <span className="whitespace-nowrap font-bold text-atardecer-700">Bs {plato.precio}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {platos.map((plato) => <li key={plato} className="rounded-full bg-cielo px-4 py-1.5 text-sm font-bold text-noche">{plato}</li>)}
                      </ul>
                    )}
                  </section>
                )}

                {!esRestaurante && servicios.length > 0 && (
                  <section className="mb-14" aria-labelledby="titulo-servicios">
                    <TituloSeccion id="titulo-servicios">Servicios incluidos</TituloSeccion>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {servicios.map((servicio) => (
                        <li key={servicio} className="flex items-center gap-2.5 rounded-control border border-borde bg-white px-4 py-3 text-sm font-bold text-noche">
                          <Check aria-hidden="true" size={18} className="shrink-0 text-emerald-700" />
                          {servicio}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {tieneMapa && (
                  <section className="mb-14" aria-labelledby="titulo-ubicacion">
                    <TituloSeccion id="titulo-ubicacion">Ubicación</TituloSeccion>
                    <div className="overflow-hidden rounded-tarjeta border border-borde shadow-suave">
                      <Suspense fallback={<div className="h-72 animate-pulse bg-sal-2" />}>
                        <MapaUbicacion latitud={lugar.latitud} longitud={lugar.longitud} titulo={lugar.nombre} clave={tipo} />
                      </Suspense>
                    </div>
                  </section>
                )}

                <ResenasDestino tipo={tipo} idElemento={lugar.id} onResenaCreada={() => setVersionCalificacion((valorAnterior) => valorAnterior + 1)} />

                <div className="border-t border-borde pt-6">
                  <BotonReportar tipo={tipo} elemento={lugar} enlace={`${configuracion.ruta}/${lugar.id}`} />
                </div>
              </div>

              {/* Escritorio: datos y acciones siempre a la vista. */}
              <aside className="hidden lg:block" aria-label="Acciones">
                <div className="sticky top-24 rounded-tarjeta border border-borde bg-white p-5 shadow-suave">
                  {!esRestaurante && lugar.precio_noche != null ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-cobre-texto">Por noche</p>
                      <p className="titulo-display text-[36px] leading-tight">Bs {Number(lugar.precio_noche).toFixed(0)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-cobre-texto">{esRestaurante ? 'Restaurante' : 'Alojamiento'}</p>
                      <p className="titulo-display text-[32px] leading-tight">{lugar.nombre}</p>
                    </>
                  )}
                  {calificacion?.total > 0 && <ResumenCalificacion promedio={calificacion.promedio} total={calificacion.total} className="mt-1" />}
                  <div className="mt-5 space-y-2.5">
                    <BotonFavorito idElemento={lugar.id} tipo={tipo} conTexto />
                    <BotonCompartir titulo={lugar.nombre} texto={`Mira ${lugar.nombre} en Rutas de Bolivia:`} className="w-full" />
                    {lugar.telefono && (
                      <a href={`tel:${String(lugar.telefono).replace(/\s+/g, '')}`} className={claseBoton('fantasma', 'pequeno', 'w-full')}>
                        <Phone aria-hidden="true" size={16} /> Llamar
                      </a>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </article>
        )}
      </main>

      {indiceVisor !== null && (
        <VisorImagenes
          imagenes={galeria}
          indice={indiceVisor}
          titulo={lugar.nombre}
          onCambiar={setIndiceVisor}
          onCerrar={() => setIndiceVisor(null)}
        />
      )}
    </div>
  )
}

export default EstablecimientoDetalle
