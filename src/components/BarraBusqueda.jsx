import { useState } from 'react'
import { Search } from 'lucide-react'

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
      <span className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-piedra ${grande ? 'left-5' : 'left-4'}`}>
        <Search aria-hidden="true" size={grande ? 20 : 18} />
      </span>
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full rounded-full border text-noche outline-none transition placeholder:text-piedra-texto focus:border-cielo-600 focus:ring-3 focus:ring-cielo-600/30 ${
          grande
            ? 'min-h-14 border-borde bg-white py-3 pl-14 pr-32 text-base shadow-elevada'
            : 'min-h-11 border-transparent bg-sal-2 py-2 pl-11 pr-4 text-sm hover:border-borde focus:bg-white'
        }`}
      />
      {grande && (
        <button type="submit" className="absolute right-2 top-1/2 flex min-h-11 -translate-y-1/2 items-center rounded-full boton-principal px-6 text-sm font-bold">
          Buscar
        </button>
      )}
    </form>
  )
}

export default BarraBusqueda
