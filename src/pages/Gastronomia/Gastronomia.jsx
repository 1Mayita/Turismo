import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import Modal from '../../components/Modal.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { getPlatos, platosDeEjemplo } from '../../services/platosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { coincideConBusqueda, normalizar } from '../../utils/texto.js'

const CLASE_CAMPO = 'mt-1 w-full rounded-xl border border-borde bg-white/70 px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-noche outline-none focus:border-cielo-600 focus:ring-2 focus:ring-cielo-600/30'
const CLASE_ETIQUETA = 'block text-xs font-bold uppercase tracking-wider text-piedra-texto'

function Gastronomia() {
  const [platos, setPlatos] = useState([])
  const [restaurantes, setRestaurantes] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [idDepartamento, setIdDepartamento] = useState('')
  const [platoAbierto, setPlatoAbierto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [listaPlatos, listaRestaurantes, listaDepartamentos] = await Promise.all([getPlatos(), getRestaurantes(), getDepartamentos()])
        setRestaurantes(listaRestaurantes)
        setDepartamentos(listaDepartamentos.length > 0 ? listaDepartamentos : departamentosDeEjemplo)
        if (listaPlatos.length > 0) {
          setPlatos(listaPlatos)
        } else {
          setPlatos(platosDeEjemplo)
          setAviso('Estás viendo platos de ejemplo: todavía no se cargaron en la base de datos.')
        }
      } catch (errorLectura) {
        console.error('Error al consultar gastronomía en Firestore:', errorLectura)
        setPlatos(platosDeEjemplo)
        setDepartamentos(departamentosDeEjemplo)
        setAviso('No pudimos conectar con el servidor. Estás viendo platos de ejemplo.')
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [])

  const nombreDepartamento = (id) => departamentos.find((departamento) => departamento.id === id)?.nombre

  // Restaurantes que tienen el plato en su lista de platos típicos o en su menú.
  function restaurantesQueSirven(plato) {
    const buscado = normalizar(plato.nombre)
    return restaurantes.filter((restaurante) => {
      const nombres = [
        ...(Array.isArray(restaurante.platos_tipicos) ? restaurante.platos_tipicos : []),
        ...(Array.isArray(restaurante.menu) ? restaurante.menu.map((item) => item.nombre) : []),
      ]
      return nombres.some((nombre) => normalizar(nombre) === buscado)
    })
  }

  const visibles = platos.filter((plato) =>
    (!idDepartamento || plato.id_departamento === idDepartamento)
    && coincideConBusqueda([plato.nombre, plato.origen, plato.descripcion, plato.ingredientes], busqueda))

  const lugaresDelPlatoAbierto = platoAbierto ? restaurantesQueSirven(platoAbierto) : []
  const ingredientes = Array.isArray(platoAbierto?.ingredientes) ? platoAbierto.ingredientes : []

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="contenedor max-w-6xl py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Sabores de Bolivia</p>
          <h1 className="text-4xl font-bold tracking-tight text-noche sm:text-5xl">Gastronomía típica</h1>
          <p className="mt-4 text-lg text-piedra-texto">Los platos que hay que probar en cada región y dónde encontrarlos.</p>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl cristal p-5 sm:grid-cols-[2fr_1fr]">
          <label className={CLASE_ETIQUETA}>
            Buscar un plato o ingrediente
            <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej.: silpancho, maní, trucha..." className={CLASE_CAMPO} />
          </label>
          <label className={CLASE_ETIQUETA}>
            Origen
            <select value={idDepartamento} onChange={(evento) => setIdDepartamento(evento.target.value)} className={CLASE_CAMPO}>
              <option value="">Toda Bolivia</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        {aviso && <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{aviso}</p>}

        {cargando ? (
          <GrillaEsqueleto cantidad={6} />
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl bg-white/60 px-5 py-6 text-piedra-texto ring-1 ring-white/80">
            <p>No encontramos platos que coincidan con tu búsqueda.</p>
            <button type="button" onClick={() => { setBusqueda(''); setIdDepartamento('') }} className="mt-3 font-semibold text-cielo-700 underline">
              Ver todos los platos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((plato) => (
              <article key={plato.id || plato.nombre} className="group flex flex-col overflow-hidden rounded-3xl cristal">
                <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-2xl bg-white/50">
                  <ImagenSegura src={plato.imagen} alt={plato.nombre} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 shadow-sm">
                    {plato.origen || nombreDepartamento(plato.id_departamento) || 'Bolivia'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
                  <h2 className="text-xl font-bold text-noche">{plato.nombre}</h2>
                  {plato.descripcion && <p className="mt-2 line-clamp-3 text-sm leading-6 text-piedra-texto">{plato.descripcion}</p>}
                  <div className="mt-auto pt-4">
                    <button type="button" onClick={() => setPlatoAbierto(plato)} className="rounded-xl boton-principal px-4 py-2 text-sm font-bold">
                      Ver más
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {platoAbierto && (
        <Modal titulo={platoAbierto.nombre} onCerrar={() => setPlatoAbierto(null)}>
          <ImagenSegura src={platoAbierto.imagen} alt={platoAbierto.nombre} className="h-64 w-full object-cover sm:rounded-t-3xl" />
          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="text-sm font-bold text-cobre-texto">Origen: {platoAbierto.origen || nombreDepartamento(platoAbierto.id_departamento) || 'Bolivia'}</p>
              <h2 className="mt-1 text-2xl font-bold text-noche">{platoAbierto.nombre}</h2>
            </div>
            {platoAbierto.descripcion && <p className="leading-7 text-noche/80">{platoAbierto.descripcion}</p>}

            {ingredientes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-piedra-texto">Ingredientes principales</h3>
                <ul className="flex flex-wrap gap-2">
                  {ingredientes.map((ingrediente) => (
                    <li key={ingrediente} className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">{ingrediente}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-piedra-texto">Dónde probarlo</h3>
              {platoAbierto.lugares_tradicionales && <p className="mb-3 text-sm leading-6 text-noche/80">{platoAbierto.lugares_tradicionales}</p>}
              {lugaresDelPlatoAbierto.length > 0 ? (
                <ul className="space-y-2">
                  {lugaresDelPlatoAbierto.map((restaurante) => (
                    <li key={restaurante.id}>
                      <Link to={`/restaurantes/${restaurante.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-cielo/50 px-4 py-3 transition hover:bg-cielo">
                        <span>
                          <span className="block font-bold text-noche">{restaurante.nombre}</span>
                          <span className="block text-sm text-piedra-texto">{restaurante.ubicacion}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-cielo-700">Ver restaurante →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-piedra-texto">Todavía no hay restaurantes registrados que lo tengan en su menú.</p>
              )}
            </div>

            {platoAbierto.credito_imagen && <p className="text-xs text-piedra-texto">{platoAbierto.credito_imagen}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Gastronomia
