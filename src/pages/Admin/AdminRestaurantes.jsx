import AdminEstablecimientos from './AdminEstablecimientos.jsx'
import { actualizarRestaurante, crearRestaurante, eliminarRestaurante, getRestaurantes } from '../../services/restaurantesService.js'

const configuracion = {
  singular: 'Restaurante',
  plural: 'Restaurantes',
  listar: getRestaurantes,
  crear: crearRestaurante,
  actualizar: actualizarRestaurante,
  eliminar: eliminarRestaurante,
  campos: [
    { nombre: 'especialidad', etiqueta: 'Especialidad gastronómica', tipo: 'text', placeholder: 'Ej.: comida tradicional boliviana' },
    { nombre: 'horario', etiqueta: 'Horario', tipo: 'text', placeholder: 'Ej.: lunes a sábado, 11:00 a 22:00' },
    { nombre: 'platos_tipicos', etiqueta: 'Platos típicos (uno por línea)', tipo: 'textarea', placeholder: 'Silpancho\nPique macho', aFormulario: (restaurante) => Array.isArray(restaurante.platos_tipicos) ? restaurante.platos_tipicos.join('\n') : '' },
  ],
  serializar: (formulario) => ({
    especialidad: formulario.especialidad.trim(),
    horario: formulario.horario.trim(),
    platos_tipicos: formulario.platos_tipicos.split(/\r?\n/).map((plato) => plato.trim()).filter(Boolean),
  }),
  columnas: [
    { titulo: 'Especialidad', mostrar: (restaurante) => restaurante.especialidad || '—' },
    { titulo: 'Horario', mostrar: (restaurante) => restaurante.horario || '—' },
    { titulo: 'Platos típicos', mostrar: (restaurante) => Array.isArray(restaurante.platos_tipicos) ? restaurante.platos_tipicos.join(', ') || '—' : '—' },
  ],
}

function AdminRestaurantes() {
  return <AdminEstablecimientos configuracion={configuracion} />
}

export default AdminRestaurantes
