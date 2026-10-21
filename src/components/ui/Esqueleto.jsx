// Bloques de carga (en vez de spinners). Se apagan solos con "reducir movimiento".
function Esqueleto({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-sal-2 ${className}`} />
}

// Forma de una tarjeta con imagen mientras llegan los datos.
export function EsqueletoTarjetaBase({ className = '' }) {
  return (
    <div aria-hidden="true" className={`rounded-tarjeta border border-borde bg-white p-3 shadow-suave ${className}`}>
      <Esqueleto className="aspect-[4/3] w-full rounded-imagen" />
      <div className="space-y-3 px-2 pb-2 pt-4">
        <Esqueleto className="h-5 w-2/3" />
        <Esqueleto className="h-4 w-1/2" />
        <Esqueleto className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export default Esqueleto
