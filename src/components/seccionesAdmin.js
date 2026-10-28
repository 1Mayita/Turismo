import {
  BarChart3,
  BedDouble,
  CalendarDays,
  Flag,
  Map as IconoMapa,
  MapPin,
  MessageSquareText,
  Mountain,
  Soup,
  Tags,
  Users,
  UtensilsCrossed,
} from 'lucide-react'

// Secciones del panel agrupadas por tema. Con todas visibles a la vez en la
// barra lateral (o en la cuadrícula del celular) ya no hace falta desplazar
// una fila de pestañas para descubrir las que faltan.
export const GRUPOS_ADMIN = [
  {
    titulo: 'General',
    enlaces: [
      { to: '/admin/estadisticas', etiqueta: 'Resumen y estadísticas', icono: BarChart3, detalle: 'Uso del sitio, visitas, reseñas y favoritos en el período elegido.' },
    ],
  },
  {
    titulo: 'Catálogo',
    enlaces: [
      { to: '/admin/destinos', etiqueta: 'Destinos', icono: MapPin, detalle: 'Lugares turísticos publicados, su ubicación, fotos e información práctica.' },
      { to: '/admin/departamentos', etiqueta: 'Departamentos', icono: IconoMapa, detalle: 'Departamentos, municipios y regiones que ordenan el catálogo.' },
      { to: '/admin/categorias', etiqueta: 'Categorías', icono: Tags, detalle: 'Tipos de turismo con los que se clasifican los destinos.' },
      { to: '/admin/actividades', etiqueta: 'Actividades', icono: Mountain, detalle: 'Qué se puede hacer en cada destino.' },
      { to: '/admin/eventos', etiqueta: 'Eventos', icono: CalendarDays, detalle: 'Fiestas, festivales y fechas de la agenda.' },
    ],
  },
  {
    titulo: 'Comer y dormir',
    enlaces: [
      { to: '/admin/platos', etiqueta: 'Platos típicos', icono: Soup, detalle: 'Gastronomía típica de cada región.' },
      { to: '/admin/restaurantes', etiqueta: 'Restaurantes', icono: UtensilsCrossed, detalle: 'Dónde comer, con su ubicación y datos de contacto.' },
      { to: '/admin/alojamientos', etiqueta: 'Alojamientos', icono: BedDouble, detalle: 'Dónde dormir, con su ubicación y datos de contacto.' },
    ],
  },
  {
    titulo: 'Comunidad',
    enlaces: [
      { to: '/admin/resenas', etiqueta: 'Reseñas', icono: MessageSquareText, detalle: 'Opiniones publicadas por los turistas.' },
      { to: '/admin/reportes', etiqueta: 'Reportes', icono: Flag, detalle: 'Avisos de información incorrecta enviados por los usuarios.' },
      { to: '/admin/usuarios', etiqueta: 'Usuarios', icono: Users, detalle: 'Cuentas registradas y sus roles.' },
    ],
  },
]

export function seccionActual(pathname) {
  for (const grupo of GRUPOS_ADMIN) {
    const enlace = grupo.enlaces.find((item) => pathname.startsWith(item.to))
    if (enlace) return { grupo, enlace }
  }
  return null
}
