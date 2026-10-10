import AdminEstablecimientos from './AdminEstablecimientos.jsx'
import { CAMPO_DESCRIPCION, CAMPOS_COMUNES, aTexto, lineas, serializarComunes } from './camposEstablecimiento.js'
import { actualizarAlojamiento, crearAlojamiento, eliminarAlojamiento, getAlojamientos } from '../../services/alojamientosService.js'

const configuracion = {
  singular: 'Alojamiento',
  plural: 'Alojamientos',
  rutaPublica: '/alojamientos',
  listar: getAlojamientos,
  crear: crearAlojamiento,
  actualizar: actualizarAlojamiento,
  eliminar: eliminarAlojamiento,
  campos: [
    { nombre: 'tipo', etiqueta: 'Tipo de alojamiento', tipo: 'text', placeholder: 'Hotel, hostal, eco lodge...' },
    { nombre: 'precio_noche', etiqueta: 'Precio referencial por noche (Bs)', tipo: 'number', min: '0', step: '0.01', aFormulario: (alojamiento) => alojamiento.precio_noche == null ? '' : String(alojamiento.precio_noche) },
    { nombre: 'check_in', etiqueta: 'Hora de entrada (check-in)', tipo: 'time' },
    { nombre: 'check_out', etiqueta: 'Hora de salida (check-out)', tipo: 'time' },
    CAMPO_DESCRIPCION,
    { nombre: 'servicios', etiqueta: 'Servicios incluidos (uno por línea)', tipo: 'textarea', placeholder: 'Wifi\nDesayuno incluido\nEstacionamiento', aFormulario: (alojamiento) => aTexto(alojamiento.servicios) },
    ...CAMPOS_COMUNES,
  ],
  serializar: (formulario) => ({
    ...serializarComunes(formulario),
    tipo: formulario.tipo.trim(),
    precio_noche: formulario.precio_noche === '' ? null : Number(formulario.precio_noche),
    check_in: formulario.check_in,
    check_out: formulario.check_out,
    servicios: lineas(formulario.servicios),
  }),
  columnas: [
    { titulo: 'Tipo', mostrar: (alojamiento) => alojamiento.tipo || '—' },
    { titulo: 'Precio/noche', mostrar: (alojamiento) => alojamiento.precio_noche == null ? '—' : `Bs ${Number(alojamiento.precio_noche).toFixed(2)}` },
    { titulo: 'Teléfono', mostrar: (alojamiento) => alojamiento.telefono || '—' },
  ],
}

function AdminAlojamientos() {
  return <AdminEstablecimientos configuracion={configuracion} />
}

export default AdminAlojamientos
