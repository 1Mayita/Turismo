import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Marcador redondo con el número de la parada.
function iconoNumerado(numero) {
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:#0e2233;color:#fff;border:3px solid #fff;box-shadow:0 6px 14px rgba(14,34,51,.3);display:flex;align-items:center;justify-content:center;font:800 14px/1 'Manrope',sans-serif">${numero}</div>`,
  })
}

// Encuadra el mapa para que se vean todas las paradas.
function Encuadrar({ puntos }) {
  const mapa = useMap()
  // Las posiciones se resumen en un texto para reencuadrar solo cuando cambian
  // de verdad (y no en cada render, aunque la lista sea un objeto nuevo).
  const clave = puntos.map((punto) => punto.posicion.join(',')).join('|')
  useEffect(() => {
    const posiciones = clave ? clave.split('|').map((par) => par.split(',').map(Number)) : []
    if (posiciones.length === 1) mapa.setView(posiciones[0], 11)
    else if (posiciones.length > 1) mapa.fitBounds(posiciones, { padding: [40, 40] })
  }, [mapa, clave])
  return null
}

// Mapa del itinerario: puntos numerados en orden de visita unidos por una
// línea punteada (es el orden del recorrido, no el trazado de la carretera).
// puntos: [{ numero, nombre, posicion: [lat, lng] }]
function MapaRuta({ puntos }) {
  return (
    <div className="relative z-0 h-80 overflow-hidden rounded-tarjeta border border-borde shadow-suave lg:h-full lg:min-h-[28rem]">
      <MapContainer center={[-16.5, -64.8]} zoom={5} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Encuadrar puntos={puntos} />
        {puntos.length > 1 && (
          <Polyline positions={puntos.map((punto) => punto.posicion)} pathOptions={{ color: '#b4532a', weight: 3, opacity: 0.9, dashArray: '8 10' }} />
        )}
        {puntos.map((punto) => (
          <Marker key={`${punto.numero}-${punto.nombre}`} position={punto.posicion} icon={iconoNumerado(punto.numero)} title={`${punto.numero}. ${punto.nombre}`}>
            <Popup>
              <strong>{punto.numero}. {punto.nombre}</strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapaRuta
