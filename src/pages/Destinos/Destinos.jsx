import { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { crearDestinosDeEjemplo, destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'
import { categoriasDeEjemplo, crearCategoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'

function Destinos() {
  const [destinos, setDestinos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDestinos() {
      try {
        const destinosFirestore = await getDestinos()
        if (destinosFirestore.length > 0) {
          setDestinos(destinosFirestore)
          return
        }

        try {
          await crearDestinosDeEjemplo()
          setDestinos(await getDestinos())
        } catch (errorSembrado) {
          console.error('Error al sembrar destinos de ejemplo:', errorSembrado)
          setDestinos(destinosDeEjemplo)
          setError('Mostrando destinos de ejemplo. Configura las reglas de escritura de Firestore para guardarlos.')
        }
      } catch (errorLectura) {
        console.error('Error al consultar destinos en Firestore:', errorLectura)
        setDestinos(destinosDeEjemplo)
        setError('No se pudo consultar Firestore. Mostramos destinos de ejemplo para la demo.')
      } finally {
        setCargando(false)
      }
    }

    async function cargarCategorias() {
      try {
        const categoriasFirestore = await getCategorias()
        if (categoriasFirestore.length > 0) {
          setCategorias(categoriasFirestore)
          return
        }

        try {
          await crearCategoriasDeEjemplo()
          setCategorias(await getCategorias())
        } catch (errorSembrado) {
          console.error('Error al sembrar categorías de ejemplo:', errorSembrado)
          setCategorias(categoriasDeEjemplo)
        }
      } catch (errorLectura) {
        console.error('Error al consultar categorías en Firestore:', errorLectura)
        setCategorias(categoriasDeEjemplo)
      }
    }

    cargarDestinos()
    cargarCategorias()
  }, [])

  const destinosFiltrados = useMemo(() => {
    if (categoriaActiva === 'Todas') return destinos
    return destinos.filter((destino) => destino.categoria === categoriaActiva)
  }, [destinos, categoriaActiva])

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Catálogo de experiencias</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Encuentra tu próximo paisaje</h1>
          <p className="mt-4 text-lg text-slate-600">Desde el altiplano hasta la Amazonía, Bolivia te espera.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoriaActiva('Todas')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              categoriaActiva === 'Todas' ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
            }`}
          >
            Todas
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id || categoria.nombre}
              type="button"
              onClick={() => setCategoriaActiva(categoria.nombre)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoriaActiva === categoria.nombre ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        {cargando ? (
          <GrillaEsqueleto />
        ) : destinosFiltrados.length === 0 ? (
          <p className="text-slate-600">No hay destinos en esta categoría todavía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
            {destinosFiltrados.map((destino) => (
              <TarjetaDestino key={destino.id || destino.nombre} destino={destino} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Destinos
