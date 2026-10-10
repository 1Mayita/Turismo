import { useState } from 'react'

// <img> que no se rompe: si la foto falta o no carga, muestra un recuadro
// con el nombre del lugar en vez del ícono de imagen rota.
// Para reiniciarla al cambiar de foto, cambia su "key".
function ImagenSegura({ src, alt, className = '', ...resto }) {
  const [fallo, setFallo] = useState(false)

  if (!src || fallo) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-sky-500 to-brand-800 p-4 text-center text-sm font-semibold text-white/90 ${className}`}
      >
        {alt}
      </div>
    )
  }

  return <img src={src} alt={alt} onError={() => setFallo(true)} className={className} {...resto} />
}

export default ImagenSegura
