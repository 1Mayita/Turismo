// Placeholder animado mientras se cargan destinos/departamentos desde Firestore,
// para que la espera se perciba más corta que un simple "Cargando...".
function EsqueletoTarjeta() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-lg shadow-brand-950/5">
      <div className="h-56 w-full bg-brand-100" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-brand-100" />
        <div className="h-5 w-2/3 rounded bg-brand-100" />
        <div className="h-3 w-1/2 rounded bg-brand-100" />
      </div>
    </div>
  )
}

export function GrillaEsqueleto({ cantidad = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, indice) => (
        <EsqueletoTarjeta key={indice} />
      ))}
    </div>
  )
}

export default EsqueletoTarjeta
