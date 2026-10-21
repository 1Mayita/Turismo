import { useRef, useState } from 'react'
import { subirImagenCloudinary } from '../services/cloudinaryService.js'
import ImagenSegura from './ImagenSegura.jsx'

function SelectorImagen({ valor = '', onChange, onUploading, multiple = false, etiqueta = 'Imagen', className = '' }) {
  const entrada = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const urls = multiple
    ? (Array.isArray(valor) ? valor : String(valor || '').split(/\r?\n/).filter(Boolean))
    : []

  async function seleccionar(evento) {
    const archivos = Array.from(evento.target.files || [])
    evento.target.value = ''
    if (!archivos.length) return

    setError('')
    setSubiendo(true)
    onUploading?.(true)
    try {
      const subidas = []
      for (const archivo of archivos) {
        try {
          subidas.push(await subirImagenCloudinary(archivo))
        } catch (errorSubida) {
          console.error('Error al subir imagen a Cloudinary:', errorSubida)
          setError(`${archivo.name}: ${errorSubida.message || 'No se pudo subir la imagen.'}`)
        }
      }
      if (subidas.length > 0) onChange(multiple ? [...new Set([...urls, ...subidas])] : subidas[0])
    } finally {
      setSubiendo(false)
      onUploading?.(false)
    }
  }

  function quitar(url) {
    onChange(urls.filter((imagen) => imagen !== url))
  }

  return (
    <div className={className}>
      <span className="block text-sm font-semibold text-slate-700">{etiqueta}</span>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          className="rounded-xl border border-sky-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {subiendo ? 'Subiendo imagen...' : multiple ? 'Elegir imágenes' : 'Elegir imagen'}
        </button>
        <span className="text-xs font-normal text-slate-500">JPG, PNG, WEBP o GIF · máximo 10 MB</span>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        onChange={seleccionar}
        className="sr-only"
        aria-label={etiqueta}
      />
      {error && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{error}</p>}
      {multiple ? (
        urls.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {urls.map((url) => (
              <div key={url} className="relative">
                <ImagenSegura src={url} alt="Imagen seleccionada" className="h-20 w-28 rounded-lg object-cover text-xs" />
                <button type="button" onClick={() => quitar(url)} aria-label="Quitar imagen" className="absolute -right-2 -top-2 rounded-full bg-red-700 px-2 py-1 text-xs font-bold text-white shadow">
                  ×
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        valor && <ImagenSegura src={valor} alt="Vista previa de la imagen" className="mt-3 h-24 max-w-48 rounded-xl object-cover" />
      )}
    </div>
  )
}

export default SelectorImagen
