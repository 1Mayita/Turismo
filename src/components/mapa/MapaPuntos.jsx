import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { iconoDeMarcador } from './iconos.js'

// Encuadra el mapa para que se vean todos los puntos (y el usuario, si se sabe).
function Encuadre({ posiciones }) {
  const mapa = useMap()
  const clave = posiciones.map((posicion) => posicion.join(',')).join(';')
  useEffect(() => {
    if (posiciones.length === 1) mapa.setView(posiciones[0], 14)
    else if (posiciones.length > 1) mapa.fitBounds(posiciones, { padding: [36, 36], maxZoom: 15 })
    // "clave" resume las posiciones: solo se reencuadra si cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, clave])
  return null
}

// Mapa con varios marcadores del mismo tipo (ej. los restaurantes que sirven
// un plato). puntos: [{ id, latitud, longitud, titulo, detalle, enlace }].
function MapaPuntos({ puntos, clave, usuario }) {
  const posiciones = puntos.map((punto) => [Number(punto.latitud), Number(punto.longitud)])
  const todas = usuario ? [...posiciones, [usuario.latitud, usuario.longitud]] : posiciones

  return (
    <div className="relative z-0 h-72 overflow-hidden rounded-imagen border border-borde">
      <MapContainer center={todas[0] || [-16.5, -64.7]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Encuadre posiciones={todas} />
        {puntos.map((punto, indice) => (
          <Marker key={punto.id} position={posiciones[indice]} icon={iconoDeMarcador(clave)}>
            <Popup>
              <strong>{punto.titulo}</strong>
              {punto.detalle && <><br />{punto.detalle}</>}
              {punto.enlace && <><br /><Link to={punto.enlace}>Ver detalles</Link></>}
            </Popup>
          </Marker>
        ))}
        {usuario && (
          <CircleMarker center={[usuario.latitud, usuario.longitud]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2a78d6', fillOpacity: 1 }}>
            <Popup>Tu ubicación</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}

export default MapaPuntos
