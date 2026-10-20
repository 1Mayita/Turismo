import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, MapPinned, Move3d, X } from 'lucide-react'
import ImagenSegura from '../ImagenSegura.jsx'
import MapaBolivia2D from './MapaBolivia2D.jsx'
import { CREDITO_MAPA, DEPARTAMENTOS_MAPA } from './boliviaSvg.js'
import { claseBoton } from '../ui/estilos.js'

const MapaBolivia3D = lazy(() => import('./MapaBolivia3D.jsx'))
const MAXIMO_EN_PANEL = 4

function hayWebGL() {
  try {
    const lienzo = document.createElement('canvas')
    return Boolean(lienzo.getContext('webgl2') || lienzo.getContext('webgl'))
  } catch {
    return false
  }
}

// El 3D solo se usa en escritorio, con mouse, sin "reducir movimiento" y en
// equipos con algo de potencia. En los demás casos queda el mapa 2D, que hace
// lo mismo al tocarlo (DESIGN.md §6.1).
function puedeUsar3D() {
  const coincide = (consulta) => window.matchMedia(consulta).matches
  if (coincide('(prefers-reduced-motion: reduce)')) return false
  if (coincide('(max-width: 1023px)') || coincide('(pointer: coarse)')) return false
  if ((navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2) return false
  return hayWebGL()
}

// Si el 3D falla al cargarse o al dibujarse, se queda el 2D sin romper la página.
class SiFalla3D extends Component {
  constructor(props) {
    super(props)
    this.state = { fallo: false }
  }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch(error) {
    console.error('El mapa 3D no se pudo mostrar; se usa el 2D:', error)
    this.props.alFallar()
  }

  render() {
    return this.state.fallo ? null : this.props.children
  }
}

function PanelDepartamento({ departamento, destinos, cantidad, alCerrar, className = '' }) {
  const titulo = useRef(null)

  useEffect(() => {
    titulo.current?.focus()
  }, [departamento.id])

  return (
    <section
      aria-label={`Destinos de ${departamento.nombre}`}
      className={`rounded-tarjeta border border-borde bg-white p-4 shadow-elevada ${className}`}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape') alCerrar()
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cobre-texto">Departamento</p>
          <h2 ref={titulo} tabIndex={-1} className="titulo-display text-[32px] outline-none">{departamento.nombre}</h2>
        </div>
        <button type="button" onClick={alCerrar} aria-label="Cerrar" className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-piedra-texto transition hover:bg-sal-2 hover:text-noche">
          <X aria-hidden="true" />
        </button>
      </div>

      {destinos.length === 0 ? (
        <p className="mt-2 text-sm text-piedra-texto">Todavía no hay destinos publicados aquí, pero puedes conocer sus municipios, dónde comer y dónde dormir.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {destinos.map((destino) => (
            <li key={destino.id}>
              <Link to={`/destinos/${destino.id}`} className="flex min-h-11 items-center gap-3 rounded-control p-1.5 transition hover:bg-sal-2">
                <ImagenSegura src={destino.imagen_principal} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-control object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-noche">{destino.nombre}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-piedra-texto">
                    <MapPin aria-hidden="true" size={12} className="shrink-0" />
                    {destino.ubicacion}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to={`/departamentos/${departamento.id}`} className={claseBoton('secundario', 'pequeno', 'mt-3 w-full')}>
        {cantidad > 0 ? `Ver todos los destinos de ${departamento.nombre}` : `Conocer ${departamento.nombre}`}
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </section>
  )
}

// Mapa del inicio: 3D interactivo en escritorio y 2D en celular o equipos
// lentos. Mientras el 3D se descarga se ve el 2D con el mismo encuadre.
// Al elegir un departamento (mapa o lista) se abre su panel con destacados.
function HeroMapa({ destinos, cantidades, idActivo, alElegir, pines }) {
  const [usar3D, setUsar3D] = useState(false)
  const [idPanel, setIdPanel] = useState('')
  // Botón desde el que se abrió el panel, para devolverle el foco al cerrarlo.
  const origenDelPanel = useRef(null)

  // Se decide después de mostrar la página y cuando el navegador está libre,
  // para que el 3D nunca retrase lo demás.
  useEffect(() => {
    if (!puedeUsar3D()) return
    const pedir = window.requestIdleCallback || ((funcion) => setTimeout(funcion, 600))
    const cancelar = window.cancelIdleCallback || clearTimeout
    const id = pedir(() => setUsar3D(true))
    return () => cancelar(id)
  }, [])

  function elegir(id) {
    origenDelPanel.current = document.activeElement?.tagName === 'BUTTON' ? document.activeElement : null
    alElegir(id)
    setIdPanel(id)
  }

  function cerrarPanel() {
    setIdPanel('')
    origenDelPanel.current?.focus()
  }

  const departamentoPanel = DEPARTAMENTOS_MAPA.find((departamento) => departamento.id === idPanel)
  const destinosPanel = destinos
    .filter((destino) => destino.id_departamento === idPanel)
    .sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)))
    .slice(0, MAXIMO_EN_PANEL)
  const mapa2D = <MapaBolivia2D cantidades={cantidades} idActivo={idActivo} alElegir={elegir} pines={pines} />
  const departamentosOrdenados = [...DEPARTAMENTOS_MAPA].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <figure className="mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative">
        {usar3D ? (
          <SiFalla3D alFallar={() => setUsar3D(false)}>
            <Suspense fallback={mapa2D}>
              <MapaBolivia3D cantidades={cantidades} idActivo={idActivo} alElegir={elegir} pines={pines} conPanel={Boolean(idPanel)} alFallar={() => setUsar3D(false)} />
            </Suspense>
          </SiFalla3D>
        ) : mapa2D}

        {departamentoPanel && (
          <PanelDepartamento
            departamento={departamentoPanel}
            destinos={destinosPanel}
            cantidad={cantidades[departamentoPanel.id] || 0}
            alCerrar={cerrarPanel}
            className="mt-4 lg:absolute lg:bottom-4 lg:right-0 lg:mt-0 lg:w-72"
          />
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-piedra-texto">
        <span className="inline-flex items-center gap-1.5">
          {usar3D ? <Move3d aria-hidden="true" size={16} className="text-atardecer-700" /> : <MapPinned aria-hidden="true" size={16} className="text-atardecer-700" />}
          {usar3D ? 'Arrastra para girar el mapa y toca un departamento' : 'Toca un departamento para ver sus destinos'}
        </span>
        <span className="text-xs">{CREDITO_MAPA}</span>
      </figcaption>

      {/* La misma acción que tocar el mapa, para teclado y lectores de pantalla. */}
      <nav aria-label="Departamentos del mapa" className="mt-3">
        <ul className="flex flex-wrap gap-1.5">
          {departamentosOrdenados.map((departamento) => (
            <li key={departamento.id}>
              <button
                type="button"
                onClick={() => elegir(departamento.id)}
                aria-pressed={idPanel === departamento.id}
                className={`min-h-11 rounded-full px-3 text-sm font-semibold transition ${
                  idPanel === departamento.id ? 'bg-noche text-white' : 'text-piedra-texto hover:bg-white hover:text-noche'
                }`}
              >
                {departamento.nombre}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </figure>
  )
}

export default HeroMapa
