// Placeholder animado mientras se cargan destinos/departamentos desde Firestore,
// para que la espera se perciba más corta que un simple "Cargando...".
function EsqueletoTarjeta() {
  return (
    <div className="flex h-[28rem] animate-pulse flex-col justify-end space-y-3 rounded-tarjeta bg-sal-2 p-5">
      <div className="h-7 w-2/3 rounded bg-white/70" />
      <div className="h-3 w-1/2 rounded bg-white/70" />
      <div className="h-10 w-28 rounded-control bg-white/70" />
    </div>
  )
}

export function GrillaEsqueleto({ cantidad = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, indice) => (
        <EsqueletoTarjeta key={indice} />
      ))}
    </div>
  )
}

export default EsqueletoTarjeta
