// Descarga una tabla como archivo CSV que Excel abre bien (con BOM UTF-8 para
// las tildes y la ñ). filas: [{ columna: valor }].
export function descargarCSV(nombreArchivo, filas) {
  if (!filas.length) return
  const columnas = Object.keys(filas[0])
  const celda = (valor) => {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const contenido = [columnas.map(celda).join(','), ...filas.map((fila) => columnas.map((columna) => celda(fila[columna])).join(','))].join('\r\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `${nombreArchivo}.csv`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
