// Título de una sección dentro de una página de detalle (Newsreader, 30px).
// Para el encabezado grande de las secciones del inicio está EncabezadoSeccion.
function TituloSeccion({ id, children, className = '' }) {
  return <h2 id={id} className={`titulo-display mb-5 text-[28px] sm:text-[30px] ${className}`}>{children}</h2>
}

export default TituloSeccion
