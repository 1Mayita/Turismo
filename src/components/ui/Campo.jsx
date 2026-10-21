import { useId } from 'react'
import { claseControl, claseEtiqueta } from './estilos.js'

// Campo de formulario con su etiqueta, texto de ayuda y mensaje de error ya
// conectados para lectores de pantalla. "como": 'input' | 'select' | 'textarea'.
// Las opciones de un select van en children. El resto de props (value,
// onChange, required, type...) pasan directo al control.
function Campo({ etiqueta, ayuda, error, como: Control = 'input', id, className = '', claseControlExtra = '', children, ...resto }) {
  const idGenerado = useId()
  const idCampo = id || idGenerado
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined
  const idError = error ? `${idCampo}-error` : undefined
  const describe = [idAyuda, idError].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      {etiqueta && <label htmlFor={idCampo} className={claseEtiqueta}>{etiqueta}</label>}
      <Control
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe}
        className={`${claseControl} ${Control === 'textarea' ? 'min-h-28 resize-y' : ''} ${claseControlExtra}`}
        {...resto}
      >
        {children}
      </Control>
      {ayuda && <p id={idAyuda} className="mt-1.5 font-ui text-sm text-piedra-texto">{ayuda}</p>}
      {error && <p id={idError} role="alert" className="mt-1.5 font-ui text-sm font-bold text-red-700">{error}</p>}
    </div>
  )
}

export default Campo
