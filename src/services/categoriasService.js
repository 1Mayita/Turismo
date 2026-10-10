import { crearServicio } from './coleccion.js'
import { categoriasDeEjemplo, destinosDeEjemplo } from './datosDeEjemplo.js'

export { categoriasDeEjemplo }

const categorias = crearServicio('categorias', categoriasDeEjemplo)
const destinos = crearServicio('destinos', destinosDeEjemplo)

export const getCategorias = categorias.todos
export const crearCategoria = categorias.crear
export const actualizarCategoria = categorias.actualizar
export const eliminarCategoria = categorias.eliminar

// Los destinos guardan el nombre de la categoría en el campo "categoria".
export function getDestinosPorCategoria(nombreCategoria) {
  return destinos.donde({ categoria: nombreCategoria })
}
