// Datos iniciales del catálogo. Cada registro lleva un "id" fijo que se usa
// como ID del documento en Firestore, así las relaciones (id_departamento,
// id_municipio, id_region) quedan enlazadas desde el primer sembrado.

// Fecha "AAAA-MM-DD" a tantos días de hoy (negativo = en el pasado). Los
// eventos de ejemplo se calculan al sembrar para que siempre haya próximos.
function fechaRelativa(dias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export const categoriasDeEjemplo = [
  { id: 'naturaleza', nombre: 'Naturaleza', descripcion: 'Paisajes, parques y reservas naturales.' },
  { id: 'cultura', nombre: 'Cultura', descripcion: 'Museos, tradiciones y patrimonio cultural.' },
  { id: 'aventura', nombre: 'Aventura', descripcion: 'Trekking, expediciones y deportes extremos.' },
  { id: 'gastronomia', nombre: 'Gastronomía', descripcion: 'Comida típica y experiencias culinarias.' },
  { id: 'historia', nombre: 'Historia', descripcion: 'Sitios y monumentos históricos.' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', descripcion: 'Actividades recreativas y de esparcimiento.' },
  { id: 'religioso', nombre: 'Religioso', descripcion: 'Templos, santuarios y turismo de fe.' },
]

export const departamentosDeEjemplo = [
  { id: 'la-paz', nombre: 'La Paz', descripcion: 'Sede de gobierno, cuna del Valle de la Luna y puerta de entrada al altiplano.' },
  { id: 'cochabamba', nombre: 'Cochabamba', descripcion: 'El "jardín de Bolivia", famosa por su gastronomía y el Cristo de la Concordia.' },
  { id: 'santa-cruz', nombre: 'Santa Cruz', descripcion: 'Motor económico del país, con tierras bajas tropicales y las Misiones Jesuíticas.' },
  { id: 'oruro', nombre: 'Oruro', descripcion: 'Hogar del carnaval declarado Patrimonio de la Humanidad y del Salar de Coipasa.' },
  { id: 'potosi', nombre: 'Potosí', descripcion: 'Ciudad minera histórica y hogar del imponente Salar de Uyuni.' },
  { id: 'chuquisaca', nombre: 'Chuquisaca', descripcion: 'Capital constitucional de Bolivia, con arquitectura colonial en Sucre.' },
  { id: 'tarija', nombre: 'Tarija', descripcion: 'Valles vitivinícolas y tradición chapaca en el sur del país.' },
  { id: 'beni', nombre: 'Beni', descripcion: 'Llanos y humedales amazónicos, ideales para el ecoturismo.' },
  { id: 'pando', nombre: 'Pando', descripcion: 'El departamento más joven, cubierto por selva amazónica virgen.' },
]

export const municipiosDeEjemplo = [
  { id: 'la-paz-la-paz', id_departamento: 'la-paz', nombre: 'La Paz', descripcion: 'Sede de gobierno, entre montañas y el Illimani.' },
  { id: 'la-paz-copacabana', id_departamento: 'la-paz', nombre: 'Copacabana', descripcion: 'A orillas del lago Titicaca, puerta a la Isla del Sol.' },
  { id: 'la-paz-san-buenaventura', id_departamento: 'la-paz', nombre: 'San Buenaventura', descripcion: 'Entrada al Parque Nacional Madidi.' },

  { id: 'cochabamba-cercado', id_departamento: 'cochabamba', nombre: 'Cochabamba', descripcion: 'Capital del departamento y centro gastronómico del país.' },
  { id: 'cochabamba-quillacollo', id_departamento: 'cochabamba', nombre: 'Quillacollo', descripcion: 'Famoso por la festividad de la Virgen de Urkupiña.' },
  { id: 'cochabamba-villa-tunari', id_departamento: 'cochabamba', nombre: 'Villa Tunari', descripcion: 'Trópico cochabambino, ríos y selva.' },

  { id: 'santa-cruz-santa-cruz', id_departamento: 'santa-cruz', nombre: 'Santa Cruz de la Sierra', descripcion: 'La ciudad más poblada de Bolivia.' },
  { id: 'santa-cruz-samaipata', id_departamento: 'santa-cruz', nombre: 'Samaipata', descripcion: 'Pueblo de valle con el Fuerte de Samaipata.' },
  { id: 'santa-cruz-san-jose', id_departamento: 'santa-cruz', nombre: 'San José de Chiquitos', descripcion: 'Parte del circuito de Misiones Jesuíticas.' },

  { id: 'oruro-oruro', id_departamento: 'oruro', nombre: 'Oruro', descripcion: 'Capital del folklore boliviano.' },
  { id: 'oruro-curahuara', id_departamento: 'oruro', nombre: 'Curahuara de Carangas', descripcion: 'Puerta al Parque Nacional Sajama.' },

  { id: 'potosi-potosi', id_departamento: 'potosi', nombre: 'Potosí', descripcion: 'Ciudad colonial al pie del Cerro Rico.' },
  { id: 'potosi-uyuni', id_departamento: 'potosi', nombre: 'Uyuni', descripcion: 'Punto de partida para recorrer el Salar de Uyuni.' },
  { id: 'potosi-san-pablo-lipez', id_departamento: 'potosi', nombre: 'San Pablo de Lípez', descripcion: 'Altiplano sur, lagunas de colores y volcanes.' },

  { id: 'chuquisaca-sucre', id_departamento: 'chuquisaca', nombre: 'Sucre', descripcion: 'Capital constitucional, la "ciudad blanca".' },
  { id: 'chuquisaca-tarabuco', id_departamento: 'chuquisaca', nombre: 'Tarabuco', descripcion: 'Conocido por su feria dominical y el Pujllay.' },

  { id: 'tarija-cercado', id_departamento: 'tarija', nombre: 'Tarija', descripcion: 'Capital chapaca, clima templado y tradición.' },
  { id: 'tarija-uriondo', id_departamento: 'tarija', nombre: 'Uriondo', descripcion: 'Corazón de la ruta del vino y singani.' },

  { id: 'beni-trinidad', id_departamento: 'beni', nombre: 'Trinidad', descripcion: 'Capital beniana en los llanos de Moxos.' },
  { id: 'beni-rurrenabaque', id_departamento: 'beni', nombre: 'Rurrenabaque', descripcion: 'Base para excursiones a pampas y selva.' },

  { id: 'pando-cobija', id_departamento: 'pando', nombre: 'Cobija', descripcion: 'Capital de Pando, frontera con Brasil.' },
  { id: 'pando-porvenir', id_departamento: 'pando', nombre: 'Porvenir', descripcion: 'Municipio amazónico cercano a Cobija.' },
]

export const regionesDeEjemplo = [
  { id: 'la-paz-zona-sur', id_municipio: 'la-paz-la-paz', nombre: 'Zona Sur', descripcion: 'Mallasa, Valle de la Luna y miradores.' },
  { id: 'la-paz-centro', id_municipio: 'la-paz-la-paz', nombre: 'Centro Histórico', descripcion: 'Plaza Murillo, calle Jaén y museos.' },
  { id: 'copacabana-isla-del-sol', id_municipio: 'la-paz-copacabana', nombre: 'Isla del Sol', descripcion: 'Isla sagrada del lago Titicaca.' },
  { id: 'san-buenaventura-madidi', id_municipio: 'la-paz-san-buenaventura', nombre: 'Área Madidi', descripcion: 'Selva y ríos del Parque Nacional Madidi.' },
  { id: 'cochabamba-cerro-san-pedro', id_municipio: 'cochabamba-cercado', nombre: 'Cerro San Pedro', descripcion: 'Mirador del Cristo de la Concordia.' },
  { id: 'samaipata-fuerte', id_municipio: 'santa-cruz-samaipata', nombre: 'Fuerte de Samaipata', descripcion: 'Sitio arqueológico Patrimonio de la Humanidad.' },
  { id: 'uyuni-colchani', id_municipio: 'potosi-uyuni', nombre: 'Colchani', descripcion: 'Entrada al salar y pueblo de extracción de sal.' },
  { id: 'lipez-reserva-avaroa', id_municipio: 'potosi-san-pablo-lipez', nombre: 'Reserva Eduardo Avaroa', descripcion: 'Lagunas altoandinas, géiseres y flamencos.' },
  { id: 'sucre-centro', id_municipio: 'chuquisaca-sucre', nombre: 'Centro Histórico', descripcion: 'Casco colonial Patrimonio de la Humanidad.' },
  { id: 'uriondo-valle-concepcion', id_municipio: 'tarija-uriondo', nombre: 'Valle de la Concepción', descripcion: 'Viñedos y bodegas tradicionales.' },
  { id: 'rurrenabaque-pampas', id_municipio: 'beni-rurrenabaque', nombre: 'Pampas del Yacuma', descripcion: 'Humedales con fauna silvestre.' },
]

export const destinosDeEjemplo = [
  {
    id: 'salar-de-uyuni',
    nombre: 'Salar de Uyuni',
    descripcion: 'El desierto de sal mas grande del mundo, con horizontes blancos y atardeceres inolvidables.',
    categoria: 'Naturaleza',
    id_departamento: 'potosi',
    id_municipio: 'potosi-uyuni',
    id_region: 'uyuni-colchani',
    ubicacion: 'Uyuni, Potosí',
    imagen_principal: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518552718964-3aa8f0490e83?auto=format&fit=crop&w=900&q=80',
    ],
    direccion: 'Salar de Uyuni, Provincia Daniel Campos',
    latitud: -20.1338,
    longitud: -67.4891,
    horario: 'Todos los días, 06:00 - 18:00',
    precio_ingreso: 30,
    recomendaciones: 'Lleva protector solar, lentes oscuros y agua. En época de lluvias (dic-abr) se forma el efecto espejo.',
    destacado: true,
  },
  {
    id: 'laguna-colorada',
    nombre: 'Laguna Colorada',
    descripcion: 'Una laguna de tonos rojizos rodeada de volcanes y flamencos en la Reserva Eduardo Avaroa.',
    categoria: 'Aventura',
    id_departamento: 'potosi',
    id_municipio: 'potosi-san-pablo-lipez',
    id_region: 'lipez-reserva-avaroa',
    ubicacion: 'San Pablo de Lípez, Potosí',
    imagen_principal: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=900&q=80',
    ],
    direccion: 'Reserva Nacional de Fauna Andina Eduardo Avaroa',
    latitud: -22.2044,
    longitud: -67.7808,
    horario: 'Todos los días, 07:00 - 17:00',
    precio_ingreso: 150,
    recomendaciones: 'La altura supera los 4300 msnm, considera aclimatarte antes de subir. Abrígate bien, las noches son muy frías.',
    destacado: true,
  },
  {
    id: 'valle-de-la-luna',
    nombre: 'Valle de la Luna',
    descripcion: 'Formaciones de arcilla esculpidas por el viento a pocos minutos del centro de La Paz.',
    categoria: 'Naturaleza',
    id_departamento: 'la-paz',
    id_municipio: 'la-paz-la-paz',
    id_region: 'la-paz-zona-sur',
    ubicacion: 'La Paz, La Paz',
    imagen_principal: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80',
    ],
    direccion: 'Zona Mallasa, ciudad de La Paz',
    latitud: -16.5547,
    longitud: -68.1856,
    horario: 'Todos los días, 09:00 - 18:30',
    precio_ingreso: 15,
    recomendaciones: 'Usa calzado con buen agarre, el sendero tiene subidas y bajadas sobre terreno irregular.',
    destacado: true,
  },
  {
    id: 'cristo-de-la-concordia',
    nombre: 'Cristo de la Concordia',
    descripcion: 'Un mirador monumental con una vista panoramica de la ciudad de Cochabamba.',
    categoria: 'Religioso',
    id_departamento: 'cochabamba',
    id_municipio: 'cochabamba-cercado',
    id_region: 'cochabamba-cerro-san-pedro',
    ubicacion: 'Cochabamba, Cochabamba',
    imagen_principal: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1591825381179-93b9d5fbfe3f?auto=format&fit=crop&w=900&q=80',
    ],
    direccion: 'Cerro de San Pedro, ciudad de Cochabamba',
    latitud: -17.4013,
    longitud: -66.1489,
    horario: 'Todos los días, 08:00 - 18:00',
    precio_ingreso: 10,
    recomendaciones: 'Puedes subir en teleférico o por las escalinatas. Sube temprano para evitar filas los fines de semana.',
    destacado: true,
  },
  {
    id: 'parque-nacional-madidi',
    nombre: 'Parque Nacional Madidi',
    descripcion: 'Selva amazonica de enorme biodiversidad, rios intensos y experiencias de ecoturismo.',
    categoria: 'Naturaleza',
    id_departamento: 'la-paz',
    id_municipio: 'la-paz-san-buenaventura',
    id_region: 'san-buenaventura-madidi',
    ubicacion: 'San Buenaventura, La Paz',
    imagen_principal: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    ],
    direccion: 'Parque Nacional y Área Natural de Manejo Integrado Madidi',
    latitud: -14.0,
    longitud: -68.4,
    horario: 'Todos los días, 07:00 - 17:00',
    precio_ingreso: 100,
    recomendaciones: 'Contrata un guía local autorizado. Lleva ropa de manga larga y repelente para mosquitos.',
    destacado: false,
  },
]

