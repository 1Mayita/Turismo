import { useState } from 'react'
import { Search } from 'lucide-react'

// Input de búsqueda reutilizable. Llama a onBuscar(texto) al enviar.
// Para reiniciar el texto desde afuera, cambia su "key".
// tamano="grande" es la versión destacada de la portada, con botón "Buscar".
// "oscura": versión compacta para la barra de navegación azul noche.
function BarraBusqueda({ onBuscar, valorInicial = '', placeholder = 'Buscar destinos, actividades y lugares...', tamano = 'normal', oscura = false, className = '' }) {
  const [texto, setTexto] = useState(valorInicial)
  const grande = tamano === 'grande'

  function enviar(evento) {
    evento.preventDefault()
    onBuscar(texto.trim())
  }

  return (
    <form onSubmit={enviar} role="search" className={`group relative ${className}`}>
      <span className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 ${oscura ? 'text-white/60 group-focus-within:text-piedra' : 'text-piedra'} ${grande ? 'left-4 sm:left-5' : 'left-4'}`}>
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
            ? 'min-h-14 border-borde bg-white py-3 pl-12 pr-28 text-base shadow-[0_1px_2px_rgb(14_34_51/0.04),0_8px_24px_rgb(14_34_51/0.06)] hover:border-piedra/50 sm:pl-14 sm:pr-32'
            : oscura
              ? 'min-h-11 border-white/10 bg-white/10 py-2 pl-11 pr-4 text-sm text-white placeholder:text-white/60 hover:border-white/25 focus:bg-white focus:text-noche focus:placeholder:text-piedra-texto'
              : 'min-h-11 border-transparent bg-sal-2 py-2 pl-11 pr-4 text-sm hover:border-borde focus:bg-white'
        }`}
      />
      {grande && (
        <button type="submit" className="absolute right-2 top-1/2 flex min-h-11 -translate-y-1/2 items-center rounded-full boton-principal px-4 text-sm font-bold sm:px-6">
          Buscar
        </button>
      )}
    </form>
  )
}

export default BarraBusqueda
