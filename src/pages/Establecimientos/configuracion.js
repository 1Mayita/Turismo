import { getAlojamientoPorId, getAlojamientos } from '../../services/alojamientosService.js'
import { getRestaurantePorId, getRestaurantes } from '../../services/restaurantesService.js'

// Restaurantes y alojamientos comparten la misma página de listado y la misma
// página de detalle; aquí está lo que cambia entre uno y otro.
export const ESTABLECIMIENTOS = {
  restaurante: {
    tipo: 'restaurante',
    ruta: '/restaurantes',
    singular: 'restaurante',
    plural: 'restaurantes',
    rotulo: 'Sabores locales',
    titulo: 'Restaurantes',
    bajada: 'Encuentra dónde comer: especialidad, menú, horarios y opiniones de otros viajeros.',
    etiquetaBusqueda: 'Buscar por nombre, plato o lugar',
    ejemploBusqueda: 'Ej.: silpancho, Sucre...',
    listar: getRestaurantes,
    obtener: getRestaurantePorId,
    textosDeBusqueda: (restaurante) => [
      restaurante.nombre,
      restaurante.ubicacion,
      restaurante.direccion,
      restaurante.especialidad,
      Array.isArray(restaurante.platos_tipicos) ? restaurante.platos_tipicos : [],
    ],
  },
  alojamiento: {
    tipo: 'alojamiento',
    ruta: '/alojamientos',
    singular: 'alojamiento',
    plural: 'alojamientos',
    rotulo: 'Planifica tu estadía',
    titulo: 'Alojamientos',
    bajada: 'Hoteles, hostales y lodges con servicios, precio por noche y opiniones de otros viajeros.',
    etiquetaBusqueda: 'Buscar por nombre, tipo o lugar',
    ejemploBusqueda: 'Ej.: hostal, Uyuni...',
    listar: getAlojamientos,
    obtener: getAlojamientoPorId,
    textosDeBusqueda: (alojamiento) => [
      alojamiento.nombre,
      alojamiento.ubicacion,
      alojamiento.direccion,
      alojamiento.tipo,
      Array.isArray(alojamiento.servicios) ? alojamiento.servicios : [],
    ],
  },
}
