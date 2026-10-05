import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconoMarcador from 'leaflet/dist/images/marker-icon.png'
import iconoMarcador2x from 'leaflet/dist/images/marker-icon-2x.png'
import sombraMarcador from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../../components/Navbar.jsx'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'

const CENTRO_BOLIVIA = [-16.5, -64.8]
const ZOOM_INICIAL = 6

// Vite cambia las rutas de las imágenes, así que el ícono por defecto de
// Leaflet no las encuentra: se declara el ícono con las imágenes importadas.
const iconoDestino = L.icon({
  iconUrl: iconoMarcador,
  iconRetinaUrl: iconoMarcador2x,
  shadowUrl: sombraMarcador,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Number(null) y Number('') dan 0, por eso se descartan antes de convertir.
function tieneCoordenadas(destino) {
  return [destino.latitud, destino.longitud].every((valor) =>
    valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor)))
}

function Mapa() {
  const [destinos, setDestinos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDestinos() {
      try {
        const destinosFirestore = await getDestinos()
        setDestinos(destinosFirestore.length > 0 ? destinosFirestore : destinosDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al consultar destinos para el mapa:', errorLectura)
        setDestinos(destinosDeEjemplo)
        setError('No se pudo consultar Firestore. Mostramos destinos de ejemplo en el mapa.')
      } finally {
        setCargando(false)
      }
    }

    cargarDestinos()
  }, [])

  const ubicados = destinos.filter(tieneCoordenadas)
  const sinUbicar = destinos.length - ubicados.length

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Mapa turístico</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Bolivia en el mapa</h1>
          <p className="mt-4 text-lg text-slate-600">Toca un marcador para ver el destino.</p>
        </div>

        {error && <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        {/* "relative z-0" encierra los z-index de Leaflet para que no tapen la Navbar. */}
        <div className="relative z-0 h-[70vh] min-h-96 overflow-hidden rounded-3xl shadow-xl shadow-brand-950/10 ring-1 ring-brand-900/5">
          {cargando ? (
            <div className="h-full w-full animate-pulse bg-white" />
          ) : (
            <MapContainer center={CENTRO_BOLIVIA} zoom={ZOOM_INICIAL} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {ubicados.map((destino) => (
                <Marker key={destino.id || destino.nombre} position={[Number(destino.latitud), Number(destino.longitud)]} icon={iconoDestino}>
                  <Popup>
                    <p className="m-0! font-bold text-brand-900">{destino.nombre}</p>
                    {destino.ubicacion && <p className="m-0! text-xs text-slate-600">{destino.ubicacion}</p>}
                    {destino.id && (
                      <Link to={`/destinos/${destino.id}`} className="mt-1 inline-block font-semibold text-brand-700 underline">
                        Ver destino
                      </Link>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {!cargando && sinUbicar > 0 && (
          <p className="mt-4 text-sm text-slate-500">
            {sinUbicar} {sinUbicar === 1 ? 'destino no tiene' : 'destinos no tienen'} coordenadas y no aparecen en el mapa.
          </p>
        )}
      </main>
    </div>
  )
}

export default Mapa
