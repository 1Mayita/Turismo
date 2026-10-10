import L from 'leaflet'

// Símbolo y color de cada tipo de lugar en el mapa. Las categorías de destino
// usan su nombre; restaurantes y alojamientos tienen su propia clave.
export const ESTILOS_DE_MARCADOR = {
  Naturaleza: { simbolo: '🌿', color: '#059669', etiqueta: 'Naturaleza' },
  Aventura: { simbolo: '🧗', color: '#0d9488', etiqueta: 'Aventura' },
  Cultura: { simbolo: '🎭', color: '#d97706', etiqueta: 'Cultura' },
  Historia: { simbolo: '🏛️', color: '#92400e', etiqueta: 'Historia' },
  Religioso: { simbolo: '⛪', color: '#7c3aed', etiqueta: 'Religioso' },
  Gastronomía: { simbolo: '🍲', color: '#ea580c', etiqueta: 'Gastronomía' },
  Entretenimiento: { simbolo: '🎡', color: '#db2777', etiqueta: 'Entretenimiento' },
  restaurante: { simbolo: '🍴', color: '#dc2626', etiqueta: 'Restaurante' },
  alojamiento: { simbolo: '🛏️', color: '#2563eb', etiqueta: 'Alojamiento' },
}

const ESTILO_POR_DEFECTO = { simbolo: '📍', color: '#0e7490', etiqueta: 'Lugar' }

export function estiloDeMarcador(clave) {
  return ESTILOS_DE_MARCADOR[clave] || ESTILO_POR_DEFECTO
}

const cache = new Map()

// Marcador con forma de gota, del color de la categoría y con su símbolo
// dentro, al estilo de Google Maps. Se reutiliza el mismo ícono por categoría.
export function iconoDeMarcador(clave) {
  if (!cache.has(clave)) {
    const { simbolo, color } = estiloDeMarcador(clave)
    cache.set(clave, L.divIcon({
      className: '',
      iconSize: [38, 46],
      iconAnchor: [19, 46],
      popupAnchor: [0, -42],
      html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:17px;line-height:1">${simbolo}</span></div>`,
    }))
  }
  return cache.get(clave)
}
