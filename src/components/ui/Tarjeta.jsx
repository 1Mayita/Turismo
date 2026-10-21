import ImagenSegura from '../ImagenSegura.jsx'
import { claseTarjeta, claseTarjetaInteractiva } from './estilos.js'

// Tarjeta base: blanca, radio moderado, borde y sombra suaves. Con "interactiva"
// refuerza la sombra al pasar el mouse.
// "como" cambia la etiqueta HTML (article, li, section...).
function Tarjeta({ como: Elemento = 'div', interactiva = false, className = '', children, ...resto }) {
  return (
    <Elemento className={`${claseTarjeta} ${interactiva ? `group ${claseTarjetaInteractiva}` : ''} ${className}`} {...resto}>
      {children}
    </Elemento>
  )
}

// Imagen de tarjeta: proporción 4:3, radio 16px y un zoom suave (1.04) cuando
// la tarjeta que la contiene es "interactiva" y se pasa el mouse. Lo que va
// en "children" flota encima (por ejemplo el corazón de favoritos).
export function ImagenTarjeta({ src, alt, className = '', children }) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-imagen bg-sal-2 ${className}`}>
      <ImagenSegura
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      {children}
    </div>
  )
}

export default Tarjeta
