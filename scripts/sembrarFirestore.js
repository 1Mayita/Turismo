// Crea en Firestore las colecciones iniciales del proyecto con datos de ejemplo.
// Uso:  npm run sembrar
// Opcional: ADMIN_EMAIL=correo@dominio.com npm run sembrar
//
// Solo escribe en colecciones vacías, así que se puede ejecutar varias veces
// sin duplicar datos. "usuarios" y "usuario_preferencias" no se siembran:
// se llenan solos cuando las personas se registran y editan su perfil.
import process from 'node:process'
import { sembrarColeccionesVacias } from '../src/services/sembradoService.js'

const emailAdministrador = process.env.ADMIN_EMAIL || 'admin@turismobolivia.bo'

const administradoresDeEjemplo = [
  { id: 'admin-principal', nombre: 'Administrador General', email: emailAdministrador, rol: 'superadmin' },
]

try {
  const sembradas = await sembrarColeccionesVacias({ administradores: administradoresDeEjemplo })
  if (sembradas.length === 0) {
    console.log('Todas las colecciones ya tenían datos; no se escribió nada.')
  } else {
    console.log(`Colecciones creadas: ${sembradas.join(', ')}`)
  }
  process.exit(0)
} catch (error) {
  console.error('No se pudieron sembrar las colecciones:', error.code || '', error.message)
  process.exit(1)
}
