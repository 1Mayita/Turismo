import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'

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
          await sembrarCatalogoDeEjemplo()
          setDepartamentos(await getDepartamentos())
        } catch (errorSembrado) {
          console.error('Error al sembrar departamentos de ejemplo:', errorSembrado)
          setDepartamentos(departamentosDeEjemplo)
          setError('Estás viendo departamentos de ejemplo: todavía no se cargaron en la base de datos.')
        }
      } catch (errorLectura) {
        console.error('Error al consultar departamentos en Firestore:', errorLectura)
        setDepartamentos(departamentosDeEjemplo)
        setError('No pudimos conectar con el servidor. Estás viendo departamentos de ejemplo.')
      } finally {
        setCargando(false)
      }
    }

    cargarDepartamentos()
  }, [])

  const ordenados = [...departamentos].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Los nueve departamentos</p>
          <h1 className="text-4xl font-bold tracking-tight text-noche sm:text-5xl">Explora por departamento</h1>
          <p className="mt-4 text-lg text-piedra-texto">Del altiplano a la Amazonía: elige un departamento y descubre sus municipios, destinos y sabores.</p>
        </div>

        {error && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => (
              <div key={indice} className="h-80 animate-pulse rounded-3xl bg-sal-2" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ordenados.map((departamento) => {
              const Contenedor = departamento.id ? Link : 'div'
              const props = departamento.id ? { to: `/departamentos/${departamento.id}` } : {}
              return (
                <Contenedor
                  key={departamento.id || departamento.nombre}
                  {...props}
                  className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-3xl shadow-[0_20px_40px_-20px_rgba(8,51,68,0.6)] transition duration-300 hover:-translate-y-1"
                >
                  <ImagenSegura
                    src={departamento.imagen_portada}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  {/* Velo oscuro abajo para que el texto se lea sobre cualquier foto. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-noche/90 via-noche/35 to-transparent" />
                  <div className="relative p-6 text-white">
                    <h2 className="text-3xl font-extrabold">{departamento.nombre}</h2>
                    {departamento.eslogan && <p className="mt-1 text-base font-semibold text-cielo">“{departamento.eslogan}”</p>}
                    {departamento.descripcion && <p className="mt-2 line-clamp-2 text-sm text-white/85">{departamento.descripcion}</p>}
                    <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-cielo-700 transition group-hover:gap-3">
                      Ver más <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Contenedor>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Departamentos
