import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import BarraBusqueda from '../../components/BarraBusqueda.jsx'
import RecomendadoParaTi from '../../components/RecomendadoParaTi.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { FOTOS } from '../../services/fotosDeEjemplo.js'

const MAXIMO_DESTACADOS = 6
// El reflejo del cielo en el Salar de Uyuni, en tamaño grande para la portada.
const FOTO_PORTADA = FOTOS['salar-de-uyuni'].imagenes[1].replace('width=960', 'width=1600')
const TODOS = ''

function claseChip(activo) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    activo ? 'bg-brand-700 text-white' : 'bg-white text-brand-800 ring-1 ring-white/80 hover:bg-brand-100'
  }`
}

function Inicio() {
  const navegar = useNavigate()
  const [destinos, setDestinos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [idDepartamentoActivo, setIdDepartamentoActivo] = useState(TODOS)

  useEffect(() => {
    async function cargarInicio() {
      try {
        const [listaDestinos, listaDepartamentos, listaCategorias] = await Promise.all([getDestinos(), getDepartamentos(), getCategorias()])
        setDestinos(listaDestinos.length > 0 ? listaDestinos : destinosDeEjemplo)
        setDepartamentos(listaDepartamentos.length > 0 ? listaDepartamentos : departamentosDeEjemplo)
        setCategorias(listaCategorias.length > 0 ? listaCategorias : categoriasDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al consultar el catálogo en Firestore:', errorLectura)
        setDestinos(destinosDeEjemplo)
        setDepartamentos(departamentosDeEjemplo)
        setCategorias(categoriasDeEjemplo)
        setError('No pudimos conectar con el servidor. Estás viendo destinos de ejemplo.')
      } finally {
        setCargando(false)
      }
    }

    cargarInicio()
  }, [])

  // Solo se ofrecen como filtro los departamentos que ya tienen destinos.
  const cantidadPorDepartamento = (id) => destinos.filter((destino) => destino.id_departamento === id).length
  const departamentosConDestinos = departamentos
    .filter((departamento) => cantidadPorDepartamento(departamento.id) > 0)
    .sort((a, b) => cantidadPorDepartamento(b.id) - cantidadPorDepartamento(a.id))
  const departamentoActivo = departamentos.find((departamento) => departamento.id === idDepartamentoActivo)

  // Primero los marcados como destacados; el resto completa la lista.
  const ordenados = [...destinos].sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)))
  const destacados = ordenados.filter((destino) => destino.destacado)
  let candidatos = destacados.length >= 3 ? destacados : ordenados
  if (departamentoActivo) candidatos = ordenados.filter((destino) => destino.id_departamento === departamentoActivo.id)
  const visibles = candidatos.slice(0, MAXIMO_DESTACADOS)

  const categoriasConDestinos = categorias
    .map((categoria) => ({ ...categoria, cantidad: destinos.filter((destino) => destino.categoria === categoria.nombre).length }))
    .filter((categoria) => categoria.cantidad > 0)

  function buscar(texto) {
    navegar(texto ? `/buscar?buscar=${encodeURIComponent(texto)}` : '/buscar')
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section
        className="relative mx-3 mt-3 overflow-hidden rounded-[2rem] text-white shadow-[0_30px_60px_-30px_rgba(8,51,68,0.7)] sm:mx-5"
        style={{
          // Oscuro a la izquierda (donde va el texto) y casi transparente a la
          // derecha, para que la foto del salar se vea.
          backgroundImage: `linear-gradient(90deg, rgba(8,51,68,0.94) 0%, rgba(12,74,110,0.78) 50%, rgba(14,116,144,0.2) 100%), url(${FOTO_PORTADA})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="contenedor max-w-6xl py-24 sm:py-28">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">Turismo en Bolivia</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] sm:text-6xl">Descubre Bolivia, de sus salares a su Amazonía</h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Destinos, eventos, dónde comer y dónde dormir en los nueve departamentos, en un solo lugar.
          </p>

          <BarraBusqueda tamano="grande" onBuscar={buscar} placeholder="¿A dónde quieres ir? Ej.: Uyuni, Sucre..." className="mt-8 max-w-2xl" />

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/destinos" className="rounded-xl boton-principal px-5 py-3 font-bold shadow-lg shadow-black/20 transition">
              Explorar destinos
            </Link>
            <Link to="/departamentos" className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold backdrop-blur-sm transition hover:bg-white hover:text-brand-800">
              Ver departamentos
            </Link>
            <Link to="/mapa" className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold backdrop-blur-sm transition hover:bg-white hover:text-brand-800">
              Abrir el mapa
            </Link>
          </div>

          {!cargando && (
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/20 pt-6 text-center sm:text-left">
              <div>
                <p className="text-3xl font-extrabold text-white">{departamentos.length}</p>
                <p className="text-sm text-white/75">Departamentos</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{categorias.length}</p>
                <p className="text-sm text-white/75">Categorías turísticas</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{destinos.length}</p>
                <p className="text-sm text-white/75">Destinos por descubrir</p>
              </div>
            </div>
          )}
          <p className="mt-6 text-xs text-white/50">Foto: Christopher Crouzet (CC BY-SA 4.0) — Wikimedia Commons</p>
        </div>
      </section>

      <main className="contenedor max-w-6xl py-12">
        {error && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>}

        <RecomendadoParaTi className="mb-14" />

        {categoriasConDestinos.length > 0 && (
          <section className="mb-14">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">¿Qué te gustaría hacer?</p>
            <h2 className="mb-5 text-3xl font-bold text-slate-900">Explora por categoría</h2>
            <div className="flex flex-wrap gap-3">
              {categoriasConDestinos.map((categoria) => (
                <Link
                  key={categoria.id || categoria.nombre}
                  to={`/destinos?categoria=${encodeURIComponent(categoria.nombre)}`}
                  className="rounded-2xl cristal px-5 py-3 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  {categoria.nombre}
                  <span className="ml-2 text-sm font-normal text-slate-500">{categoria.cantidad} {categoria.cantidad === 1 ? 'destino' : 'destinos'}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-accent-600">Destacados</p>
              <h2 className="text-3xl font-bold text-slate-900">
                {departamentoActivo ? `Lo mejor de ${departamentoActivo.nombre}` : 'Destinos que no te puedes perder'}
              </h2>
            </div>
            {departamentosConDestinos.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar destacados por departamento">
                <button type="button" aria-pressed={!departamentoActivo} onClick={() => setIdDepartamentoActivo(TODOS)} className={claseChip(!departamentoActivo)}>
                  Todos
                </button>
                {departamentosConDestinos.map((departamento) => (
                  <button
                    key={departamento.id}
                    type="button"
                    aria-pressed={departamentoActivo?.id === departamento.id}
                    onClick={() => setIdDepartamentoActivo(departamento.id)}
                    className={claseChip(departamentoActivo?.id === departamento.id)}
                  >
                    {departamento.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {cargando ? (
            <GrillaEsqueleto cantidad={3} />
          ) : visibles.length === 0 ? (
            <p className="rounded-2xl px-5 py-6 text-slate-600 cristal">
              Todavía no hay destinos publicados.{' '}
              <Link to="/departamentos" className="font-semibold text-brand-700 underline">Conoce los departamentos</Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((destino) => (
                <TarjetaDestino key={destino.id || destino.nombre} destino={destino} />
              ))}
              {/* Con pocos destinos, esta tarjeta completa la fila e invita a seguir. */}
              {departamentoActivo && visibles.length % 3 !== 0 && (
                <Link
                  to={`/departamentos/${departamentoActivo.id}`}
                  className="flex min-h-64 flex-col justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-white/40 p-7 backdrop-blur transition hover:bg-white/60"
                >
                  <p className="text-xl font-bold text-slate-900">Más sobre {departamentoActivo.nombre}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Municipios, dónde comer y dónde dormir en este departamento.</p>
                  <span className="mt-4 font-semibold text-brand-700">Ver el departamento →</span>
                </Link>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/destinos" className="inline-block rounded-xl bg-brand-700 px-6 py-3 font-bold text-white transition hover:bg-brand-800">
              Ver todos los destinos
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Inicio
