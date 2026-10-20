import ClimaActual from '../../components/ClimaActual.jsx'
import { coordenadasValidas } from '../../utils/geo.js'

const ICONO_DE_MEDIO = { bus: '🚌', avión: '✈️', avion: '✈️', tren: '🚆', lancha: '⛴️', bote: '🛶', teleférico: '🚡', teleferico: '🚡', taxi: '🚕', minibús: '🚐', minibus: '🚐', micro: '🚌', 'a pie': '🚶', tour: '🚙', movilidad: '🚙' }

function iconoDe(medio = '') {
  const clave = medio.toLocaleLowerCase('es')
  const encontrado = Object.keys(ICONO_DE_MEDIO).find((nombre) => clave.includes(nombre))
  return encontrado ? ICONO_DE_MEDIO[encontrado] : '🧭'
}

function SinDatos({ texto }) {
  return <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-piedra-texto">{texto}</p>
}

function Bloque({ titulo, children }) {
  return (
    <div className="rounded-2xl p-5 cristal">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cobre-texto">{titulo}</h3>
      {children}
    </div>
  )
}

// HU-21 "Cómo llegar" y HU-22 "Antes de ir". Si un destino no tiene un dato
// cargado se dice claramente, en vez de dejar el espacio vacío.
function InfoPractica({ destino }) {
  const transportes = Array.isArray(destino.transportes) ? destino.transportes.filter((item) => item.medio) : []
  const consejos = Array.isArray(destino.consejos) ? destino.consejos : []
  const normas = Array.isArray(destino.normas) ? destino.normas : []
  const tieneCoordenadas = coordenadasValidas(destino.latitud, destino.longitud)

  return (
    <>
      <section className="mb-10" aria-labelledby="titulo-como-llegar">
        <h2 id="titulo-como-llegar" className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Cómo llegar</h2>
        {destino.como_llegar && <p className="mb-4 text-noche/80">{destino.como_llegar}</p>}
        {transportes.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {transportes.map((transporte, indice) => (
              <li key={`${transporte.medio}-${transporte.desde}-${indice}`} className="flex gap-3 rounded-2xl p-4 cristal">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cielo/50 text-2xl" aria-hidden="true">{iconoDe(transporte.medio)}</span>
                <div>
                  <p className="font-bold text-noche">
                    {transporte.medio}{transporte.desde ? ` desde ${transporte.desde}` : ''}
                  </p>
                  {transporte.tiempo && <p className="text-sm font-semibold text-cielo-700">⏱ {transporte.tiempo} aprox.</p>}
                  {transporte.detalle && <p className="mt-1 text-sm text-piedra-texto">{transporte.detalle}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !destino.como_llegar && <SinDatos texto="Todavía no tenemos información de transporte para este destino. Consulta en la terminal de buses o en una agencia local." />
        )}
      </section>

      <section className="mb-10" aria-labelledby="titulo-antes-de-ir">
        <h2 id="titulo-antes-de-ir" className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cobre-texto">Antes de ir</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Bloque titulo="Clima">
            {tieneCoordenadas && <ClimaActual latitud={Number(destino.latitud)} longitud={Number(destino.longitud)} />}
            {destino.clima_tipico
              ? <p className={`text-sm text-noche/80 ${tieneCoordenadas ? 'mt-3 border-t border-white/80 pt-3' : ''}`}><span className="font-semibold">Clima típico:</span> {destino.clima_tipico}</p>
              : !tieneCoordenadas && <SinDatos texto="Sin información del clima para este destino." />}
          </Bloque>

          <Bloque titulo="Horarios y mejor época">
            <p className="text-sm text-noche/80"><span className="font-semibold">Horario:</span> {destino.horario || 'No informado.'}</p>
            <p className="mt-2 text-sm text-noche/80"><span className="font-semibold">Mejor época:</span> {destino.mejor_epoca || 'No informada.'}</p>
          </Bloque>

          <Bloque titulo="Consejos">
            {consejos.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-noche/80">
                {consejos.map((consejo) => <li key={consejo} className="flex gap-2"><span aria-hidden="true">💡</span>{consejo}</li>)}
              </ul>
            ) : <SinDatos texto="Aún no hay consejos cargados." />}
          </Bloque>

          <Bloque titulo="Normas del lugar">
            {normas.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-noche/80">
                {normas.map((norma) => <li key={norma} className="flex gap-2"><span aria-hidden="true">📋</span>{norma}</li>)}
              </ul>
            ) : <SinDatos texto="No hay normas especiales registradas. Respeta siempre el lugar y a las comunidades." />}
          </Bloque>

          <div className="md:col-span-2">
            <Bloque titulo="Seguridad">
              <p className="flex gap-2 text-sm text-noche/80">
                <span aria-hidden="true">🛡️</span>
                {destino.seguridad || 'No hay avisos de seguridad para este destino. Como en todo viaje, cuida tus pertenencias y viaja con seguro.'}
              </p>
            </Bloque>
          </div>
        </div>
      </section>
    </>
  )
}

export default InfoPractica
