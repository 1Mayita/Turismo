import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import { FavoritosContext } from './favoritosContext.js'
import { agregarFavorito, getFavoritosDeUsuario, quitarFavorito } from '../services/favoritosService.js'

const SIN_FAVORITOS = new Set()

// Carga una sola vez los favoritos del usuario logueado y los comparte con
// todas las tarjetas y el detalle, en vez de consultar Firestore por cada corazón.
export function FavoritosProvider({ children }) {
  const { usuario } = useAuth()
  // Se guarda de qué usuario son los IDs para no mostrar los de una sesión anterior.
  const [favoritos, setFavoritos] = useState({ uid: null, ids: SIN_FAVORITOS })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!usuario) return
    let activo = true
    getFavoritosDeUsuario(usuario.uid)
      .then((lista) => {
        if (!activo) return
        setFavoritos({ uid: usuario.uid, ids: new Set(lista.map((favorito) => favorito.id_destino)) })
        setError('')
      })
      .catch((errorLectura) => {
        console.error('Error al cargar favoritos:', errorLectura)
        if (activo) setError('No se pudieron cargar tus favoritos.')
      })
    return () => {
      activo = false
    }
  }, [usuario])

  const listo = Boolean(usuario) && favoritos.uid === usuario.uid
  const idsFavoritos = listo ? favoritos.ids : SIN_FAVORITOS

  function esFavorito(idDestino) {
    return idsFavoritos.has(idDestino)
  }

  // Actualiza la interfaz al instante y revierte si Firestore falla.
  async function alternarFavorito(idDestino) {
    if (!usuario) throw new Error('Debes iniciar sesión para guardar favoritos.')
    const eraFavorito = idsFavoritos.has(idDestino)

    function aplicar(agregar) {
      setFavoritos((anterior) => {
        const ids = new Set(anterior.uid === usuario.uid ? anterior.ids : [])
        if (agregar) ids.add(idDestino)
        else ids.delete(idDestino)
        return { uid: usuario.uid, ids }
      })
    }

    aplicar(!eraFavorito)
    try {
      if (eraFavorito) await quitarFavorito(usuario.uid, idDestino)
      else await agregarFavorito(usuario.uid, idDestino)
    } catch (errorEscritura) {
      aplicar(eraFavorito)
      throw errorEscritura
    }
  }

  return (
    <FavoritosContext.Provider value={{ idsFavoritos, listo, esFavorito, alternarFavorito, error }}>
      {children}
    </FavoritosContext.Provider>
  )
}
