// Dato clave con icono: horario, entrada, dirección...
function DatoClave({ icono: Icono, etiqueta, children, ancho = false }) {
  return (
    <div className={`flex gap-3 rounded-tarjeta border border-borde bg-white p-4 shadow-suave ${ancho ? 'sm:col-span-2' : ''}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true">
        <Icono size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-cobre-texto">{etiqueta}</p>
        <p className="mt-0.5 text-[15px] leading-relaxed text-noche">{children}</p>
      </div>
    </div>
  )
}

export default DatoClave
