// Campos del formulario que comparten restaurantes y alojamientos en el panel
// de administración (fotos, coordenadas para el mapa y redes sociales), y la
// función que los convierte del texto del formulario a lo que se guarda.

function lineas(texto) {
  return String(texto || '').split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean)
}

function aTexto(lista) {
  return Array.isArray(lista) ? lista.join('\n') : ''
}

function aNumeroOVacio(valor) {
  return valor === '' || valor === null || valor === undefined ? null : Number(valor)
}

export const CAMPO_DESCRIPCION = { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', placeholder: 'Qué lo hace especial, ambiente, a quién se lo recomendarías...' }

export const CAMPOS_COMUNES = [
  { nombre: 'imagen_principal', etiqueta: 'Foto principal', tipo: 'image' },
  { nombre: 'imagenes', etiqueta: 'Fotos de la galería', tipo: 'images', aFormulario: (elemento) => aTexto(elemento.imagenes) },
  { nombre: 'latitud', etiqueta: 'Latitud (se llena al marcar en el mapa)', tipo: 'number', step: 'any', placeholder: '-17.3895', aFormulario: (elemento) => elemento.latitud ?? '' },
  { nombre: 'longitud', etiqueta: 'Longitud (se llena al marcar en el mapa)', tipo: 'number', step: 'any', placeholder: '-66.1568', aFormulario: (elemento) => elemento.longitud ?? '' },
  { nombre: 'facebook', etiqueta: 'Facebook (enlace)', tipo: 'url', placeholder: 'https://facebook.com/...' },
  { nombre: 'instagram', etiqueta: 'Instagram (enlace)', tipo: 'url', placeholder: 'https://instagram.com/...' },
  { nombre: 'sitio_web', etiqueta: 'Sitio web', tipo: 'url', placeholder: 'https://...' },
]

export function serializarComunes(formulario) {
  // La foto principal siempre va primera en la galería.
  const principal = formulario.imagen_principal.trim() || lineas(formulario.imagenes)[0] || ''
  const imagenes = [...new Set([principal, ...lineas(formulario.imagenes)].filter(Boolean))]
  return {
    descripcion: formulario.descripcion.trim(),
    imagen_principal: principal,
    imagenes,
    latitud: aNumeroOVacio(formulario.latitud),
    longitud: aNumeroOVacio(formulario.longitud),
    facebook: formulario.facebook.trim(),
    instagram: formulario.instagram.trim(),
    sitio_web: formulario.sitio_web.trim(),
  }
}

// Menú: una línea por plato con el formato "Nombre | precio" (el precio es opcional).
export function menuATexto(menu) {
  return Array.isArray(menu)
    ? menu.map((plato) => (plato.precio !== '' && plato.precio != null ? `${plato.nombre} | ${plato.precio}` : plato.nombre)).join('\n')
    : ''
}

export function textoAMenu(texto) {
  return lineas(texto).map((linea) => {
    const [nombre, precio = ''] = linea.split('|').map((parte) => parte.trim())
    const numero = Number(precio.replace(',', '.'))
    return { nombre, precio: precio !== '' && Number.isFinite(numero) ? numero : '' }
  }).filter((plato) => plato.nombre)
}

export { aTexto, lineas }
