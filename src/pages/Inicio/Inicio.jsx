import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, Heart, Map as IconoMapa, MapPin, Route, Share2 } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import BarraBusqueda from '../../components/BarraBusqueda.jsx'
import RecomendadoParaTi from '../../components/RecomendadoParaTi.jsx'
import TarjetaDestino from '../../components/TarjetaDestino.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import HeroMapa from '../../components/mapa/HeroMapa.jsx'
import { Aparecer, Carrusel, Chip, EncabezadoSeccion, EstadoVacio, EsqueletoTarjetaBase, FondoTarjetaFoto, claseBoton, claseBotonFoto, claseTarjetaFoto, iconoDeCategoria } from '../../components/ui'
import { useAuth } from '../../context/useAuth.js'
import { destinosDeEjemplo, getDestinos } from '../../services/destinosService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { formatearFechaEvento, getEventosProximos } from '../../services/eventosService.js'
import { getPlatos, platosDeEjemplo } from '../../services/platosService.js'
import { FOTOS } from '../../services/fotosDeEjemplo.js'

const MAXIMO_DESTACADOS = 6
const MAXIMO_EVENTOS = 3
const MAXIMO_PLATOS = 5
// El reflejo del cielo en el Salar de Uyuni, en tamaño grande.
const FOTO_SALAR = FOTOS['salar-de-uyuni'].imagenes[1].replace('width=960', 'width=1600')
const CREDITO_FOTO_SALAR = 'Foto: Christopher Crouzet (CC BY-SA 4.0) — Wikimedia Commons'
// Fondo del hero: atardecer en el Salar de Uyuni.
const FOTO_HERO = FOTOS['salar-de-uyuni'].imagenes[2].replace('width=960', 'width=1920')
const CREDITO_FOTO_HERO = 'Foto: Luca Galuzzi (CC BY-SA 2.5) — Wikimedia Commons'
// Ancho de las secciones del inicio: aprovecha toda la pantalla, alineado
// con la barra de navegación.
const ANCHO = 'contenedor max-w-[1440px]'
const TODOS = ''
// Departamento por defecto del sistema (DESIGN.md §6.1). Si todavía no tiene
// destinos publicados, se muestran los destacados de todo el país.
const DEPARTAMENTO_POR_DEFECTO = 'cochabamba'
// Lugares marcados con un pin en el mapa del inicio.
const PINES_DEL_MAPA = ['salar-de-uyuni', 'isla-del-sol', 'cristo-de-la-concordia']

const PASOS_DEL_VIAJE = [
  { icono: Heart, texto: 'Guarda los lugares que te gustan mientras exploras.' },
  { icono: Route, texto: 'Ordénalos en tu itinerario y mira la ruta en el mapa.' },
  { icono: Share2, texto: 'Compártelo con quienes viajan contigo.' },
]

// Número que cuenta desde 0 hasta "valor" al aparecer (0,9 s, frena al final).
// Con "reducir movimiento" se muestra directo.
function Cifra({ valor }) {
  const [mostrado, setMostrado] = useState(0)
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reducir) return
    const inicio = performance.now()
    let id
    function paso(ahora) {
      const avance = Math.min(1, (ahora - inicio) / 900)
      setMostrado(Math.round(valor * (1 - (1 - avance) ** 3)))
      if (avance < 1) id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [valor, reducir])

  return reducir ? valor : mostrado
}

// Retraso escalonado para la entrada de los elementos del hero.
const retraso = (segundos) => ({ animationDelay: `${segundos}s` })

// "oct." → "oct", para el recuadro de fecha de los eventos.
function mesCorto(fechaISO) {
  return formatearFechaEvento(fechaISO, { month: 'short' }).replace('.', '')
}

function rangoDeFechas(evento) {
  const opciones = { day: 'numeric', month: 'long' }
  const inicio = formatearFechaEvento(evento.fecha_inicio, opciones)
  return evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio
    ? `${inicio} al ${formatearFechaEvento(evento.fecha_fin, opciones)}`
    : inicio
}

