import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import { getDestinoPorId } from '../../services/destinosService.js'

function DestinoDetalle() {
  const { id } = useParams()
  const [destino, setDestino] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null)

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
      } catch (errorLectura) {
        console.error('Error al consultar el destino en Firestore:', errorLectura)
        setError('No se pudo cargar la información del destino.')
      } finally {
        setCargando(false)
      }
    }

    cargarDestino()
  }, [id])

  const galeria = destino ? (destino.imagenes?.length > 0 ? destino.imagenes : [destino.imagen_principal]) : []

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <Link to="/destinos" className="mb-6 inline-block text-sm font-semibold text-brand-700 underline">
          ← Volver a destinos
        </Link>

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
            <div className="relative mb-8 h-80 w-full overflow-hidden rounded-3xl">
              <img src={destino.imagen_principal} alt={destino.nombre} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-700">
                {destino.categoria}
              </span>
            </div>

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-brand-900">{destino.nombre}</h1>
                <p className="mt-2 flex items-center gap-1 text-slate-600">
                  <span aria-hidden="true">📍</span> {destino.ubicacion}
                </p>
              </div>
              <p className="whitespace-nowrap rounded-full bg-brand-100 px-4 py-2 text-sm font-bold text-brand-800">
                {destino.precio_ingreso > 0 ? `Bs ${destino.precio_ingreso}` : 'Entrada libre'}
              </p>
            </div>

            <p className="mb-8 text-lg leading-7 text-slate-700">{destino.descripcion}</p>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {destino.horario && (
                <div className="rounded-2xl bg-white p-5 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent-600">Horario</p>
                  <p className="text-slate-700">{destino.horario}</p>
                </div>
              )}
              {destino.direccion && (
                <div className="rounded-2xl bg-white p-5 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent-600">Dirección</p>
                  <p className="text-slate-700">{destino.direccion}</p>
                  {destino.latitud && destino.longitud && (
                    <a
                      href={`https://www.google.com/maps?q=${destino.latitud},${destino.longitud}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-brand-700 underline"
                    >
                      Ver en el mapa
                    </a>
                  )}
                </div>
              )}
              {destino.recomendaciones && (
                <div className="rounded-2xl bg-white p-5 shadow-md shadow-brand-950/5 ring-1 ring-brand-900/5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent-600">Recomendaciones</p>
                  <p className="text-slate-700">{destino.recomendaciones}</p>
                </div>
              )}
            </div>

            {galeria.length > 0 && (
              <div>
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Galería</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {galeria.map((url, indice) => (
                    <button
                      key={url + indice}
                      type="button"
                      onClick={() => setImagenSeleccionada(url)}
                      className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600"
                    >
                      <img
                        src={url}
                        alt={`${destino.nombre} ${indice + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="h-32 w-full object-cover transition hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>

      {imagenSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setImagenSeleccionada(null)}
        >
          <button
            type="button"
            onClick={() => setImagenSeleccionada(null)}
            className="absolute right-6 top-6 text-3xl font-bold text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
          <img src={imagenSeleccionada} alt="Vista ampliada" className="max-h-[85vh] max-w-4xl rounded-2xl object-contain" />
        </div>
      )}
    </div>
  )
}

export default DestinoDetalle
