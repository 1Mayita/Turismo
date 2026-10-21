// Marca de "Rutas de Bolivia": la hoja de siempre, ahora en color atardecer,
// y el nombre. "claro" es para fondos oscuros (footer).
function Logo({ claro = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-ui text-[19px] font-extrabold tracking-tight ${claro ? 'text-admin-texto' : 'text-noche'} ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-atardecer/15" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-atardecer">
          <path d="M4 20c8 0 15-6 16-16-9 0-15 7-16 16Z" fill="currentColor" />
          <path d="M6 18c4-4 8-8 13-13" stroke={claro ? '#0e2233' : '#fafaf7'} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>
      Rutas de Bolivia
    </span>
  )
}

export default Logo
