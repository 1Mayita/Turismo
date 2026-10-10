import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { iconoDeMarcador } from './iconos.js'

// Mapa pequeño con un solo marcador, para el detalle de un destino,
// restaurante o alojamiento. "clave" elige el ícono (categoría o tipo).
// El zoom con la rueda está apagado para no atrapar el scroll de la página.
function MapaUbicacion({ latitud, longitud, titulo, clave }) {
  const posicion = [Number(latitud), Number(longitud)]

  return (
    <div>
      {/* "relative z-0" encierra los z-index de Leaflet para que no tapen la Navbar. */}
      <div className="relative z-0 h-72 overflow-hidden rounded-2xl ring-1 ring-white/80">
        <MapContainer center={posicion} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={posicion} icon={iconoDeMarcador(clave)}>
            <Popup>{titulo}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${posicion[0]},${posicion[1]}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-sm font-semibold text-brand-700 underline"
      >
        Cómo llegar (abre Google Maps)
      </a>
    </div>
  )
}

export default MapaUbicacion
