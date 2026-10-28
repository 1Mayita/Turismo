import marca from '../assets/logo.png'
import marcaConBorde from '../assets/logo-borde.png'

// Marca de "Rutas de Bolivia": la rosa de los vientos con la montaña y el
// nombre en la serif de los títulos. "claro" es para fondos oscuros (barra de
// navegación, pie, foto del login): el logo lleva un contorno blanco que sigue
// su forma para que se distinga del fondo.
function Logo({ claro = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${claro ? 'text-white' : 'text-marca'} ${className}`}>
      <img src={claro ? marcaConBorde : marca} alt="" width="44" height="44" className="h-11 w-11 shrink-0" />
      <span className="font-titulo text-[21px] font-semibold leading-none tracking-[-0.02em] sm:text-[22px]">
        Rutas de Bolivia
      </span>
    </span>
  )
}

export default Logo
