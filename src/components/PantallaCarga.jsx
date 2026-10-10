// Pantalla completa mientras se comprueba la sesión o se descarga una página.
function PantallaCarga() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" aria-hidden="true" />
      <p className="text-lg font-bold text-slate-900">Rutas de Bolivia</p>
      <p className="text-sm text-slate-600">Cargando...</p>
    </div>
  )
}

export default PantallaCarga
