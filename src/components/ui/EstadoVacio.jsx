import { Compass } from 'lucide-react'

// Estado vacío amable: icono simple, título, una frase y (si hay) una acción.
// Ej.: <EstadoVacio icono={Heart} titulo="Aún no guardaste destinos"
//        mensaje="Explora y toca el ♥" accion={<Boton a="/destinos">Explorar</Boton>} />
function EstadoVacio({ icono: Icono = Compass, titulo, mensaje, accion, className = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-tarjeta border border-dashed border-borde bg-sal-2/60 px-6 py-12 text-center ${className}`}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true">
        <Icono size={26} />
      </span>
      {titulo && <h3 className="font-ui text-lg font-bold text-noche">{titulo}</h3>}
      {mensaje && <p className="texto-lectura mt-1.5 font-ui text-base text-piedra-texto">{mensaje}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  )
}

export default EstadoVacio
