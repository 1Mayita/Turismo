import { get, push, ref, remove, update } from 'firebase/database'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

export const destinosDeEjemplo = [
  {
    nombre: 'Salar de Uyuni',
    descripcion: 'El desierto de sal mas grande del mundo, con horizontes blancos y atardeceres inolvidables.',
    categoria: 'Naturaleza',
    imagen_principal: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518552718964-3aa8f0490e83?auto=format&fit=crop&w=900&q=80',
    ],
    ubicacion: 'Potosí',
    direccion: 'Salar de Uyuni, Provincia Daniel Campos',
    latitud: -20.1338,
    longitud: -67.4891,
    horario: 'Todos los días, 06:00 - 18:00',
    precio_entrada: 30,
    recomendaciones: 'Lleva protector solar, lentes oscuros y agua. En época de lluvias (dic-abr) se forma el efecto espejo.',
    destacado: true,
  },
  {
    nombre: 'Laguna Colorada',
    descripcion: 'Una laguna de tonos rojizos rodeada de volcanes y flamencos en la Reserva Eduardo Avaroa.',
    categoria: 'Aventura',
    imagen_principal: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=900&q=80',
    ],
    ubicacion: 'Potosí',
    direccion: 'Reserva Nacional de Fauna Andina Eduardo Avaroa',
    latitud: -22.2044,
    longitud: -67.7808,
    horario: 'Todos los días, 07:00 - 17:00',
    precio_entrada: 150,
    recomendaciones: 'La altura supera los 4300 msnm, considera aclimatarte antes de subir. Abrígate bien, las noches son muy frías.',
    destacado: true,
  },
  {
    nombre: 'Valle de la Luna',
    descripcion: 'Formaciones de arcilla esculpidas por el viento a pocos minutos del centro de La Paz.',
    categoria: 'Naturaleza',
    imagen_principal: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80',
    ],
    ubicacion: 'La Paz',
    direccion: 'Zona Mallasa, ciudad de La Paz',
    latitud: -16.5547,
    longitud: -68.1856,
    horario: 'Todos los días, 09:00 - 18:30',
    precio_entrada: 15,
    recomendaciones: 'Usa calzado con buen agarre, el sendero tiene subidas y bajadas sobre terreno irregular.',
    destacado: true,
  },
  {
    nombre: 'Cristo de la Concordia',
    descripcion: 'Un mirador monumental con una vista panoramica de la ciudad de Cochabamba.',
    categoria: 'Religioso',
    imagen_principal: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1591825381179-93b9d5fbfe3f?auto=format&fit=crop&w=900&q=80',
    ],
    ubicacion: 'Cochabamba',
    direccion: 'Cerro de San Pedro, ciudad de Cochabamba',
    latitud: -17.4013,
    longitud: -66.1489,
    horario: 'Todos los días, 08:00 - 18:00',
    precio_entrada: 10,
    recomendaciones: 'Puedes subir en teleférico o por las escalinatas. Sube temprano para evitar filas los fines de semana.',
    destacado: true,
  },
  {
    nombre: 'Parque Nacional Madidi',
    descripcion: 'Selva amazonica de enorme biodiversidad, rios intensos y experiencias de ecoturismo.',
    categoria: 'Naturaleza',
    imagen_principal: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    ],
    ubicacion: 'La Paz',
    direccion: 'Parque Nacional y Área Natural de Manejo Integrado Madidi',
    latitud: -14.0,
    longitud: -68.4,
    horario: 'Todos los días, 07:00 - 17:00',
    precio_entrada: 100,
    recomendaciones: 'Contrata un guía local autorizado. Lleva ropa de manga larga y repelente para mosquitos.',
    destacado: false,
  },
]

export async function getDestinos() {
  const instantanea = await conLimiteDeTiempo(get(ref(db, 'destinos')))
  const valor = instantanea.val() || {}
  return Object.entries(valor).map(([id, datos]) => ({ id, ...datos }))
}

export async function getDestinoPorId(id) {
  const instantanea = await conLimiteDeTiempo(get(ref(db, `destinos/${id}`)))
  return instantanea.exists() ? { id, ...instantanea.val() } : null
}

// Cachea la promesa de sembrado para que llamadas concurrentes (ej. doble
// efecto de React StrictMode en desarrollo) no dupliquen los documentos.
let sembradoEnProgreso = null

export function crearDestinosDeEjemplo() {
  if (!sembradoEnProgreso) {
    sembradoEnProgreso = conLimiteDeTiempo(
      Promise.all(destinosDeEjemplo.map((destino) => push(ref(db, 'destinos'), destino))),
      15000,
    ).catch((error) => {
      sembradoEnProgreso = null
      throw error
    })
  }
  return sembradoEnProgreso
}

export async function crearDestino(datos) {
  await conLimiteDeTiempo(push(ref(db, 'destinos'), datos))
}

export async function actualizarDestino(id, datos) {
  await conLimiteDeTiempo(update(ref(db, `destinos/${id}`), datos))
}

export async function eliminarDestino(id) {
  await conLimiteDeTiempo(remove(ref(db, `destinos/${id}`)))
}
