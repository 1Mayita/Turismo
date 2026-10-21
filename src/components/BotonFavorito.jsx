import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { useFavoritos } from '../context/useFavoritos.js'

function IconoCorazon({ relleno }) {
  return <Heart aria-hidden="true" fill={relleno ? 'currentColor' : 'none'} />
}

// Corazón para marcar/desmarcar un elemento como favorito. A quien no inició
// sesión lo lleva al login y, al entrar, lo devuelve a la página donde estaba.
// conTexto: botón con la palabra "Guardar"/"Guardado" (barra de acciones del
// detalle); sin él, solo el corazón redondo que flota sobre las fotos.
function BotonFavorito({ idDestino, idElemento = idDestino, tipo = 'destino', conTexto = false, className = '' }) {
  const { usuario } = useAuth()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const activo = Boolean(usuario) && esFavorito(idElemento, tipo)

  async function alternar() {
    if (!usuario) {
      navegar('/login', { state: { desde: ubicacion.pathname + ubicacion.search, aviso: 'Inicia sesión para guardar tus favoritos.' } })
      return
    }
    setError('')
    setGuardando(true)
    try {
      await alternarFavorito(idElemento, tipo)
    } catch (errorFavorito) {
      console.error('Error al actualizar favorito:', errorFavorito)
      setError('No se pudo actualizar tus favoritos.')
    } finally {
      setGuardando(false)
    }
  }

  if (conTexto) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={alternar}
          disabled={guardando}
          aria-pressed={activo}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border px-4 text-sm font-bold transition duration-150 disabled:opacity-60 ${
            activo ? 'border-atardecer/40 bg-atardecer/10 text-atardecer-700' : 'border-borde bg-white text-noche hover:bg-cielo'
          }`}
        >
          <span className={activo ? 'text-atardecer' : 'text-piedra-texto'}><IconoCorazon relleno={activo} /></span>
          {activo ? 'Guardado' : 'Guardar'}
        </button>
        {error && <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" role="alert">{error}</p>}
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={alternar}
        disabled={guardando}
        aria-pressed={activo}
        aria-label={`${activo ? 'Quitar de' : 'Agregar a'} favoritos`}
        title={`${activo ? 'Quitar de' : 'Agregar a'} favoritos`}
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-suave transition-colors duration-150 disabled:opacity-60 ${
          activo ? 'text-atardecer' : 'text-piedra-texto hover:text-atardecer'
        }`}
      >
        <IconoCorazon relleno={activo} />
      </button>
      {error && <p className="mt-1 max-w-40 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  )
}

export default BotonFavorito
