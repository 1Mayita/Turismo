import { useState } from 'react'

const VALORES = [1, 2, 3, 4, 5]

// Muestra de 1 a 5 estrellas llenas según el valor (solo lectura).
export function Estrellas({ valor, className = 'text-base' }) {
  const redondeado = Math.round(valor)
  return (
    <span className={`inline-flex ${className}`} aria-label={`${valor} de 5 estrellas`}>
      {VALORES.map((numero) => (
        <span key={numero} aria-hidden="true" className={numero <= redondeado ? 'text-atardecer' : 'text-piedra/40'}>★</span>
      ))}
    </span>
  )
}

// 5 estrellas clicables para elegir una calificación.
export function SelectorEstrellas({ valor, onCambiar }) {
  const [resaltado, setResaltado] = useState(0)
  const mostrado = resaltado || valor

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Calificación" onMouseLeave={() => setResaltado(0)}>
      {VALORES.map((numero) => (
        <button
          key={numero}
          type="button"
          role="radio"
          aria-checked={valor === numero}
          aria-label={`${numero} ${numero === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onCambiar(numero)}
          onMouseEnter={() => setResaltado(numero)}
          className={`text-3xl leading-none transition hover:scale-110 ${numero <= mostrado ? 'text-atardecer' : 'text-piedra/40'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// Texto corto tipo "★ 4.3 (12 reseñas)".
// "compacto" muestra solo "★ 4.3" (o "Nuevo" si aún no tiene reseñas).
export function ResumenCalificacion({ promedio = 0, total = 0, compacto = false, className = '' }) {
  if (compacto) {
    return total ? (
      <span className={`inline-flex items-center gap-1 text-sm font-bold text-noche ${className}`} aria-label={`${promedio.toFixed(1)} de 5, ${total} ${total === 1 ? 'reseña' : 'reseñas'}`}>
        <span className="text-atardecer" aria-hidden="true">★</span>
        {promedio.toFixed(1)}
      </span>
    ) : (
      <span className={`rounded-full bg-sal-2 px-2 py-0.5 text-xs font-bold text-piedra-texto ${className}`}>Nuevo</span>
    )
  }

  if (!total) return <span className={`text-sm text-piedra-texto ${className}`}>Sin reseñas todavía</span>
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold text-noche/80 ${className}`}>
      <span className="text-atardecer" aria-hidden="true">★</span>
      {promedio.toFixed(1)}
      <span className="font-normal text-piedra-texto">({total} {total === 1 ? 'reseña' : 'reseñas'})</span>
    </span>
  )
}
