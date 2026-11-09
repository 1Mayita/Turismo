import { deleteField } from 'firebase/firestore'
import AdminEstablecimientos from './AdminEstablecimientos.jsx'
import CampoPlatosRestaurante from '../../components/CampoPlatosRestaurante.jsx'
import { CAMPO_DESCRIPCION, CAMPOS_COMUNES, menuATexto, serializarComunes, textoAMenu } from './camposEstablecimiento.js'
import { MAXIMO_PLATOS_POR_RESTAURANTE, actualizarRestaurante, crearRestaurante, eliminarRestaurante, getRestaurantes, limpiarIdsDePlatos } from '../../services/restaurantesService.js'

const configuracion = {
  singular: 'Restaurante',
  plural: 'Restaurantes',
  rutaPublica: '/restaurantes',
  listar: getRestaurantes,
  crear: crearRestaurante,
  // Al guardar con la relación por ids se borra la lista antigua de nombres.
  actualizar: (id, datos) => actualizarRestaurante(id, { ...datos, platos_tipicos: deleteField() }),
  eliminar: eliminarRestaurante,
  campos: [
    { nombre: 'especialidad', etiqueta: 'Especialidad gastronómica', tipo: 'text', placeholder: 'Ej.: comida tradicional boliviana' },
    { nombre: 'horario', etiqueta: 'Días y horarios de atención', tipo: 'text', placeholder: 'Ej.: lunes a sábado, 11:00 a 22:00' },
    CAMPO_DESCRIPCION,
    {
      nombre: 'platos_ids',
      tipo: 'personalizado',
      vacio: [],
      aFormulario: (restaurante) => (Array.isArray(restaurante.platos_ids) ? restaurante.platos_ids : []),
      render: ({ valor, onChange, elemento, salirConBorrador }) => (
        <CampoPlatosRestaurante
          valor={valor}
          onChange={onChange}
          restaurante={elemento}
          // Va al registro de platos típicos y, al guardar, vuelve aquí con el plato elegido.
          onRegistrarPlato={(texto) => salirConBorrador(`/admin/platos?nuevo=1&volver=restaurantes${texto ? `&nombre=${encodeURIComponent(texto)}` : ''}`)}
        />
      ),
    },
    { nombre: 'menu', etiqueta: 'Menú con precios (un plato por línea: Nombre | precio en Bs)', tipo: 'textarea', placeholder: 'Silpancho | 35\nPique macho | 60', aFormulario: (restaurante) => menuATexto(restaurante.menu) },
    ...CAMPOS_COMUNES,
  ],
  // Al volver del registro de platos: se agrega el plato nuevo a la selección.
  alRetomar: (formulario, parametros) => {
    const idPlato = parametros.get('plato')
    return idPlato ? { ...formulario, platos_ids: [...new Set([...(formulario.platos_ids || []), idPlato])] } : formulario
  },
  mensajeAlRetomar: (parametros) => (parametros.get('plato')
    ? 'Volviste al restaurante: el plato nuevo ya está seleccionado. Revisa los datos y guarda.'
    : 'Volviste al restaurante que estabas registrando.'),
  validar: (formulario) => {
    if (limpiarIdsDePlatos(formulario.platos_ids).length > MAXIMO_PLATOS_POR_RESTAURANTE) return `Un restaurante puede ofrecer hasta ${MAXIMO_PLATOS_POR_RESTAURANTE} platos típicos.`
    return ''
  },
  serializar: (formulario) => ({
    ...serializarComunes(formulario),
    especialidad: formulario.especialidad.trim(),
    horario: formulario.horario.trim(),
    menu: textoAMenu(formulario.menu),
    platos_ids: limpiarIdsDePlatos(formulario.platos_ids),
  }),
  columnas: [
    { titulo: 'Especialidad', mostrar: (restaurante) => restaurante.especialidad || '—' },
    { titulo: 'Platos típicos', mostrar: (restaurante) => (Array.isArray(restaurante.platos_ids) ? restaurante.platos_ids.length : '—') },
    { titulo: 'Horario', mostrar: (restaurante) => restaurante.horario || '—' },
  ],
}

function AdminRestaurantes() {
  return <AdminEstablecimientos configuracion={configuracion} />
}

export default AdminRestaurantes
