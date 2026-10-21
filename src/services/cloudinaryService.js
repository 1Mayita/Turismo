const CLOUD_NAME = 'dlh6pnnd9'
const UPLOAD_PRESET = 'mediaFiles'
const TAMANO_MAXIMO = 10 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function subirImagenCloudinary(archivo) {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error('Elige una imagen JPG, PNG, WEBP o GIF.')
  }
  if (archivo.size > TAMANO_MAXIMO) {
    throw new Error('La imagen no puede superar los 10 MB.')
  }

  const datos = new FormData()
  datos.append('file', archivo)
  datos.append('upload_preset', UPLOAD_PRESET)

  const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: datos,
  })
  const resultado = await respuesta.json()
  if (!respuesta.ok) {
    throw new Error(resultado.error?.message || 'Cloudinary no pudo subir la imagen.')
  }
  if (!resultado.secure_url) {
    throw new Error('Cloudinary no devolvió la dirección segura de la imagen.')
  }
  return resultado.secure_url
}
