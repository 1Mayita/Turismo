import { useState } from 'react'
import { Check, MapPin, Search } from 'lucide-react'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import SelectorImagen from '../../components/SelectorImagen.jsx'
import { claseBoton, claseControl, claseEtiqueta } from '../../components/ui/estilos.js'
import { LARGO_MAXIMO_RECUERDO, MAXIMO_FOTOS, hoyISO, validarRecuerdo } from '../../services/viajesService.js'
import { coincideConBusqueda } from '../../utils/texto.js'

const CLASE_CAMPO = `${claseControl} mt-1.5 font-normal`

// Elegir UN destino del catálogo (registro manual). Se guarda su id: los datos
// del destino no se copian.
function SelectorDestino({ destinos, valor, onChange }) {
  const [busqueda, setBusqueda] = useState('')
  const visibles = destinos
    .filter((destino) => coincideConBusqueda([destino.nombre, destino.ubicacion, destino.categoria], busqueda))
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
    .slice(0, 50)

  return (
    <fieldset>
      <legend className={claseEtiqueta}>Destino que visitaste</legend>
      <div className="overflow-hidden rounded-control border border-borde bg-white">
        <div className="relative border-b border-borde">
          <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-piedra" />
          <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar destino o lugar..." className={`${claseControl} rounded-none border-0 pl-10 text-sm focus:ring-0`} />
        </div>
        <ul className="max-h-56 overflow-y-auto p-1.5" role="radiogroup" aria-label="Destinos del catálogo">
          {visibles.map((destino) => {
            const elegido = valor?.id === destino.id
            return (
              <li key={destino.id}>
                <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors ${elegido ? 'bg-cielo/60' : 'hover:bg-sal-2'}`}>
                  <input type="radio" name="destino" checked={elegido} onChange={() => onChange(destino)} className="sr-only" />
                  <ImagenSegura src={destino.imagen_principal} alt="" loading="lazy" className="h-10 w-12 shrink-0 rounded-md object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-noche">{destino.nombre}</span>
                    {destino.ubicacion && <span className="block truncate text-xs text-piedra-texto">{destino.ubicacion}</span>}
                  </span>
                  {elegido && <Check aria-hidden="true" size={18} className="shrink-0 text-cielo-700" />}
                </label>
              </li>
            )
          })}
          {visibles.length === 0 && <li className="px-3 py-5 text-center text-sm text-piedra-texto">No encontramos destinos con “{busqueda}”.</li>}
        </ul>
      </div>
    </fieldset>
  )
}

// Formulario del recuerdo de un viaje realizado. Tres usos:
//   modo "manual":    registrar un viaje que ya se hizo (elige el destino)
//   modo "convertir": marcar un viaje planificado como realizado (elige qué paradas se visitaron)
//   modo "editar":    cambiar fecha, fotos y recuerdo (y el destino, si es manual)
// onGuardar(datos) debe lanzar un Error con mensaje amable si falla.
function FormularioRecuerdo({ modo, viaje, destinos, itemsDelViaje = [], textoBoton, onGuardar, onCancelar }) {
  const esManual = modo === 'manual' || (modo === 'editar' && viaje?.origen === 'manual')
  const destinoInicial = esManual && viaje ? destinos.find((destino) => destino.id === viaje.destinos_visitados?.[0]) || null : null
  const [datos, setDatos] = useState(() => ({
    destino: destinoInicial,
    fecha_visita: viaje?.fecha_visita || (modo === 'convertir' && viaje?.fecha_inicio && viaje.fecha_inicio <= hoyISO() ? viaje.fecha_inicio : ''),
    destinos_visitados: viaje?.destinos_visitados?.length ? viaje.destinos_visitados : itemsDelViaje.filter((item) => item.destino).map((item) => item.destino.id),
    fotos: Array.isArray(viaje?.fotos) ? viaje.fotos : [],
    recuerdo: viaje?.recuerdo || '',
  }))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(0)

  function alternarParada(id) {
    setDatos((actual) => ({
      ...actual,
      destinos_visitados: actual.destinos_visitados.includes(id) ? actual.destinos_visitados.filter((otro) => otro !== id) : [...actual.destinos_visitados, id],
    }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const paraValidar = esManual ? { ...datos, destinos_visitados: datos.destino ? [datos.destino.id] : [] } : datos
    const mensaje = esManual && !datos.destino ? 'Elige el destino que visitaste.' : validarRecuerdo(paraValidar)
    if (mensaje) {
      setError(mensaje)
      return
    }
    setError('')
    setGuardando(true)
    try {
      await onGuardar(datos)
    } catch (errorGuardado) {
      console.error('Error al guardar el viaje realizado:', errorGuardado)
      setError(errorGuardado.message || 'No se pudo guardar. Inténtalo de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <form noValidate onSubmit={enviar} className="space-y-5">
      {error && <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      {esManual && <SelectorDestino destinos={destinos} valor={datos.destino} onChange={(destino) => setDatos({ ...datos, destino })} />}

      {!esManual && itemsDelViaje.length > 0 && (
        <fieldset>
          <legend className={claseEtiqueta}>¿Qué destinos visitaste?</legend>
          <p className="mb-2 text-xs text-piedra-texto">Solo los marcados cuentan en tu historial y en las estadísticas.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {itemsDelViaje.filter((item) => item.destino).map(({ destino }) => {
              const marcado = datos.destinos_visitados.includes(destino.id)
              return (
                <li key={destino.id}>
                  <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-control border px-3 py-2 transition-colors ${marcado ? 'border-noche bg-cielo/40' : 'border-borde hover:bg-sal-2'}`}>
                    <input type="checkbox" checked={marcado} onChange={() => alternarParada(destino.id)} className="sr-only" />
                    <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${marcado ? 'border-noche bg-noche text-white' : 'border-borde bg-white'}`}>{marcado && <Check size={13} strokeWidth={3} />}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-noche">{destino.nombre}</span>
                      {destino.ubicacion && <span className="flex items-center gap-1 truncate text-xs text-piedra-texto"><MapPin aria-hidden="true" size={11} />{destino.ubicacion}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      <label className={`${claseEtiqueta} max-w-xs`}>
        {modo === 'convertir' ? 'Fecha real de la visita' : 'Fecha de la visita'}
        <input type="date" max={hoyISO()} value={datos.fecha_visita} onChange={(evento) => setDatos({ ...datos, fecha_visita: evento.target.value })} className={CLASE_CAMPO} />
      </label>

      <SelectorImagen
        multiple
        etiqueta={`Fotos del viaje (hasta ${MAXIMO_FOTOS})`}
        valor={datos.fotos}
        onUploading={(activo) => setSubiendo((cantidad) => cantidad + (activo ? 1 : -1))}
        onChange={(fotos) => setDatos((actual) => ({ ...actual, fotos: fotos.slice(0, MAXIMO_FOTOS) }))}
      />

      <label className={claseEtiqueta}>
        Tu recuerdo de la experiencia (opcional)
        <textarea
          value={datos.recuerdo}
          onChange={(evento) => setDatos({ ...datos, recuerdo: evento.target.value })}
          rows={4}
          maxLength={LARGO_MAXIMO_RECUERDO}
          placeholder="Lo que más te gustó, con quién fuiste, una anécdota para no olvidar..."
          className={CLASE_CAMPO}
        />
        <span className="mt-1 block text-right text-xs font-normal text-piedra-texto">{datos.recuerdo.length} / {LARGO_MAXIMO_RECUERDO}</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button disabled={guardando || subiendo > 0} className={claseBoton('primario', 'normal', 'flex-1')}>
          {guardando ? 'Guardando...' : subiendo > 0 ? 'Subiendo fotos...' : textoBoton}
        </button>
        {onCancelar && <button type="button" onClick={onCancelar} className={claseBoton('secundario')}>Cancelar</button>}
      </div>
    </form>
  )
}

export default FormularioRecuerdo
