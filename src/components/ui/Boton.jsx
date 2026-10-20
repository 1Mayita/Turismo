import { Link } from 'react-router-dom'
import { claseBoton } from './estilos.js'

// Botón base del rediseño. variante: 'primario' | 'secundario' | 'fantasma';
// tamano: 'normal' | 'pequeno'. Con "a" se dibuja como enlace interno de la
// app y con "href" como enlace externo; si no, es un <button>.
// "icono" e "iconoFinal" reciben un icono de Lucide (ej. icono={Heart}).
function Boton({
  variante = 'primario',
  tamano = 'normal',
  a,
  href,
  icono: Icono,
  iconoFinal: IconoFinal,
  type = 'button',
  className = '',
  children,
  ...resto
}) {
  const clase = claseBoton(variante, tamano, className)
  const contenido = (
    <>
      {Icono && <Icono aria-hidden="true" className="shrink-0" />}
      {children}
      {IconoFinal && <IconoFinal aria-hidden="true" className="shrink-0" />}
    </>
  )

  if (a) return <Link to={a} className={clase} {...resto}>{contenido}</Link>
  if (href) return <a href={href} className={clase} {...resto}>{contenido}</a>
  return <button type={type} className={clase} {...resto}>{contenido}</button>
}

export default Boton
