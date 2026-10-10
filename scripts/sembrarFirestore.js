// Crea en Firestore las colecciones iniciales del proyecto con datos de ejemplo.
//
//   npm run sembrar                 -> llena solo las colecciones vacías
//   npm run sembrar -- --actualizar -> además reescribe los destinos,
//                                      restaurantes y alojamientos de ejemplo
//                                      (fotos, textos) sin tocar los demás
//
// Con las reglas de seguridad activas solo un administrador puede escribir:
//   ADMIN_EMAIL=correo ADMIN_PASSWORD=clave npm run sembrar
//
// "usuarios" y "usuario_preferencias" no se siembran: se llenan solos cuando
// las personas se registran y editan su perfil.
import process from 'node:process'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../src/services/firebase.js'
import { actualizarDatosDeEjemplo, indexarAdministradoresPorCorreo, sembrarColeccionesVacias } from '../src/services/sembradoService.js'

const emailAdministrador = process.env.ADMIN_EMAIL || 'admin@turismobolivia.bo'
const actualizar = process.argv.includes('--actualizar')

// Las reglas de seguridad reconocen a un administrador buscando un documento
// cuyo ID sea su correo, así que el de ejemplo se guarda con ese ID.
const administradoresDeEjemplo = [
  { id: emailAdministrador, nombre: 'Administrador General', email: emailAdministrador, rol: 'superadmin' },
]

try {
  if (process.env.ADMIN_PASSWORD) {
    await signInWithEmailAndPassword(auth, emailAdministrador, process.env.ADMIN_PASSWORD)
    console.log(`Sesión iniciada como ${emailAdministrador}.`)
  }

  const sembradas = await sembrarColeccionesVacias({ administradores: administradoresDeEjemplo })
  console.log(sembradas.length === 0
    ? 'Ninguna colección estaba vacía.'
    : `Colecciones creadas: ${sembradas.join(', ')}`)

  const copiados = await indexarAdministradoresPorCorreo()
  if (copiados.length > 0) console.log(`Administradores indexados por correo: ${copiados.length}`)

  if (actualizar) {
    const { cargadas, fallidas } = await actualizarDatosDeEjemplo()
    console.log('Datos de ejemplo actualizados:', cargadas)
    if (fallidas.length > 0) console.log('No se pudieron cargar:', fallidas.join(', '))
  }
  process.exit(0)
} catch (error) {
  console.error('No se pudieron sembrar las colecciones:', error.code || '', error.message)
  process.exit(1)
}
