import AdminEstablecimientos from './AdminEstablecimientos.jsx'
import { CAMPO_DESCRIPCION, CAMPOS_COMUNES, aTexto, lineas, menuATexto, serializarComunes, textoAMenu } from './camposEstablecimiento.js'
import { actualizarRestaurante, crearRestaurante, eliminarRestaurante, getRestaurantes } from '../../services/restaurantesService.js'

const configuracion = {
  singular: 'Restaurante',
  plural: 'Restaurantes',
  rutaPublica: '/restaurantes',
  listar: getRestaurantes,
  crear: crearRestaurante,
  actualizar: actualizarRestaurante,
  eliminar: eliminarRestaurante,
  campos: [
    { nombre: 'especialidad', etiqueta: 'Especialidad gastronómica', tipo: 'text', placeholder: 'Ej.: comida tradicional boliviana' },
    { nombre: 'horario', etiqueta: 'Días y horarios de atención', tipo: 'text', placeholder: 'Ej.: lunes a sábado, 11:00 a 22:00' },
    CAMPO_DESCRIPCION,
    { nombre: 'menu', etiqueta: 'Menú (un plato por línea: Nombre | precio en Bs)', tipo: 'textarea', placeholder: 'Silpancho | 35\nPique macho | 60', aFormulario: (restaurante) => menuATexto(restaurante.menu) },
    { nombre: 'platos_tipicos', etiqueta: 'Platos típicos destacados (uno por línea)', tipo: 'textarea', placeholder: 'Silpancho\nPique macho', aFormulario: (restaurante) => aTexto(restaurante.platos_tipicos) },
    ...CAMPOS_COMUNES,
  ],
  serializar: (formulario) => {
    const menu = textoAMenu(formulario.menu)
    const platos = lineas(formulario.platos_tipicos)
    return {
      ...serializarComunes(formulario),
      especialidad: formulario.especialidad.trim(),
      horario: formulario.horario.trim(),
      menu,
      // Si no se indican platos destacados, se toman los del menú: así el
      // restaurante aparece en "Dónde probarlo" de cada plato típico.
      platos_tipicos: platos.length > 0 ? platos : menu.map((plato) => plato.nombre),
    }
  },
  columnas: [
    { titulo: 'Especialidad', mostrar: (restaurante) => restaurante.especialidad || '—' },
    { titulo: 'Horario', mostrar: (restaurante) => restaurante.horario || '—' },
    { titulo: 'Teléfono', mostrar: (restaurante) => restaurante.telefono || '—' },
  ],
}

function AdminRestaurantes() {
  return <AdminEstablecimientos configuracion={configuracion} />
}

export default AdminRestaurantes