function TarjetaEvento({ evento, indice }) {
  const dia = Number(evento.fecha_inicio?.split('-')[2]) || ''
  return (
    <Aparecer como="li" indice={indice}>
      <Link to="/eventos" className={`group tarjeta-hover ${claseTarjetaFoto}`}>
        <FondoTarjetaFoto src={evento.imagen} alt={evento.nombre} />
        <div className="absolute left-4 top-4 flex min-w-16 flex-col items-center rounded-control bg-white px-3 pb-2 pt-1.5 text-center shadow-elevada">
          <span className="text-[26px] font-bold leading-none tracking-tight text-noche">{dia}</span>
          <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-atardecer-texto">{mesCorto(evento.fecha_inicio)}</span>
        </div>
        <div className="relative p-5">
          <h3 className="titulo-display text-[30px] leading-tight text-white">{evento.nombre}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
            <CalendarDays aria-hidden="true" size={16} className="shrink-0" />
            {rangoDeFechas(evento)}
          </p>
          {evento.ubicacion && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin aria-hidden="true" size={16} className="shrink-0" />
              {evento.ubicacion}
            </p>
          )}
          <span className={`mt-4 ${claseBotonFoto}`}>
            Ver más <ArrowRight aria-hidden="true" size={16} />
          </span>
        </div>
      </Link>
    </Aparecer>
  )
}

