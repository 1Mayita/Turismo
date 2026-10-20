import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BotonCompartir from '../../components/BotonCompartir.jsx'
import BotonFavorito from '../../components/BotonFavorito.jsx'
import BotonReportar from '../../components/BotonReportar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
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

function Dato({ titulo, children }) {
  return (
    <div className="rounded-2xl cristal p-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent-600">{titulo}</p>
      <div className="text-slate-700">{children}</div>
    </div>
  )
}

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-5xl py-12">
        <Migas pasos={migas} />

        {cargando ? (
          <div className="animate-pulse space-y-6">
            <div className="h-80 w-full rounded-3xl bg-white/50" />
            <div className="h-6 w-1/3 rounded bg-white/50" />
            <div className="h-4 w-2/3 rounded bg-white/50" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>
        ) : (
          <article>
            <div className="relative mb-8 h-72 w-full overflow-hidden rounded-3xl sm:h-[26rem]">
              <ImagenSegura key={lugar.imagen_principal} src={lugar.imagen_principal} alt={lugar.nombre} className="h-full w-full object-cover" />
              <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-brand-800 shadow-sm">
                {esRestaurante ? 'Restaurante' : lugar.tipo || 'Alojamiento'}
              </span>
            </div>

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-slate-900">{lugar.nombre}</h1>
                  <BotonFavorito idElemento={lugar.id} tipo={tipo} />
                </div>
                <BotonCompartir className="mt-3" titulo={lugar.nombre} texto={`Mira ${lugar.nombre} en Rutas de Bolivia:`} />
                {calificacion && <ResumenCalificacion promedio={calificacion.promedio} total={calificacion.total} className="mt-1" />}
                {esRestaurante && lugar.especialidad && <p className="mt-2 font-semibold text-accent-600">{lugar.especialidad}</p>}
                {lugar.ubicacion && <p className="mt-1 text-slate-600">{[lugar.ubicacion, lugar.direccion].filter(Boolean).join(' · ')}</p>}
              </div>
              {!esRestaurante && lugar.precio_noche != null && (
                <p className="whitespace-nowrap rounded-2xl bg-brand-100 px-5 py-3 text-brand-900">
                  <span className="text-2xl font-extrabold">Bs {Number(lugar.precio_noche).toFixed(0)}</span>
                  <span className="text-sm"> por noche (referencial)</span>
                </p>
              )}
            </div>

            {lugar.descripcion && <p className="mb-8 text-lg leading-7 text-slate-700">{lugar.descripcion}</p>}

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {esRestaurante && lugar.horario && <Dato titulo="Días y horarios de atención">{lugar.horario}</Dato>}
              {!esRestaurante && (lugar.check_in || lugar.check_out) && (
                <Dato titulo="Horarios">
                  {lugar.check_in && <p>Entrada (check-in): desde las {lugar.check_in}</p>}
                  {lugar.check_out && <p>Salida (check-out): hasta las {lugar.check_out}</p>}
                </Dato>
              )}
              {lugar.telefono && (
                <Dato titulo="Teléfono de contacto">
                  <a href={`tel:${String(lugar.telefono).replace(/\s+/g, '')}`} className="font-semibold text-brand-700 underline">{lugar.telefono}</a>
                </Dato>
              )}
              {redes.length > 0 && (
                <Dato titulo="Redes sociales y web">
                  <ul className="flex flex-wrap gap-2">
                    {redes.map((red) => (
                      <li key={red.campo}>
                        <a href={lugar[red.campo]} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800 transition hover:bg-brand-200">
                          {red.etiqueta} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </Dato>
              )}
            </div>

            {esRestaurante && (menu.length > 0 || platos.length > 0) && (
              <section className="mb-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Menú</p>
                {menu.length > 0 ? (
                  <ul className="divide-y divide-white/80 rounded-2xl cristal px-5">
                    {menu.map((plato) => (
                      <li key={plato.nombre} className="flex items-center justify-between gap-4 py-3">
                        <span className="font-semibold text-slate-800">{plato.nombre}</span>
                        {plato.precio != null && plato.precio !== '' && <span className="whitespace-nowrap font-bold text-brand-800">Bs {plato.precio}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {platos.map((plato) => <li key={plato} className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-white/80">{plato}</li>)}
                  </ul>
                )}
              </section>
            )}

            {!esRestaurante && servicios.length > 0 && (
              <section className="mb-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Servicios incluidos</p>
                <ul className="flex flex-wrap gap-2">
                  {servicios.map((servicio) => (
                    <li key={servicio} className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800">✓ {servicio}</li>
                  ))}
                </ul>
              </section>
            )}

            {tieneMapa && (
              <section className="mb-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Ubicación</p>
                <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-sal-2" />}>
                  <MapaUbicacion latitud={lugar.latitud} longitud={lugar.longitud} titulo={lugar.nombre} clave={tipo} />
                </Suspense>
              </section>
            )}

            {galeria.length > 0 && (
              <section className="mb-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Galería</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {galeria.map((url, indice) => (
                    <button
                      key={url + indice}
                      type="button"
                      onClick={() => setIndiceVisor(indice)}
                      aria-label={`Ampliar foto ${indice + 1} de ${galeria.length}`}
                      className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600"
                    >
                      <ImagenSegura src={url} alt={`${lugar.nombre}, foto ${indice + 1}`} loading="lazy" decoding="async" className="h-32 w-full object-cover transition hover:scale-105" />
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">Fotos referenciales de Wikimedia Commons (licencias Creative Commons).</p>
              </section>
            )}

            <ResenasDestino tipo={tipo} idElemento={lugar.id} onResenaCreada={() => setVersionCalificacion((valorAnterior) => valorAnterior + 1)} />

            <div className="border-t border-white/80 pt-6">
              <BotonReportar tipo={tipo} elemento={lugar} enlace={`${configuracion.ruta}/${lugar.id}`} />
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
