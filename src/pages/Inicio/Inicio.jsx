import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'

const DEPARTAMENTOS_RAPIDOS = [
  { id: 'cochabamba', nombre: 'Cochabamba' },
  { id: 'la-paz', nombre: 'La Paz' },
  { id: 'potosi', nombre: 'Potosí' },
  { id: 'santa-cruz', nombre: 'Santa Cruz' },
]

function Inicio() {
  const [destinos, setDestinos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [departamentoActivo, setDepartamentoActivo] = useState(DEPARTAMENTOS_RAPIDOS[0])

  useEffect(() => {
    async function cargarDestacados() {
      try {
        const destinosFirestore = await getDestinos()
        setDestinos(destinosFirestore.length > 0 ? destinosFirestore : destinosDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al consultar destinos en Firestore:', errorLectura)
        setDestinos(destinosDeEjemplo)
        setError('No se pudo consultar Firestore. Mostramos destinos de ejemplo.')
      } finally {
        setCargando(false)
      }
    }

    cargarDestacados()
  }, [])

  const destacados = destinos.filter((destino) => destino.destacado)
  const baseDestacados = destacados.length > 0 ? destacados : destinos
  const destacadosDelDepartamento = baseDestacados.filter((destino) => destino.id_departamento === departamentoActivo.id)
  const destacadosAMostrar = (destacadosDelDepartamento.length > 0 ? destacadosDelDepartamento : baseDestacados).slice(0, 6)

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />

      <section
        className="relative overflow-hidden text-white"
        style={{
          backgroundImage:
            'linear-gradient(160deg, rgba(16,58,37,0.88), rgba(10,39,24,0.94)), url(https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?auto=format&fit=crop&w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-400">Sistema de Turismo de Bolivia</p>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight">Descubre Bolivia, de sus salares a su Amazonía</h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Explora destinos, departamentos y categorías turísticas en un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/destinos" className="rounded-full bg-accent-600 px-5 py-3 font-bold shadow-lg shadow-black/20 transition hover:bg-accent-700">
              Explorar destinos
            </Link>
            <Link to="/departamentos" className="rounded-full border border-white/40 px-5 py-3 font-bold backdrop-blur-sm transition hover:bg-white hover:text-brand-900">
              Ver departamentos
            </Link>
            <Link to="/destinos" className="rounded-full border border-white/40 px-5 py-3 font-bold backdrop-blur-sm transition hover:bg-white hover:text-brand-900">
              Ver categorías
            </Link>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-6 text-center sm:text-left">
            <div>
              <p className="text-3xl font-bold text-accent-400">9</p>
              <p className="text-sm text-white/70">Departamentos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent-400">7</p>
              <p className="text-sm text-white/70">Categorías turísticas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent-400">+{destinos.length || 5}</p>
              <p className="text-sm text-white/70">Destinos por descubrir</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Destacados</p>
            <h2 className="text-3xl font-bold text-brand-900">Lo mejor de {departamentoActivo.nombre}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEPARTAMENTOS_RAPIDOS.map((departamento) => (
              <button
                key={departamento.id}
                type="button"
                onClick={() => setDepartamentoActivo(departamento)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  departamentoActivo.id === departamento.id ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-100'
                }`}
              >
                {departamento.nombre}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        {cargando ? (
          <GrillaEsqueleto cantidad={3} />
        ) : destacadosAMostrar.length === 0 ? (
          <p className="text-slate-600">
            Todavía no hay destinos destacados en {departamentoActivo.nombre}.{' '}
            <Link to="/destinos" className="font-semibold text-brand-700 underline">Ver todos los destinos</Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
            {destacadosAMostrar.map((destino) => (
              <TarjetaDestino key={destino.id || destino.nombre} destino={destino} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Inicio
