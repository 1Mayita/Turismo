import { useEffect, useState } from 'react'

// Clima actual y de los próximos días con Open-Meteo (https://open-meteo.com):
// es gratuito, no pide clave ni registro y permite llamadas desde el navegador.
const DESCRIPCIONES = [
  [[0], '☀️', 'Despejado'],
  [[1, 2], '🌤️', 'Parcialmente nublado'],
  [[3], '☁️', 'Nublado'],
  [[45, 48], '🌫️', 'Niebla'],
  [[51, 53, 55, 56, 57], '🌦️', 'Llovizna'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', 'Lluvia'],
  [[71, 73, 75, 77, 85, 86], '🌨️', 'Nieve'],
  [[95, 96, 99], '⛈️', 'Tormenta'],
]

function describir(codigo) {
  const encontrado = DESCRIPCIONES.find(([codigos]) => codigos.includes(codigo))
  return encontrado ? { icono: encontrado[1], texto: encontrado[2] } : { icono: '🌡️', texto: 'Sin datos' }
}

function ClimaActual({ latitud, longitud }) {
  const [clima, setClima] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const control = new AbortController()
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}`
      + '&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min'
      + '&timezone=auto&forecast_days=3'
    fetch(url, { signal: control.signal })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : Promise.reject(new Error(`HTTP ${respuesta.status}`))))
      .then(setClima)
      .catch((errorClima) => {
        if (errorClima.name !== 'AbortError') {
          console.error('Error al consultar el clima:', errorClima)
          setError(true)
        }
      })
    return () => control.abort()
  }, [latitud, longitud])

  if (error) return <p className="text-sm text-piedra-texto">No pudimos consultar el clima en este momento.</p>
  if (!clima) return <div className="h-20 animate-pulse rounded-xl bg-sal-2" aria-label="Cargando el clima" />

  const ahora = describir(clima.current?.weather_code)
  const dias = (clima.daily?.time || []).map((fecha, indice) => ({
    fecha,
    ...describir(clima.daily.weather_code[indice]),
    maxima: Math.round(clima.daily.temperature_2m_max[indice]),
    minima: Math.round(clima.daily.temperature_2m_min[indice]),
  }))
  const nombreDia = (fecha, indice) => (indice === 0 ? 'Hoy' : new Date(`${fecha}T12:00:00`).toLocaleDateString('es-BO', { weekday: 'short' }))

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden="true">{ahora.icono}</span>
        <div>
          <p className="text-2xl font-extrabold text-noche">{Math.round(clima.current?.temperature_2m)} °C</p>
          <p className="text-sm text-piedra-texto">{ahora.texto} · viento {Math.round(clima.current?.wind_speed_10m)} km/h</p>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {dias.map((dia, indice) => (
          <li key={dia.fecha} className="rounded-xl bg-white/70 px-2 py-2 text-center text-xs">
            <p className="font-semibold capitalize text-noche/80">{nombreDia(dia.fecha, indice)}</p>
            <p className="text-lg" aria-label={dia.texto}>{dia.icono}</p>
            <p className="text-noche/80"><span className="font-bold">{dia.maxima}°</span> / {dia.minima}°</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-piedra-texto">Pronóstico de Open-Meteo.</p>
    </div>
  )
}

export default ClimaActual
