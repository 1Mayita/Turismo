import { useContext } from 'react'
import { FavoritosContext } from './favoritosContext.js'

export function useFavoritos() {
  return useContext(FavoritosContext)
}
