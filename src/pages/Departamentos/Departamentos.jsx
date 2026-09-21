import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import { crearDepartamentosDeEjemplo, departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'

function Departamentos() {
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDepartamentos() {
      try {
        const departamentosFirestore = await getDepartamentos()
        if (departamentosFirestore.length > 0) {
          setDepartamentos(departamentosFirestore)
          return
        }

        try {
          await crearDepartamentosDeEjemplo()
          setDepartamentos(await getDepartamentos())
        } catch (errorSembrado) {
          console.error('Error al sembrar departamentos de ejemplo:', errorSembrado)
          setDepartamentos(departamentosDeEjemplo)
          setError('Mostrando departamentos de ejemplo. Configura las reglas de escritura de Firestore para guardarlos.')
        }
      } catch (errorLectura) {
        console.error('Error al consultar departamentos en Firestore:', errorLectura)
        setDepartamentos(departamentosDeEjemplo)
        setError('No se pudo consultar Firestore. Mostramos departamentos de ejemplo para la demo.')
      } finally {
        setCargando(false)
      }
    }

    cargarDepartamentos()
  }, [])

  return (
    <div className="min-h-screen bg-brand-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Regiones de Bolivia</p>
          <h1 className="text-5xl font-bold tracking-tight text-brand-900">Explora por departamento</h1>
          <p className="mt-4 text-lg text-slate-600">Cada región de Bolivia tiene experiencias únicas para descubrir.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => (
              <div key={indice} className="h-32 animate-pulse rounded-2xl bg-white shadow-lg shadow-brand-950/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departamentos.map((departamento) => (
              <Link
                key={departamento.id || departamento.nombre}
                to={departamento.id ? `/departamentos/${departamento.id}` : '#'}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-brand-950/10 ring-1 ring-brand-900/5 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 to-accent-500" />
                <h2 className="text-2xl font-bold text-brand-900">{departamento.nombre}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{departamento.descripcion}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition group-hover:gap-2">
                  Ver destinos →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Departamentos
