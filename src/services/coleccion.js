import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase.js'
import { conLimiteDeTiempo } from './tiempoLimite.js'

// Modo demostración: con la variable VITE_SOLO_EJEMPLOS=1 las lecturas del
// catálogo no van a Firestore y devuelven los datos de datosDeEjemplo.js.
// Sirve para mostrar la app sin conexión o antes de cargar la base de datos.
// En PowerShell:  $env:VITE_SOLO_EJEMPLOS=1; npm run dev
export const SOLO_EJEMPLOS = Boolean(import.meta.env?.VITE_SOLO_EJEMPLOS)

function aRegistro(documento) {
  return { id: documento.id, ...documento.data() }
}

// Lecturas y escrituras comunes de una colección del catálogo. Cada servicio
// (destinos, restaurantes, eventos...) arma sus funciones con esto en vez de
// repetir el mismo código de Firestore.
export function crearServicio(nombreColeccion, ejemplos = []) {
  const referencia = () => collection(db, nombreColeccion)

  return {
    async todos() {
      if (SOLO_EJEMPLOS) return ejemplos
      const instantanea = await conLimiteDeTiempo(getDocs(referencia()))
      return instantanea.docs.map(aRegistro)
    },

    async uno(id) {
      if (SOLO_EJEMPLOS) return ejemplos.find((registro) => registro.id === id) || null
      const documento = await conLimiteDeTiempo(getDoc(doc(db, nombreColeccion, id)))
      return documento.exists() ? aRegistro(documento) : null
    },

    // filtros: { campo: valor }. Solo igualdades (Firestore las combina sin
    // pedir índices compuestos); los valores vacíos se ignoran.
    async donde(filtros = {}) {
      const activos = Object.entries(filtros).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined)
      if (SOLO_EJEMPLOS) {
        return ejemplos.filter((registro) => activos.every(([campo, valor]) => registro[campo] === valor))
      }
      const consulta = query(referencia(), ...activos.map(([campo, valor]) => where(campo, '==', valor)))
      const instantanea = await conLimiteDeTiempo(getDocs(consulta))
      return instantanea.docs.map(aRegistro)
    },

    // Devuelve el id del documento creado.
    async crear(datos) {
      const nuevo = await conLimiteDeTiempo(addDoc(referencia(), datos))
      return nuevo.id
    },

    async actualizar(id, datos) {
      await conLimiteDeTiempo(updateDoc(doc(db, nombreColeccion, id), datos))
    },

    async eliminar(id) {
      await conLimiteDeTiempo(deleteDoc(doc(db, nombreColeccion, id)))
    },
  }
}
