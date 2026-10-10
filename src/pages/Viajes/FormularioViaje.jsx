import { useState } from 'react'
import { LARGO_MAXIMO_NOMBRE, LARGO_MAXIMO_NOTAS, validarDatosDeViaje } from '../../services/viajesService.js'

const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30'

// Nombre, fechas y notas de un viaje. Se usa para crear y para editar.
// onGuardar(datos) debe lanzar un Error con un mensaje amable si algo falla.
function FormularioViaje({ inicial = {}, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: inicial.nombre || '',
    fecha_inicio: inicial.fecha_inicio || '',
    fecha_fin: inicial.fecha_fin || '',
    notas: inicial.notas || '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function cambiar(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    const mensaje = validarDatosDeViaje(datos)
    if (mensaje) {
      setError(mensaje)
      return
    }
    setError('')
    setGuardando(true)
    try {
      await onGuardar(datos)
    } catch (errorGuardado) {
      console.error('Error al guardar el viaje:', errorGuardado)
      setError(errorGuardado.message || 'No se pudo guardar el viaje. Inténtalo de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      <label className="block text-sm font-semibold text-slate-700">
        Nombre del viaje
        <input name="nombre" value={datos.nombre} onChange={cambiar} maxLength={LARGO_MAXIMO_NOMBRE} placeholder="Ej.: Ruta del salar y las lagunas" className={CLASE_CAMPO} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Fecha de salida (opcional)
          <input name="fecha_inicio" type="date" value={datos.fecha_inicio} onChange={cambiar} className={CLASE_CAMPO} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Fecha de regreso (opcional)
          <input name="fecha_fin" type="date" min={datos.fecha_inicio || undefined} value={datos.fecha_fin} onChange={cambiar} className={CLASE_CAMPO} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-slate-700">
        Notas (opcional)
        <textarea name="notas" value={datos.notas} onChange={cambiar} rows={3} maxLength={LARGO_MAXIMO_NOTAS} placeholder="Presupuesto, con quién vas, qué no te puedes olvidar..." className={CLASE_CAMPO} />
      </label>
      <div className="flex flex-wrap gap-3">
        <button disabled={guardando} className="flex-1 rounded-xl boton-principal px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60">
          {guardando ? 'Guardando...' : textoBoton}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="rounded-xl border border-sky-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default FormularioViaje
