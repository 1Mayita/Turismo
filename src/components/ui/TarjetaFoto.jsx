import ImagenSegura from '../ImagenSegura.jsx'

// Foto de fondo de las tarjetas "a foto completa" (el estilo de departamentos):
// la foto ocupa toda la tarjeta y el texto va en blanco sobre un velo oscuro.
// Las clases de la tarjeta están en estilos.js (claseTarjetaFoto...).
// Va como primer hijo de la tarjeta.
function FondoTarjetaFoto({ src, alt = '' }) {
  return (
    <>
      <ImagenSegura
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="zoom-foto absolute inset-0 h-full w-full object-cover"
      />
      {/* Velo oscuro abajo para que el texto se lea sobre cualquier foto. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-noche/95 via-noche/45 to-transparent" />
    </>
  )
}

export default FondoTarjetaFoto
