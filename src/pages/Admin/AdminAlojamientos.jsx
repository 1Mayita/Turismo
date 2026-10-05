import AdminEstablecimientos from './AdminEstablecimientos.jsx'
import { actualizarAlojamiento, crearAlojamiento, eliminarAlojamiento, getAlojamientos } from '../../services/alojamientosService.js'

const configuracion = {
  singular: 'Alojamiento',
  plural: 'Alojamientos',
  listar: getAlojamientos,
  crear: crearAlojamiento,
  actualizar: actualizarAlojamiento,
  eliminar: eliminarAlojamiento,
  campos: [
    { nombre: 'tipo', etiqueta: 'Tipo de alojamiento', tipo: 'text', placeholder: 'Hotel, hostal, hospedaje...' },
    { nombre: 'precio_noche', etiqueta: 'Precio por noche (Bs)', tipo: 'number', min: '0', step: '0.01', aFormulario: (alojamiento) => alojamiento.precio_noche == null ? '' : String(alojamiento.precio_noche) },
  ],
  serializar: (formulario) => ({
    tipo: formulario.tipo.trim(),
    precio_noche: formulario.precio_noche === '' ? null : Number(formulario.precio_noche),
  }),
  columnas: [
    { titulo: 'Tipo', mostrar: (alojamiento) => alojamiento.tipo || '—' },
    { titulo: 'Precio/noche', mostrar: (alojamiento) => alojamiento.precio_noche == null ? '—' : `Bs ${Number(alojamiento.precio_noche).toFixed(2)}` },
  ],
}

function AdminAlojamientos() {
  return <AdminEstablecimientos configuracion={configuracion} />
}

export default AdminAlojamientos
