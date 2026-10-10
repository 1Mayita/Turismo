import { useState } from 'react'

function IconoLupa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Input de búsqueda reutilizable. Llama a onBuscar(texto) al enviar.
// Para reiniciar el texto desde afuera, cambia su "key".
// tamano="grande" es la versión destacada de la portada, con botón "Buscar".
function BarraBusqueda({ onBuscar, valorInicial = '', placeholder = 'Buscar destinos, actividades y lugares...', tamano = 'normal', className = '' }) {
  const [texto, setTexto] = useState(valorInicial)
  const grande = tamano === 'grande'

  function enviar(evento) {
    evento.preventDefault()
    onBuscar(texto.trim())
  }

  return (
    <form onSubmit={enviar} role="search" className={`relative ${className}`}>
      <span className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-brand-700 ${grande ? 'left-5' : 'left-3.5'}`}>
        <IconoLupa />
      </span>
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full border border-white/80 text-slate-800 backdrop-blur outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 ${
          grande ? 'rounded-2xl bg-white/95 py-4 pl-14 pr-32 text-base shadow-xl' : 'rounded-xl bg-white/75 py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(14,116,144,0.12)]'
        }`}
      />
      {grande && (
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl boton-principal px-5 py-2.5 text-sm font-bold text-white transition">
          Buscar
        </button>
      )}
    </form>
  )
}

export default BarraBusqueda
