import { Images } from 'lucide-react'
import ImagenSegura from './ImagenSegura.jsx'

const MAXIMO_EN_MOSAICO = 5

// Mosaico de fotos arriba del detalle. En celular se ve la foto principal y
// un botón con la cantidad; en escritorio, la principal grande y 4 más chicas.
function GaleriaMosaico({ fotos, nombre, credito, alAbrir }) {
  const visibles = fotos.slice(0, MAXIMO_EN_MOSAICO)
  const unaSola = visibles.length === 1
  const chicas = visibles.length - 1
  // Las fotos chicas llenan las 4 casillas de la derecha sin dejar huecos.
  function claseChica(indice) {
    if (chicas === 1) return 'sm:col-span-2 sm:row-span-2'
    if (chicas === 2) return 'sm:col-span-2'
    if (chicas === 3 && indice === 3) return 'sm:col-span-2'
    return ''
  }
  return (
    <section aria-label={`Fotos de ${nombre}`}>
      <div className={`grid gap-2 overflow-hidden rounded-tarjeta sm:h-[440px] ${unaSola ? '' : 'sm:grid-cols-4 sm:grid-rows-2'}`}>
        {visibles.map((url, indice) => (
          <button
            key={url + indice}
            type="button"
            onClick={() => alAbrir(indice)}
            aria-label={`Ampliar foto ${indice + 1} de ${fotos.length}`}
            className={`group relative overflow-hidden bg-sal-2 ${indice === 0 ? `aspect-[4/3] sm:aspect-auto ${unaSola ? '' : 'sm:col-span-2 sm:row-span-2'}` : `hidden sm:block ${claseChica(indice)}`}`}
          >
            <ImagenSegura
              key={url}
              src={url}
              alt={indice === 0 ? nombre : `${nombre}, foto ${indice + 1}`}
              loading={indice === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {credito ? <p className="text-xs text-piedra-texto">{credito}</p> : <span />}
        {fotos.length > 1 && (
          <button type="button" onClick={() => alAbrir(0)} className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-bold text-cielo-700 hover:bg-sal-2">
            <Images aria-hidden="true" size={18} />
            Ver las {fotos.length} fotos
          </button>
        )}
      </div>
    </section>
  )
}

export default GaleriaMosaico
