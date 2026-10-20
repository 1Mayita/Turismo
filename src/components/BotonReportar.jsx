import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CircleCheck, Flag } from 'lucide-react'
import Modal from './Modal.jsx'
import { claseBoton, claseControl, claseEtiqueta } from './ui/estilos.js'
import { useAuth } from '../context/useAuth.js'
import { LARGO_MAXIMO_DESCRIPCION, MOTIVOS, enviarReporte } from '../services/reportesService.js'

// "Reportar un problema" (HU-26) para destinos, restaurantes, alojamientos y eventos.
// tipo: 'destino' | 'restaurante' | 'alojamiento' | 'evento'; elemento: { id, nombre }.
function BotonReportar({ tipo, elemento, enlace, className = '' }) {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  function abrir() {
    if (!usuario) {
      navegar('/login', { state: { desde: ubicacion.pathname, aviso: 'Inicia sesión para reportar un problema.' } })
      return
    }
    setMotivo('')
    setDescripcion('')
    setError('')
    setEnviado(false)
    setAbierto(true)
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!motivo) {
      setError('Elige el motivo del reporte.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await enviarReporte({ usuario, tipo, elemento, enlace: enlace || ubicacion.pathname, motivo, descripcion })
      setEnviado(true)
    } catch (errorEnvio) {
      console.error('Error al enviar el reporte:', errorEnvio)
      // Los errores de validación propios ya traen un mensaje amable; los de Firestore traen "code".
      setError(errorEnvio.code ? 'No pudimos enviar el reporte. Inténtalo de nuevo en un momento.' : errorEnvio.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <button type="button" onClick={abrir} className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-piedra-texto underline-offset-2 transition hover:text-red-700 hover:underline ${className}`}>
        <Flag aria-hidden="true" size={16} /> Reportar un problema
      </button>
      {abierto && (
        <Modal titulo="Reportar un problema" onCerrar={() => setAbierto(false)}>
          <div className="p-6 sm:p-8">
            <h2 className="titulo-display pr-12 text-[32px]">Reportar un problema</h2>
            <p className="mt-1 text-sm text-piedra-texto">{elemento.nombre}</p>

            {enviado ? (
              <div className="mt-6 rounded-tarjeta bg-emerald-50 p-5 text-emerald-900" role="status">
                <p className="flex items-center gap-2 font-bold"><CircleCheck aria-hidden="true" size={20} /> ¡Gracias por avisarnos!</p>
                <p className="mt-1 text-sm">El equipo revisará tu reporte y corregirá la información si hace falta.</p>
                <button type="button" onClick={() => setAbierto(false)} className="mt-2 min-h-11 text-sm font-bold underline">Cerrar</button>
              </div>
            ) : (
              <form onSubmit={enviar} className="mt-6 space-y-5">
                {error && <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
                <fieldset>
                  <legend className={claseEtiqueta}>¿Qué problema encontraste?</legend>
                  <div className="space-y-2">
                    {MOTIVOS.map((item) => (
                      <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-borde px-4 py-2.5 transition hover:bg-sal-2 has-[:checked]:border-cielo-600 has-[:checked]:bg-cielo/50">
                        <input type="radio" name="motivo" value={item.id} checked={motivo === item.id} onChange={() => setMotivo(item.id)} className="h-4 w-4 accent-atardecer-700" />
                        <span className="text-sm text-noche">{item.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className={claseEtiqueta}>
                  Cuéntanos más (opcional)
                  <textarea
                    value={descripcion}
                    onChange={(evento) => setDescripcion(evento.target.value)}
                    rows={3}
                    maxLength={LARGO_MAXIMO_DESCRIPCION}
                    placeholder="Ej.: el horario cambió, ahora abren a las 9:00."
                    className={`${claseControl} mt-2 min-h-24 font-normal`}
                  />
                  <span className="mt-1 block text-right text-xs font-normal text-piedra-texto">{descripcion.length}/{LARGO_MAXIMO_DESCRIPCION}</span>
                </label>
                <button disabled={enviando} className={claseBoton('primario', 'normal', 'w-full')}>
                  {enviando ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

export default BotonReportar
