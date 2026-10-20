import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { Aparecer } from '../../components/ui'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { sembrarCatalogoDeEjemplo } from '../../services/sembradoService.js'

// En escritorio estas tarjetas ocupan dos columnas: arma un mosaico de 9
// piezas sin huecos (3 columnas) y evita una grilla de tarjetas idénticas.
const ANCHOS_EN_MOSAICO = [0, 5, 7]

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
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cobre-texto">Los nueve departamentos</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">Explora por departamento</h1>
          <p className="texto-lectura mt-3 text-lg text-piedra-texto">Del altiplano a la Amazonía: elige un departamento y descubre sus municipios, destinos y sabores.</p>
        </div>

        {error && <p className="mb-8 rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        {cargando ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => (
              <div key={indice} className="h-80 animate-pulse rounded-tarjeta bg-sal-2" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ordenados.map((departamento, indice) => {
              const Contenedor = departamento.id ? Link : 'div'
              const props = departamento.id ? { to: `/departamentos/${departamento.id}` } : {}
              return (
                <Aparecer key={departamento.id || departamento.nombre} indice={indice % 3} className={`h-80 ${ANCHOS_EN_MOSAICO.includes(indice) ? 'xl:col-span-2' : ''}`}>
                <Contenedor
                  {...props}
                  className="group relative flex h-full flex-col justify-end overflow-hidden rounded-tarjeta shadow-suave transition duration-200 ease-salida hover:-translate-y-1 hover:shadow-elevada"
                >
                  <ImagenSegura
                    src={departamento.imagen_portada}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-salida group-hover:scale-[1.04]"
                  />
                  {/* Velo oscuro abajo para que el texto se lea sobre cualquier foto. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-noche/90 via-noche/35 to-transparent" />
                  <div className="relative p-6 text-white">
                    <h2 className="titulo-display text-[38px] text-white">{departamento.nombre}</h2>
                    {departamento.eslogan && <p className="font-titulo text-xl italic text-white/90">“{departamento.eslogan}”</p>}
                    {departamento.descripcion && <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/85">{departamento.descripcion}</p>}
                    <span className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-control bg-white px-4 text-sm font-bold text-noche transition-[gap] group-hover:gap-3">
                      Ver más <ArrowRight aria-hidden="true" size={16} />
                    </span>
                  </div>
                </Contenedor>
                </Aparecer>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Departamentos
