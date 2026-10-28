import { useState } from 'react'
import { ArrowRight, Heart, MapPin, Plus, Route, Star } from 'lucide-react'
import { categoriasDeEjemplo, destinosDeEjemplo } from '../../services/datosDeEjemplo.js'
import {
  Aparecer,
  Boton,
  Buscador,
  Campo,
  Chip,
  ChipCategoria,
  EstadoVacio,
  EsqueletoTarjetaBase,
  ImagenTarjeta,
  Tarjeta,
} from '../../components/ui'

// Muestrario de la Fase 1 del rediseño (tokens y componentes base).
// Solo existe en desarrollo (npm run dev → /guia-de-estilo); no se publica.

const COLORES_PUBLICOS = [
  ['sal', '#FAFAF7', 'Fondo principal'],
  ['sal-2', '#F2F0EA', 'Secciones alternas'],
  ['cielo', '#E8EEF2', 'Fondos azules muy suaves'],
  ['cielo-600', '#6F8BA1', 'Acentos azules discretos'],
  ['piedra', '#7A8B99', 'Bordes fuertes, iconos'],
  ['noche', '#0E2233', 'Texto y títulos'],
  ['cobre', '#B88A5A', 'Detalles, separadores'],
  ['atardecer', '#E07A4F', 'Acento: corazón, iconos'],
  ['atardecer-hover', '#C9653B', 'Hover del acento'],
  ['borde', '#E4E2DC', 'Bordes de tarjetas'],
]

const COLORES_TEXTO = [
  ['piedra-texto', '#5D6D7A', 'Texto secundario · 5.1:1'],
  ['cielo-700', '#3F6A8F', 'Enlaces · 5.5:1'],
  ['cobre-texto', '#8A6339', 'Rótulos cobre · 5.1:1'],
  ['atardecer-700', '#B4532A', 'Botón primario · 5.0:1 con blanco'],
]

const COLORES_ADMIN = [
  ['panel-fondo', '#F5F6F5'],
  ['panel-superficie', '#FFFFFF'],
  ['panel-borde', '#E1E5E7'],
  ['panel-texto', '#26343D'],
  ['panel-muted', '#667680'],
  ['panel-azul', '#486C86'],
  ['panel-azul-suave', '#EDF3F6'],
  ['atardecer', '#E07A4F'],
  ['cobre', '#B88A5A'],
  ['ok', '#5BBF8A'],
  ['alerta', '#E8B44C'],
  ['error', '#E05A5A'],
]

function Muestra({ nombre, hex, uso, oscuro = false }) {
  return (
    <li className="overflow-hidden rounded-control border border-borde bg-white">
      <div className="h-16" style={{ backgroundColor: hex }} />
      <div className={`px-3 py-2 ${oscuro ? 'bg-admin-bg text-admin-texto' : ''}`}>
        <p className="text-sm font-bold">{nombre}</p>
        <p className={`text-xs ${oscuro ? 'text-admin-muted' : 'text-piedra-texto'}`}>{hex}{uso ? ` · ${uso}` : ''}</p>
      </div>
    </li>
  )
}

