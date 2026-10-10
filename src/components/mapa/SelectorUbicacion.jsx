import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { iconoDeMarcador } from './iconos.js'
import { coordenadasValidas, obtenerUbicacionDelUsuario } from '../../utils/geo.js'

const CENTRO_BOLIVIA = [-16.5, -64.8]
const ZOOM_PAIS = 5
const ZOOM_LUGAR = 14
const DECIMALES = 5 // unos 1,1 metros de precisión: suficiente para un lugar turístico

function redondear(valor) {
  return Number(valor.toFixed(DECIMALES))
}

// Un clic en cualquier punto del mapa fija ahí la ubicación.
function ClicEnMapa({ onElegir }) {
  useMapEvents({
    click: (evento) => onElegir(evento.latlng.lat, evento.latlng.lng),
  })
  return null
}

// Lleva el mapa al punto cuando las coordenadas cambian desde afuera (al
// escribirlas a mano, al usar "mi ubicación" o al abrir otro registro).
function SeguirPunto({ posicion }) {
  const mapa = useMap()
  const [latitud, longitud] = posicion || []
  useEffect(() => {
    if (latitud === undefined) return
    if (!mapa.getBounds().contains([latitud, longitud]) || mapa.getZoom() < 9) {
      mapa.setView([latitud, longitud], Math.max(mapa.getZoom(), ZOOM_LUGAR))
    }
  }, [mapa, latitud, longitud])
  return null
}

// Mapa para elegir la ubicación de un lugar en los formularios del panel:
// clic para colocar el marcador, o arrastrarlo para ajustarlo.
// onCambiar recibe { latitud, longitud } (números) o { latitud: '', longitud: '' } al quitarla.
// "clave" elige el ícono del marcador (categoría del destino, 'restaurante' o 'alojamiento').
function SelectorUbicacion({ latitud, longitud, onCambiar, clave }) {
  const marcador = useRef(null)
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false)
  const [error, setError] = useState('')
  const tienePunto = coordenadasValidas(latitud, longitud)
  const posicion = tienePunto ? [Number(latitud), Number(longitud)] : null

  function elegir(nuevaLatitud, nuevaLongitud) {
    setError('')
    onCambiar({ latitud: redondear(nuevaLatitud), longitud: redondear(nuevaLongitud) })
  }

  const alArrastrar = useMemo(() => ({
    dragend() {
      const punto = marcador.current?.getLatLng()
      if (punto) onCambiar({ latitud: redondear(punto.lat), longitud: redondear(punto.lng) })
    },
  }), [onCambiar])

  async function usarMiUbicacion() {
    setError('')
    setCargandoUbicacion(true)
    try {
      const ubicacion = await obtenerUbicacionDelUsuario()
      elegir(ubicacion.latitud, ubicacion.longitud)
    } catch (errorGeolocalizacion) {
      setError(errorGeolocalizacion.message)
    } finally {
      setCargandoUbicacion(false)
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Ubicación en el mapa</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={usarMiUbicacion} disabled={cargandoUbicacion} className="rounded-lg border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-white disabled:opacity-60">
            {cargandoUbicacion ? 'Buscando...' : 'Usar mi ubicación actual'}
          </button>
          {tienePunto && (
            <button type="button" onClick={() => onCambiar({ latitud: '', longitud: '' })} className="rounded-lg border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-white">
              Quitar ubicación
            </button>
          )}
        </div>
      </div>

      {/* "relative z-0" encierra los z-index de Leaflet para que no tapen la Navbar. */}
      <div className="relative z-0 h-80 overflow-hidden rounded-2xl ring-1 ring-sky-200">
        <MapContainer center={posicion || CENTRO_BOLIVIA} zoom={posicion ? ZOOM_LUGAR : ZOOM_PAIS} scrollWheelZoom className="h-full w-full cursor-crosshair">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClicEnMapa onElegir={elegir} />
          <SeguirPunto posicion={posicion} />
          {posicion && <Marker ref={marcador} position={posicion} icon={iconoDeMarcador(clave)} draggable eventHandlers={alArrastrar} />}
        </MapContainer>
      </div>

      <p className="mt-2 text-xs text-slate-500" aria-live="polite">
        {tienePunto
          ? `Ubicación marcada: ${Number(latitud)}, ${Number(longitud)}. Haz clic en otro punto o arrastra el marcador para ajustarla.`
          : 'Haz clic en el mapa para marcar dónde está. Acerca el mapa con la rueda del mouse o los botones + y −.'}
      </p>
      {error && <p className="mt-1 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  )
}

export default SelectorUbicacion
