import { useState } from 'react'

function IconoLupa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Input de búsqueda reutilizable. Llama a onBuscar(texto) al enviar.
// Para reiniciar el texto desde afuera, cambia su "key".
function BarraBusqueda({ onBuscar, valorInicial = '', placeholder = 'Buscar destinos, actividades y lugares...', className = '' }) {
  const [texto, setTexto] = useState(valorInicial)

  function enviar(evento) {
    evento.preventDefault()
    onBuscar(texto.trim())
  }

  return (
    <form onSubmit={enviar} role="search" className={`relative ${className}`}>
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-full border border-slate-300 bg-white py-2 pl-4 pr-10 text-sm text-slate-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
      />
      <button type="submit" aria-label="Buscar" className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-800 transition hover:bg-brand-100">
        <IconoLupa />
      </button>
    </form>
  )
}

export default BarraBusqueda
