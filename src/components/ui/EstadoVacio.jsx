import { Compass } from 'lucide-react'

// Estado vacío amable: icono simple, título, una frase y (si hay) una acción.
// Ej.: <EstadoVacio icono={Heart} titulo="Aún no guardaste destinos"
//        mensaje="Explora y toca el ♥" accion={<Boton a="/destinos">Explorar</Boton>} />
function EstadoVacio({ icono: Icono = Compass, titulo, mensaje, accion, className = '' }) {
  return (
    <div className={`flex animate-entrar flex-col items-center rounded-tarjeta border border-dashed border-borde bg-white/60 px-6 py-14 text-center ${className}`}>
      <span className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true">
        <span className="absolute inset-0 rounded-full ring-8 ring-cielo/40" />
        <Icono size={26} />
      </span>
      {titulo && <h3 className="font-ui text-lg font-bold tracking-tight text-noche">{titulo}</h3>}
      {mensaje && <p className="texto-lectura mt-1.5 font-ui text-base text-piedra-texto">{mensaje}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  )
}

export default EstadoVacio