export const actividadesDeEjemplo = [
  { id: 'uyuni-tour-4x4', id_destino: 'salar-de-uyuni', nombre: 'Tour en 4x4 por el salar', descripcion: 'Recorrido de día completo por el salar, el cementerio de trenes y Colchani.' },
  { id: 'uyuni-fotografia', id_destino: 'salar-de-uyuni', nombre: 'Fotografía de perspectiva', descripcion: 'Sesión guiada de fotos con efectos de perspectiva sobre la sal.' },
  { id: 'uyuni-incahuasi', id_destino: 'salar-de-uyuni', nombre: 'Trekking en la Isla Incahuasi', descripcion: 'Caminata corta entre cactus gigantes con vista 360° del salar.' },
  { id: 'colorada-flamencos', id_destino: 'laguna-colorada', nombre: 'Avistamiento de flamencos', descripcion: 'Observación de las tres especies de flamencos andinos en la laguna.' },
  { id: 'colorada-geiseres', id_destino: 'laguna-colorada', nombre: 'Visita a los géiseres Sol de Mañana', descripcion: 'Salida al amanecer para ver las fumarolas en plena actividad.' },
  { id: 'luna-sendero', id_destino: 'valle-de-la-luna', nombre: 'Recorrido por el sendero corto', descripcion: 'Circuito de 15 minutos apto para toda la familia.' },
  { id: 'luna-mirador', id_destino: 'valle-de-la-luna', nombre: 'Circuito largo y mirador del Diablo', descripcion: 'Caminata de 45 minutos hasta el mirador más alto del valle.' },
]

