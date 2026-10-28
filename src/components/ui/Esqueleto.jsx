// Bloques de carga (en vez de spinners). Se apagan solos con "reducir movimiento".
function Esqueleto({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-sal-2 ${className}`} />
}

// Forma de una tarjeta con imagen mientras llegan los datos.
export function EsqueletoTarjetaBase({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex h-[28rem] animate-pulse flex-col justify-end space-y-3 rounded-tarjeta bg-sal-2 p-5 ${className}`}>
      <div className="h-7 w-2/3 rounded-control bg-white/70" />
      <div className="h-4 w-1/2 rounded-control bg-white/70" />
      <div className="h-10 w-28 rounded-control bg-white/70" />
    </div>
  )
}

export default Esqueleto
