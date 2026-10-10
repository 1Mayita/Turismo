// Placeholder animado mientras se cargan destinos/departamentos desde Firestore,
// para que la espera se perciba más corta que un simple "Cargando...".
function EsqueletoTarjeta() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl cristal">
      <div className="aspect-[4/3] w-full bg-white/70" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-white/70" />
        <div className="h-3 w-1/2 rounded bg-white/70" />
        <div className="h-3 w-full rounded bg-white/70" />
      </div>
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
