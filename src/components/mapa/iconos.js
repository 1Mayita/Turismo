import L from 'leaflet'
import { SVG_DE_ICONO } from './iconosSvg.js'

// Color de los marcadores según el TIPO de lugar (no la categoría): son 3
// colores fáciles de distinguir, también con daltonismo (paleta validada con
// el validador del skill de visualización). La categoría del destino se
// reconoce por el ícono Lucide de adentro y por su nombre en la lista.
export const COLOR_POR_TIPO = {
  destino: '#b4532a', // atardecer-700
  restaurante: '#2a78d6',
  alojamiento: '#008300',
}

// Las categorías de destino usan su nombre; restaurantes y alojamientos
// tienen su propia clave.
export const ESTILOS_DE_MARCADOR = {
  Naturaleza: { color: COLOR_POR_TIPO.destino, etiqueta: 'Naturaleza' },
  Aventura: { color: COLOR_POR_TIPO.destino, etiqueta: 'Aventura' },
  Cultura: { color: COLOR_POR_TIPO.destino, etiqueta: 'Cultura' },
  Historia: { color: COLOR_POR_TIPO.destino, etiqueta: 'Historia' },
  Religioso: { color: COLOR_POR_TIPO.destino, etiqueta: 'Religioso' },
  Gastronomía: { color: COLOR_POR_TIPO.destino, etiqueta: 'Gastronomía' },
  Entretenimiento: { color: COLOR_POR_TIPO.destino, etiqueta: 'Entretenimiento' },
  restaurante: { color: COLOR_POR_TIPO.restaurante, etiqueta: 'Restaurante' },
  alojamiento: { color: COLOR_POR_TIPO.alojamiento, etiqueta: 'Alojamiento' },
}

const ESTILO_POR_DEFECTO = { color: COLOR_POR_TIPO.destino, etiqueta: 'Lugar' }

export function estiloDeMarcador(clave) {
  return ESTILOS_DE_MARCADOR[clave] || ESTILO_POR_DEFECTO
}

const cache = new Map()

// Marcador con forma de gota, del color del tipo de lugar y con su ícono
// dentro, al estilo de Google Maps. Se reutiliza el mismo ícono por clave.
export function iconoDeMarcador(clave) {
  if (!cache.has(clave)) {
    const { color } = estiloDeMarcador(clave)
    const svg = SVG_DE_ICONO[clave] || SVG_DE_ICONO.lugar
    cache.set(clave, L.divIcon({
      className: '',
      iconSize: [38, 46],
      iconAnchor: [19, 46],
      popupAnchor: [0, -42],
      html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 6px 14px rgba(14,34,51,.3);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);display:flex">${svg}</span></div>`,
    }))
  }
  return cache.get(clave)
}
