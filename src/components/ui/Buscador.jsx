import { useId } from 'react'
import { Search } from 'lucide-react'
import { claseBoton } from './estilos.js'

// Buscador grande y redondeado (DESIGN.md §4). Solo es la parte visual: quien
// lo usa decide qué hacer con el texto (alBuscar recibe lo escrito).
function Buscador({
  valor,
  alCambiar,
  alBuscar,
  placeholder = '¿A dónde vamos hoy?',
  etiqueta = 'Buscar destinos, lugares y eventos en Bolivia',
  textoBoton = 'Buscar',
  className = '',
}) {
  const id = useId()

  function enviar(evento) {
    evento.preventDefault()
    alBuscar?.(valor)
  }

  return (
    <form
      role="search"
      onSubmit={enviar}
      className={`flex items-center gap-2 rounded-full border border-borde bg-white p-1.5 pl-5 shadow-suave transition focus-within:border-cielo-600 focus-within:ring-3 focus-within:ring-cielo-600/30 ${className}`}
    >
      <Search aria-hidden="true" className="shrink-0 text-piedra" />
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <input
        id={id}
        type="search"
        value={valor}
        onChange={(evento) => alCambiar?.(evento.target.value)}
        placeholder={placeholder}
        className="min-h-11 min-w-0 flex-1 bg-transparent font-ui text-base text-noche outline-none placeholder:text-piedra-texto"
      />
      <button type="submit" className={claseBoton('primario', 'normal', 'rounded-full px-4 sm:px-6')}>
        {textoBoton}
      </button>
    </form>
  )
}

export default Buscador
