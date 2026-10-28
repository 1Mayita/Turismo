import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Search, SearchX, Soup } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import { Aparecer, EstadoVacio, FondoTarjetaFoto, claseBoton, claseBotonFoto, claseControl, claseEtiqueta, claseEtiquetaFoto, claseTarjetaFoto } from '../../components/ui'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import Modal from '../../components/Modal.jsx'
import { GrillaEsqueleto } from '../../components/EsqueletoTarjeta.jsx'
import { getPlatos, platosDeEjemplo } from '../../services/platosService.js'
import { getRestaurantes } from '../../services/restaurantesService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { coincideConBusqueda, normalizar } from '../../utils/texto.js'

const CLASE_CAMPO = `${claseControl} mt-1.5 text-sm font-normal`
const CLASE_ETIQUETA = claseEtiqueta

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
      <main className="contenedor max-w-[1440px] py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 rotulo">Sabores de Bolivia</p>
          <h1 className="titulo-display text-[44px] sm:text-[56px]">Gastronomía típica</h1>
          <p className="texto-lectura mt-3 text-lg text-piedra-texto">Los platos que hay que probar en cada región y dónde encontrarlos.</p>
        </div>

        <div className="mb-8 grid gap-4 rounded-tarjeta border border-borde bg-white p-5 shadow-suave sm:grid-cols-[2fr_1fr]">
          <label className={CLASE_ETIQUETA}>
            Buscar un plato o ingrediente
            <span className="relative mt-1.5 block">
              <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-piedra" />
              <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej.: silpancho, maní, trucha..." className={`${CLASE_CAMPO} mt-0 pl-10`} />
            </span>
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

        {aviso && <p className="mb-8 rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{aviso}</p>}

        {cargando ? (
          <GrillaEsqueleto cantidad={6} />
        ) : visibles.length === 0 ? (
          <EstadoVacio
            icono={SearchX}
            titulo="No encontramos platos que coincidan con tu búsqueda"
            mensaje="Prueba con otro ingrediente o elige otro origen."
            accion={
              <button type="button" onClick={() => { setBusqueda(''); setIdDepartamento('') }} className={claseBoton('secundario', 'normal', 'bg-white')}>
                Ver todos los platos
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((plato, indice) => (
              <Aparecer key={plato.id || plato.nombre} indice={indice % 3} como="article" className={`group shadow-suave ${claseTarjetaFoto}`}>
                <FondoTarjetaFoto src={plato.imagen} alt={plato.nombre} />
                <span className={`absolute left-4 top-4 ${claseEtiquetaFoto}`}>
                  <MapPin aria-hidden="true" size={13} className="text-atardecer-texto" />
                  {plato.origen || nombreDepartamento(plato.id_departamento) || 'Bolivia'}
                </span>
                <div className="relative p-5">
                  <h2 className="titulo-display text-[34px] leading-tight text-white">{plato.nombre}</h2>
                  {plato.descripcion && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{plato.descripcion}</p>}
                  <button type="button" onClick={() => setPlatoAbierto(plato)} className={`mt-4 ${claseBotonFoto}`}>
                    Ver más
                    <ArrowRight aria-hidden="true" size={16} />
                  </button>
                </div>
              </Aparecer>
            ))}
          </div>
        )}
      </main>

      {platoAbierto && (
        <Modal titulo={platoAbierto.nombre} onCerrar={() => setPlatoAbierto(null)}>
          <ImagenSegura src={platoAbierto.imagen} alt={platoAbierto.nombre} className="h-64 w-full object-cover sm:h-72" />
          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-cobre-texto">
                <MapPin aria-hidden="true" size={16} /> Origen: {platoAbierto.origen || nombreDepartamento(platoAbierto.id_departamento) || 'Bolivia'}
              </p>
              <h2 className="titulo-display mt-1 text-[40px]">{platoAbierto.nombre}</h2>
            </div>
            {platoAbierto.descripcion && <p className="leading-7 text-noche/80">{platoAbierto.descripcion}</p>}

            {ingredientes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-noche">Ingredientes principales</h3>
                <ul className="flex flex-wrap gap-2">
                  {ingredientes.map((ingrediente) => (
                    <li key={ingrediente} className="rounded-full bg-cielo px-3 py-1 text-sm font-bold text-noche">{ingrediente}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-noche"><Soup aria-hidden="true" size={16} className="text-cielo-700" /> Dónde probarlo</h3>
              {platoAbierto.lugares_tradicionales && <p className="mb-3 text-sm leading-6 text-noche/80">{platoAbierto.lugares_tradicionales}</p>}
              {lugaresDelPlatoAbierto.length > 0 ? (
                <ul className="space-y-2">
                  {lugaresDelPlatoAbierto.map((restaurante) => (
                    <li key={restaurante.id}>
                      <Link to={`/restaurantes/${restaurante.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded-control border border-borde px-4 py-3 transition hover:bg-sal-2">
                        <span>
                          <span className="block font-bold text-noche">{restaurante.nombre}</span>
                          <span className="block text-sm text-piedra-texto">{restaurante.ubicacion}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-cielo-700">Ver restaurante <ArrowRight aria-hidden="true" size={16} /></span>
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
