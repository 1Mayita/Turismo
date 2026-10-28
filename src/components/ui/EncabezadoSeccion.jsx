// Encabezado de sección del sitio público: rótulo pequeño en cobre y título
// grande en Newsreader (DESIGN.md §3.3). "accion" va a la derecha en
// escritorio y debajo en celular (ej. un enlace "Ver todos").
function EncabezadoSeccion({ antetitulo, titulo, descripcion, id, accion, className = '' }) {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="min-w-0">
        {antetitulo && <p className="rotulo mb-3">{antetitulo}</p>}
        <h2 id={id} className="titulo-display text-[32px] sm:text-[42px]">{titulo}</h2>
        {descripcion && <p className="texto-lectura mt-3 text-base text-piedra-texto sm:text-[17px]">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}

export default EncabezadoSeccion