function Inicio() {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const [destinos, setDestinos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [eventos, setEventos] = useState([])
  const [platos, setPlatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoExtras, setCargandoExtras] = useState(true)
  const [error, setError] = useState('')
  const [idDepartamentoElegido, setIdDepartamentoElegido] = useState(DEPARTAMENTO_POR_DEFECTO)

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

    // Eventos y platos se cargan aparte: si fallan, el resto del inicio sigue.
    async function cargarExtras() {
      const [listaEventos, listaPlatos] = await Promise.all([
        getEventosProximos().catch((errorLectura) => {
          console.error('Error al cargar los eventos del inicio:', errorLectura)
          return []
        }),
        getPlatos().catch((errorLectura) => {
          console.error('Error al cargar los platos del inicio:', errorLectura)
          return platosDeEjemplo
        }),
      ])
      setEventos(listaEventos.slice(0, MAXIMO_EVENTOS))
      setPlatos((listaPlatos.length > 0 ? listaPlatos : platosDeEjemplo).filter((plato) => plato.imagen).slice(0, MAXIMO_PLATOS))
      setCargandoExtras(false)
    }

    cargarInicio()
    cargarExtras()
  }, [])

  // Solo se ofrecen como filtro los departamentos que ya tienen destinos.
  const cantidadPorDepartamento = (id) => destinos.filter((destino) => destino.id_departamento === id).length
  const cantidades = Object.fromEntries(departamentos.map((departamento) => [departamento.id, cantidadPorDepartamento(departamento.id)]))
  const departamentosConDestinos = departamentos
    .filter((departamento) => cantidadPorDepartamento(departamento.id) > 0)
    .sort((a, b) => cantidadPorDepartamento(b.id) - cantidadPorDepartamento(a.id))
  const departamentoActivo = departamentosConDestinos.find((departamento) => departamento.id === idDepartamentoElegido)

  // Primero los marcados como destacados; el resto completa la lista.
  const ordenados = [...destinos].sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)))
  const destacados = ordenados.filter((destino) => destino.destacado)
  let candidatos = destacados.length >= 3 ? destacados : ordenados
  if (departamentoActivo) candidatos = ordenados.filter((destino) => destino.id_departamento === departamentoActivo.id)
  const visibles = candidatos.slice(0, MAXIMO_DESTACADOS)

  const categoriasConDestinos = categorias
    .map((categoria) => ({ ...categoria, cantidad: destinos.filter((destino) => destino.categoria === categoria.nombre).length }))
    .filter((categoria) => categoria.cantidad > 0)

  const pines = destinos.filter((destino) => PINES_DEL_MAPA.includes(destino.id) && Number.isFinite(Number(destino.latitud)) && Number.isFinite(Number(destino.longitud)))
    .map((destino) => ({ id: destino.id, departamento: destino.id_departamento, latitud: Number(destino.latitud), longitud: Number(destino.longitud) }))

  function buscar(texto) {
    navegar(texto ? `/buscar?buscar=${encodeURIComponent(texto)}` : '/buscar')
  }

  // Elegir un departamento (en el mapa, su lista o los chips) cambia los
  // destacados. El mapa además abre su panel con los destinos del lugar.
  function elegirDepartamento(id) {
    setIdDepartamentoElegido(id)
  }

  const claseEnlaceHero = 'inline-flex min-h-12 items-center gap-2 rounded-control px-3 text-[15px] font-bold text-white transition-colors hover:bg-white/10'

  return (
    <div className="min-h-screen">
      <Navbar anchoCompleto />

      {/* ---------- Hero ----------
          Pantalla completa en azul noche con la foto del atardecer en el
          salar de fondo. El texto entra escalonado; la foto se acerca una
          sola vez al cargar (nada se mueve después). Abajo, la foto se funde
          con el fondo claro de la página, como la bruma sobre el salar. */}
      <section className="relative isolate flex min-h-[calc(100svh-72px)] items-center overflow-hidden bg-noche text-white">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-50">
          <img src={FOTO_HERO} alt="" decoding="async" fetchPriority="high" className="h-full w-full animate-[acercar_2.6s_var(--ease-salida)_both] object-cover object-[50%_70%]" />
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#0e2233_10%,rgb(14_34_51/0.88)_42%,rgb(14_34_51/0.45)_75%,rgb(14_34_51/0.7)_100%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[linear-gradient(to_bottom,rgb(248_249_251/0)_0%,rgb(248_249_251/0.12)_25%,rgb(248_249_251/0.55)_60%,rgb(248_249_251/0.9)_85%,#f8f9fb_100%)] sm:h-72" />

        <div className={`${ANCHO} grid gap-10 pb-28 pt-12 sm:pb-44 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-x-16 lg:pb-48 lg:pt-14`}>
          <div className="max-w-xl">
            <p className="rotulo mb-5 animate-entrar text-atardecer" style={retraso(0.05)}>Turismo en Bolivia</p>
            <h1 className="titulo-display animate-entrar text-[42px] leading-[1.03] text-white sm:text-[64px] xl:text-[72px]" style={retraso(0.12)}>
              Descubre Bolivia,{' '}
              <span className="text-white/55">de sus salares a su Amazonía</span>
            </h1>
            <p className="texto-lectura mt-6 max-w-md animate-entrar text-base text-white/75 sm:text-lg" style={retraso(0.22)}>
              Destinos, eventos, dónde comer y dónde dormir en los nueve departamentos, en un solo lugar.
            </p>

            <div className="animate-entrar" style={retraso(0.3)}>
              <BarraBusqueda tamano="grande" onBuscar={buscar} placeholder="¿A dónde vamos hoy?" className="mt-8" />
            </div>

            {/* El buscador ya lleva el acento: "Explorar" va en blanco y el
                resto como enlaces, para que no compitan cuatro botones iguales. */}
            <div className="mt-5 flex animate-entrar flex-wrap items-center gap-1" style={retraso(0.38)}>
              <Link to="/destinos" className={claseBoton('secundario', 'normal', 'group mr-2 border-white px-6 hover:border-white hover:bg-white/90')}>
                Explorar destinos
                <ArrowRight aria-hidden="true" size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link to="/departamentos" className={claseEnlaceHero}>Ver departamentos</Link>
              <Link to="/mapa" className={claseEnlaceHero}>
                <IconoMapa aria-hidden="true" size={18} className="text-cielo-claro" />
                Abrir el mapa
              </Link>
            </div>

            {!cargando && (
              <dl className="mt-12 grid max-w-md animate-entrar grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-6 [&>div:not(:first-child)]:pl-5" style={retraso(0.1)}>
                {[
                  [departamentos.length, 'Departamentos'],
                  [categorias.length, 'Categorías turísticas'],
                  [destinos.length, 'Destinos por descubrir'],
                ].map(([valor, etiqueta]) => (
                  <div key={etiqueta}>
                    <dt className="sr-only">{etiqueta}</dt>
                    <dd className="text-[32px] font-bold leading-none tracking-[-0.02em] tabular-nums text-white sm:text-[38px]"><Cifra valor={valor} /></dd>
                    <dd aria-hidden="true" className="mt-2 text-xs leading-snug text-white/60 sm:text-[13px]">{etiqueta}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="animate-[fundido_0.9s_ease-out_0.25s_both]">
            <HeroMapa
              oscuro
              destinos={destinos}
              cantidades={cantidades}
              idActivo={departamentoActivo?.id || idDepartamentoElegido}
              alElegir={elegirDepartamento}
              pines={pines}
            />
          </div>
        </div>

        <p className="absolute bottom-3 right-4 text-[11px] text-piedra-texto/80 sm:right-6">{CREDITO_FOTO_HERO}</p>
        <a
          href="#contenido-inicio"
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-semibold text-noche/60 transition-colors hover:text-noche lg:flex"
        >
          Seguir explorando
          <ChevronDown aria-hidden="true" size={18} />
        </a>
      </section>

      <main id="contenido-inicio" className="scroll-mt-[72px]">
        {error && (
          <div className={`${ANCHO} pt-8`}>
            <p className="rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">{error}</p>
          </div>
        )}

        {/* ---------- 1. Categorías ---------- */}
        {categoriasConDestinos.length > 0 && (
          <section aria-labelledby="titulo-categorias" className={`${ANCHO} pt-12 lg:pt-16`}>
            <h2 id="titulo-categorias" className="mb-4 text-[15px] font-bold text-noche">¿Qué te gustaría hacer?</h2>
            <ul className="flex flex-wrap gap-2">
              {categoriasConDestinos.map((categoria) => {
                const Icono = iconoDeCategoria(categoria.nombre)
                return (
                  <li key={categoria.id || categoria.nombre}>
                    <Link
                      to={`/destinos?categoria=${encodeURIComponent(categoria.nombre)}`}
                      className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-borde bg-white py-2 pl-3.5 pr-2 text-sm font-bold text-noche transition-colors duration-150 hover:border-noche hover:bg-noche hover:text-white"
                    >
                      <Icono aria-hidden="true" size={18} className="shrink-0 text-cielo-700 transition-colors group-hover:text-white" />
                      {categoria.nombre}
                      <span className="ml-0.5 rounded-full bg-sal-2 px-2 py-0.5 text-xs font-bold text-piedra-texto transition-colors group-hover:bg-white/15 group-hover:text-white">{categoria.cantidad}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* ---------- 2. Destacados del departamento ---------- */}
        <section id="destacados" aria-labelledby="titulo-destacados" className={`${ANCHO} scroll-mt-24 pb-14 pt-12 lg:pb-24 lg:pt-16`}>
          <EncabezadoSeccion
            id="titulo-destacados"
            antetitulo="Destacados"
            titulo={departamentoActivo ? `Destacados en ${departamentoActivo.nombre}` : 'Destinos que no te puedes perder'}
            className="mb-5"
          />

          {departamentosConDestinos.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Elegir departamento">
              <Chip activo={!departamentoActivo} onClick={() => elegirDepartamento(TODOS)}>Todos</Chip>
              {departamentosConDestinos.map((departamento) => (
                <Chip key={departamento.id} activo={departamentoActivo?.id === departamento.id} onClick={() => elegirDepartamento(departamento.id)}>
                  {departamento.nombre}
                </Chip>
              ))}
            </div>
          )}

          {cargando ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <EsqueletoTarjetaBase />
              <EsqueletoTarjetaBase className="hidden sm:block" />
              <EsqueletoTarjetaBase className="hidden lg:block" />
            </div>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no hay destinos publicados"
              mensaje="Mientras tanto, conoce los nueve departamentos de Bolivia."
              accion={<Link to="/departamentos" className={claseBoton('secundario')}>Conoce los departamentos</Link>}
            />
          ) : (
            <Carrusel etiqueta={departamentoActivo ? `Destacados en ${departamentoActivo.nombre}` : 'Destinos destacados'}>
              {visibles.map((destino) => (
                <div key={destino.id || destino.nombre} className="w-[82%] shrink-0 snap-start sm:w-[340px] lg:w-[358px]">
                  <TarjetaDestino destino={destino} nivelTitulo="h3" />
                </div>
              ))}
              {departamentoActivo && (
                <Link
                  to={`/departamentos/${departamentoActivo.id}`}
                  className="group flex w-[82%] shrink-0 snap-start flex-col justify-center rounded-tarjeta border border-borde bg-sal-2 p-8 transition-colors hover:border-cobre sm:w-[300px]"
                >
                  <p className="titulo-display text-[32px]">Más sobre {departamentoActivo.nombre}</p>
                  <p className="mt-3 text-sm leading-6 text-piedra-texto">Municipios, dónde comer y dónde dormir en este departamento.</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-cielo-700">
                    Ver todos los destinos de {departamentoActivo.nombre}
                    <ArrowRight aria-hidden="true" size={18} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              )}
            </Carrusel>
          )}

          <div className="mt-6">
            <Link to="/destinos" className={claseBoton('secundario')}>
              Ver todos los destinos
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </section>

        {/* ---------- Recomendado para ti (solo con sesión) ---------- */}
        {usuario && (
          <div className="bg-sal-2 py-14 lg:py-24">
            <RecomendadoParaTi className={ANCHO} />
          </div>
        )}

        {/* ---------- 3. Próximos eventos ---------- */}
        {/* Sin "Recomendado para ti" en medio, esta sección sigue a Destacados
            sobre el mismo fondo: no repite el espacio de arriba. */}
        <section aria-labelledby="titulo-eventos" className={`${ANCHO} pb-14 lg:pb-24 ${usuario ? 'pt-14 lg:pt-24' : ''}`}>
          <EncabezadoSeccion
            id="titulo-eventos"
            antetitulo="Agenda"
            titulo="Próximos eventos y festividades"
            accion={
              <Link to="/eventos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-cielo-700 hover:underline">
                Ver todos los eventos
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            }
          />
          {cargandoExtras ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <EsqueletoTarjetaBase />
              <EsqueletoTarjetaBase className="hidden sm:block" />
              <EsqueletoTarjetaBase className="hidden lg:block" />
            </div>
          ) : eventos.length === 0 ? (
            <EstadoVacio
              icono={CalendarDays}
              titulo="No hay eventos próximos por ahora"
              mensaje="Pronto publicaremos nuevas fiestas y festivales. Revisa la agenda completa."
              accion={<Link to="/eventos" className={claseBoton('secundario')}>Ver la agenda</Link>}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {eventos.map((evento, indice) => <TarjetaEvento key={evento.id || evento.nombre} evento={evento} indice={indice} />)}
            </ul>
          )}
        </section>

        {/* ---------- 4. Gastronomía ---------- */}
        {(cargandoExtras || platos.length > 0) && (
          <section aria-labelledby="titulo-gastronomia" className="bg-sal-2 py-14 lg:py-24">
            <div className={ANCHO}>
              <EncabezadoSeccion
                id="titulo-gastronomia"
                antetitulo="Sabores de Bolivia"
                titulo="Gastronomía típica"
                descripcion="Cada región tiene su plato: del silpancho cochabambino al majadito de los llanos."
                accion={
                  <Link to="/gastronomia" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-cielo-700 hover:underline">
                    Ver todos los platos
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                }
              />
              {cargandoExtras ? (
                <div className="grid grid-cols-2 gap-4 lg:h-[520px] lg:grid-cols-4 lg:grid-rows-2">
                  <div className="col-span-2 aspect-[4/3] animate-pulse rounded-tarjeta bg-white lg:row-span-2 lg:aspect-auto" />
                  {Array.from({ length: 4 }).map((_, indice) => <div key={indice} className="aspect-square animate-pulse rounded-tarjeta bg-white lg:aspect-auto" />)}
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-4 lg:h-[520px] lg:grid-cols-4 lg:grid-rows-2">
                  {platos.map((plato, indice) => (
                    <Aparecer
                      key={plato.id || plato.nombre}
                      como="li"
                      indice={indice}
                      className={indice === 0 ? 'col-span-2 aspect-[4/3] lg:row-span-2 lg:aspect-auto' : 'aspect-square lg:aspect-auto'}
                    >
                      <Link to="/gastronomia" title={plato.credito_imagen || undefined} className="group relative block h-full overflow-hidden rounded-tarjeta bg-noche">
                        <ImagenSegura src={plato.imagen} alt={plato.nombre} loading="lazy" decoding="async" className="zoom-foto h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noche/85 via-noche/40 to-transparent px-4 pb-4 pt-12 text-white">
                          <h3 className={`font-bold leading-tight ${indice === 0 ? 'text-2xl tracking-tight sm:text-[28px]' : 'text-base sm:text-lg'}`}>{plato.nombre}</h3>
                          {plato.origen && <p className="mt-0.5 text-sm text-white/85">{plato.origen}</p>}
                        </div>
                      </Link>
                    </Aparecer>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ---------- 5. Arma tu viaje ---------- */}
        <section aria-labelledby="titulo-viaje" className={`${ANCHO} pt-14 lg:pt-24`}>
          <div className="grid items-center gap-8 overflow-hidden rounded-tarjeta border border-borde bg-white p-5 sm:p-8 lg:grid-cols-2 lg:gap-14 lg:p-12">
            <div>
              <p className="rotulo mb-3">Mis viajes</p>
              <h2 id="titulo-viaje" className="titulo-display text-[38px] sm:text-[50px]">Arma tu viaje</h2>
              <p className="texto-lectura mt-3 text-lg text-piedra-texto">Junta en un solo lugar todo lo que quieres conocer y llega con el recorrido listo.</p>
              <ol className="mt-8 divide-y divide-borde border-y border-borde">
                {PASOS_DEL_VIAJE.map(({ icono: Icono, texto }, indice) => (
                  <li key={texto} className="flex items-center gap-4 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true">
                      <Icono size={18} />
                    </span>
                    <p className="text-base text-noche">
                      <span className="sr-only">Paso {indice + 1}: </span>
                      {texto}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={usuario ? '/viajes' : '/registro'} className={claseBoton('primario')}>
                  {usuario ? 'Ir a mis viajes' : 'Crear mi cuenta gratis'}
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link to="/destinos" className={claseBoton('fantasma')}>Explorar destinos</Link>
              </div>
            </div>
            <figure className="relative">
              <img src={FOTO_SALAR} alt="El cielo reflejado en el Salar de Uyuni" loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-imagen object-cover lg:aspect-[4/5]" />
              <figcaption className="mt-2 text-xs text-piedra-texto">{CREDITO_FOTO_SALAR}</figcaption>
            </figure>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Inicio
