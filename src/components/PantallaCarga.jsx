import Logo from './Logo.jsx'

// Pantalla completa mientras se comprueba la sesión o se descarga una página.
function PantallaCarga() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-sal" role="status" aria-live="polite">
      <Logo className="animate-entrar" />
      <div className="h-1 w-28 overflow-hidden rounded-full bg-sal-2" aria-hidden="true">
        <div className="h-full w-1/2 animate-[cargando_1.1s_ease-in-out_infinite] rounded-full bg-atardecer" />
      </div>
      <p className="text-sm text-piedra-texto">Cargando...</p>
    </div>
  )
}

export default PantallaCarga
