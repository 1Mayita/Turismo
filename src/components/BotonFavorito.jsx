import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { useFavoritos } from '../context/useFavoritos.js'

function IconoCorazon({ relleno }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
        fill={relleno ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Corazón para marcar/desmarcar un elemento como favorito. A quien no inició
// sesión lo lleva al login y, al entrar, lo devuelve a la página donde estaba.
function BotonFavorito({ idDestino, idElemento = idDestino, tipo = 'destino', className = '' }) {
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

  return (
    <div className={className}>
      <button
        type="button"
        onClick={alternar}
        disabled={guardando}
        aria-pressed={activo}
        aria-label={`${activo ? 'Quitar de' : 'Agregar a'} favoritos`}
        title={`${activo ? 'Quitar de' : 'Agregar a'} favoritos`}
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition hover:scale-110 active:scale-95 disabled:opacity-60 ${
          activo ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
        }`}
      >
        <IconoCorazon relleno={activo} />
      </button>
      {error && <p className="mt-1 max-w-40 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  )
}

export default BotonFavorito