function Seccion({ titulo, children, alterna = false }) {
  return (
    <section className={`py-14 sm:py-20 ${alterna ? 'bg-sal-2' : ''}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <h2 className="mb-8 font-ui text-[22px] font-bold text-noche">{titulo}</h2>
        {children}
      </div>
    </section>
  )
}

function TarjetaDeMuestra({ destino, indice }) {
  return (
    <Aparecer como="li" indice={indice}>
      <Tarjeta como="article" interactiva className="h-full p-3">
        <ImagenTarjeta src={destino.imagen_principal} alt={destino.nombre}>
          <button
            type="button"
            aria-label={`Guardar ${destino.nombre} en favoritos`}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-atardecer shadow-suave transition hover:scale-105"
          >
            <Heart aria-hidden="true" />
          </button>
        </ImagenTarjeta>
        <div className="px-2 pb-2 pt-4">
          <h3 className="text-lg font-bold text-noche">{destino.nombre}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-piedra-texto">
            <MapPin aria-hidden="true" size={16} className="text-piedra" />
            {destino.ubicacion}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <ChipCategoria nombre={destino.categoria} tamano="pequeno" />
            <span className="flex items-center gap-1 text-sm font-bold text-noche">
              <Star aria-hidden="true" size={16} className="fill-atardecer text-atardecer" />
              4.8
            </span>
          </div>
          <p className="mt-3 text-sm text-piedra-texto">
            Ingreso: <span className="font-bold text-noche">{destino.precio_ingreso || 'Gratis'}</span>
          </p>
        </div>
      </Tarjeta>
    </Aparecer>
  )
}

function GuiaDeEstilo() {
  const [busqueda, setBusqueda] = useState('')
  const [buscado, setBuscado] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Naturaleza')
  const [filtros, setFiltros] = useState(['Cochabamba', 'Gratis', 'Naturaleza'])
  const [nombre, setNombre] = useState('')

  return (
    <main className="min-h-screen bg-sal font-ui text-noche">
      <header className="mx-auto max-w-6xl px-4 pb-6 pt-14 sm:px-8 sm:pt-20">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-cobre-texto">Fase 1 · Tokens y base</p>
        <h1 className="titulo-display text-4xl sm:text-[56px]">Salar cálido</h1>
        <p className="texto-lectura mt-4 text-lg text-piedra-texto">
          Muestrario de los colores, tipografías y componentes base del rediseño. Las páginas del sitio todavía no los
          usan: se irán pasando una por una en las próximas fases.
        </p>
      </header>

      <Seccion titulo="Colores del sitio público">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COLORES_PUBLICOS.map(([n, hex, uso]) => <Muestra key={n} nombre={n} hex={hex} uso={uso} />)}
        </ul>
        <h3 className="mb-3 mt-10 text-lg font-bold">Variantes para texto (contraste AA)</h3>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {COLORES_TEXTO.map(([n, hex, uso]) => <Muestra key={n} nombre={n} hex={hex} uso={uso} />)}
        </ul>
      </Seccion>

      <Seccion titulo="Tipografía" alterna>
        <div className="space-y-6">
          <p className="titulo-display text-[40px] sm:text-[56px]">Descubre Bolivia</p>
          <p className="titulo-display text-[40px]">Destacados en Cochabamba</p>
          <p className="text-[28px] font-bold">Hanken Grotesk 28 · subtítulo</p>
          <p className="text-[22px] font-bold">Hanken Grotesk 22 · título de tarjeta grande</p>
          <p className="text-lg font-medium">Hanken Grotesk 18 · texto destacado</p>
          <p className="texto-lectura text-base">
            Hanken Grotesk 16 · cuerpo. El Salar de Uyuni es el desierto de sal más grande del mundo. En época de lluvias se
            convierte en un espejo que refleja el cielo, y en época seca muestra un suelo blanco de hexágonos de sal.
          </p>
          <p className="text-sm text-piedra-texto">Hanken Grotesk 14 · texto secundario y etiquetas</p>
        </div>
      </Seccion>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Boton icono={Plus}>Agregar a mi viaje</Boton>
          <Boton variante="secundario" icono={Heart}>Guardar</Boton>
          <Boton variante="fantasma" iconoFinal={ArrowRight}>Ver todos</Boton>
          <Boton variante="secundario" tamano="pequeno">Pequeño</Boton>
          <Boton disabled>Deshabilitado</Boton>
        </div>
        <p className="mt-4 text-sm text-piedra-texto">Regla: un solo botón primario (relleno) por vista.</p>
      </Seccion>

      <Seccion titulo="Chips" alterna>
        <h3 className="mb-3 text-sm font-bold text-piedra-texto">Categorías (toca para elegir)</h3>
        <div className="flex flex-wrap gap-2">
          {categoriasDeEjemplo.map((categoria) => (
            <ChipCategoria
              key={categoria.id}
              nombre={categoria.nombre}
              activo={categoriaActiva === categoria.nombre}
              onClick={() => setCategoriaActiva(categoria.nombre)}
            />
          ))}
        </div>
        <h3 className="mb-3 mt-8 text-sm font-bold text-piedra-texto">Filtros activos (se pueden quitar)</h3>
        <div className="flex flex-wrap gap-2">
          {filtros.length === 0 && <p className="text-sm text-piedra-texto">Sin filtros.</p>}
          {filtros.map((filtro) => (
            <Chip key={filtro} activo onQuitar={() => setFiltros((lista) => lista.filter((item) => item !== filtro))}>
              {filtro}
            </Chip>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Buscador y campos">
        <Buscador valor={busqueda} alCambiar={setBusqueda} alBuscar={setBuscado} className="max-w-2xl" />
        <p className="mt-3 min-h-6 text-sm text-piedra-texto" aria-live="polite">{buscado && `Buscarías: "${buscado}"`}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Nombre del viaje" placeholder="Ej.: Vacaciones en el altiplano" value={nombre} onChange={(e) => setNombre(e.target.value)} ayuda="Hasta 80 caracteres." />
          <Campo etiqueta="Departamento" como="select" defaultValue="cochabamba">
            <option value="cochabamba">Cochabamba</option>
            <option value="la-paz">La Paz</option>
            <option value="potosi">Potosí</option>
          </Campo>
          <Campo etiqueta="Correo" type="email" defaultValue="correo-sin-arroba" error="Escribe un correo válido, por ejemplo ana@correo.com." />
          <Campo etiqueta="Notas" como="textarea" placeholder="¿Qué no te puedes olvidar?" />
        </div>
      </Seccion>

      <Seccion titulo="Tarjetas (con entrada al hacer scroll)" alterna>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinosDeEjemplo.slice(0, 3).map((destino, indice) => <TarjetaDeMuestra key={destino.id} destino={destino} indice={indice} />)}
        </ul>
        <h3 className="mb-3 mt-10 text-sm font-bold text-piedra-texto">Cargando (skeleton)</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <EsqueletoTarjetaBase />
          <EsqueletoTarjetaBase className="hidden sm:block" />
          <EsqueletoTarjetaBase className="hidden lg:block" />
        </div>
      </Seccion>

      <Seccion titulo="Estado vacío">
        <EstadoVacio
          icono={Heart}
          titulo="Aún no guardaste destinos"
          mensaje="Explora y toca el ♥ en los lugares que te gusten para encontrarlos aquí."
          accion={<Boton variante="secundario" icono={Route}>Explorar destinos</Boton>}
        />
      </Seccion>

      <section className="fondo-admin py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <h2 className="mb-2 text-[22px] font-bold text-panel-texto">Panel de administración</h2>
          <p className="mb-8 text-panel-muted">Vista previa de superficies, tonos y métricas del panel.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Destinos', 24, 'bg-atardecer', '72%'], ['Usuarios', 318, 'bg-cielo-claro', '54%'], ['Reseñas', 96, 'bg-cobre', '40%'], ['Favoritos', 412, 'bg-ok', '86%']].map(([etiqueta, valor, color, ancho]) => (
              <div key={etiqueta} className="vidrio rounded-tarjeta p-5 text-panel-texto">
                <p className="flex items-center gap-2 text-sm text-panel-muted">
                  <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
                  {etiqueta}
                </p>
                <p className="mt-2 text-[28px] font-bold">{valor}</p>
                <div className="mt-3 h-1.5 rounded-full bg-panel-azul-suave" aria-hidden="true">
                  <div className={`h-full rounded-full ${color}`} style={{ width: ancho }} />
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {COLORES_ADMIN.map(([n, hex]) => <Muestra key={n} nombre={n} hex={hex} />)}
          </ul>
        </div>
      </section>
    </main>
  )
}

export default GuiaDeEstilo