// Las fechas se guardan como texto "AAAA-MM-DD": se ordenan bien como texto
// y encajan directo con <input type="date">.
export const eventosDeEjemplo = [
  {
    id: 'feria-gastronomica-cochabamba',
    nombre: 'Feria Gastronómica de Cochabamba',
    descripcion: 'Platos típicos del valle: silpancho, pique macho, chicha y repostería tradicional.',
    fecha_inicio: fechaRelativa(-1),
    fecha_fin: fechaRelativa(2),
    ubicacion: 'Plaza 14 de Septiembre, Cochabamba',
    id_departamento: 'cochabamba',
  },
  {
    id: 'festival-vino-tarija',
    nombre: 'Festival del Vino y el Singani',
    descripcion: 'Catas, música chapaca y visitas guiadas a bodegas del Valle de la Concepción.',
    fecha_inicio: fechaRelativa(6),
    fecha_fin: fechaRelativa(8),
    ubicacion: 'Valle de la Concepción, Uriondo',
    id_departamento: 'tarija',
  },
  {
    id: 'encuentro-danzas-oruro',
    nombre: 'Encuentro de Danzas Folklóricas',
    descripcion: 'Fraternidades de diablada, morenada y caporales presentan sus coreografías.',
    fecha_inicio: fechaRelativa(15),
    fecha_fin: fechaRelativa(15),
    ubicacion: 'Avenida Cívica, Oruro',
    id_departamento: 'oruro',
  },
  {
    id: 'festival-musica-chiquitos',
    nombre: 'Festival de Música en las Misiones',
    descripcion: 'Conciertos de música barroca en los templos jesuíticos de la Chiquitania.',
    fecha_inicio: fechaRelativa(28),
    fecha_fin: fechaRelativa(32),
    ubicacion: 'Templo de San José de Chiquitos',
    id_departamento: 'santa-cruz',
  },
]
