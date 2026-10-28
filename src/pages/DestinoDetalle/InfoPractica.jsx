import {
  Bus,
  CableCar,
  Car,
  CarTaxiFront,
  ClipboardList,
  Clock,
  CloudSun,
  Compass,
  Footprints,
  Lightbulb,
  Plane,
  Sailboat,
  ShieldCheck,
  Ship,
  TrainFront,
} from 'lucide-react'
import ClimaActual from '../../components/ClimaActual.jsx'
import TituloSeccion from '../../components/ui/TituloSeccion.jsx'
import { coordenadasValidas } from '../../utils/geo.js'

const ICONO_DE_MEDIO = {
  bus: Bus, avión: Plane, avion: Plane, tren: TrainFront, lancha: Ship, bote: Sailboat,
  teleférico: CableCar, teleferico: CableCar, taxi: CarTaxiFront, minibús: Bus, minibus: Bus,
  micro: Bus, 'a pie': Footprints, tour: Car, movilidad: Car,
}

function iconoDe(medio = '') {
  const clave = medio.toLocaleLowerCase('es')
  const encontrado = Object.keys(ICONO_DE_MEDIO).find((nombre) => clave.includes(nombre))
  return encontrado ? ICONO_DE_MEDIO[encontrado] : Compass
}

function SinDatos({ texto }) {
  return <p className="rounded-control bg-sal-2 px-4 py-3 text-sm text-piedra-texto">{texto}</p>
}

function Bloque({ titulo, icono: Icono, children }) {
  return (
    <div className="h-full rounded-tarjeta border border-borde bg-white p-5 shadow-suave">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-noche">
        <Icono aria-hidden="true" size={18} className="text-cielo-700" />
        {titulo}
      </h3>
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
      <section className="mb-14" aria-labelledby="titulo-como-llegar">
        <TituloSeccion id="titulo-como-llegar">Cómo llegar</TituloSeccion>
        {destino.como_llegar && <p className="texto-lectura mb-5 text-noche/85">{destino.como_llegar}</p>}
        {transportes.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {transportes.map((transporte, indice) => {
              const Icono = iconoDe(transporte.medio)
              return (
                <li key={`${transporte.medio}-${transporte.desde}-${indice}`} className="flex gap-3 rounded-tarjeta border border-borde bg-white p-4 shadow-suave">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cielo text-cielo-700" aria-hidden="true">
                    <Icono />
                  </span>
                  <div>
                    <p className="font-bold text-noche">
                      {transporte.medio}{transporte.desde ? ` desde ${transporte.desde}` : ''}
                    </p>
                    {transporte.tiempo && (
                      <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-atardecer-texto">
                        <Clock aria-hidden="true" size={14} /> {transporte.tiempo} aprox.
                      </p>
                    )}
                    {transporte.detalle && <p className="mt-1 text-sm text-piedra-texto">{transporte.detalle}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          !destino.como_llegar && <SinDatos texto="Todavía no tenemos información de transporte para este destino. Consulta en la terminal de buses o en una agencia local." />
        )}
      </section>

      <section className="mb-14" aria-labelledby="titulo-antes-de-ir">
        <TituloSeccion id="titulo-antes-de-ir">Antes de ir</TituloSeccion>
        <div className="grid gap-4 md:grid-cols-2">
          <Bloque titulo="Clima" icono={CloudSun}>
            {tieneCoordenadas && <ClimaActual latitud={Number(destino.latitud)} longitud={Number(destino.longitud)} />}
            {destino.clima_tipico
              ? <p className={`text-sm text-noche/80 ${tieneCoordenadas ? 'mt-3 border-t border-borde pt-3' : ''}`}><span className="font-bold">Clima típico:</span> {destino.clima_tipico}</p>
              : !tieneCoordenadas && <SinDatos texto="Sin información del clima para este destino." />}
          </Bloque>

          <Bloque titulo="Horarios y mejor época" icono={Clock}>
            <p className="text-sm text-noche/80"><span className="font-bold">Horario:</span> {destino.horario || 'No informado.'}</p>
            <p className="mt-2 text-sm text-noche/80"><span className="font-bold">Mejor época:</span> {destino.mejor_epoca || 'No informada.'}</p>
          </Bloque>

          <Bloque titulo="Consejos" icono={Lightbulb}>
            {consejos.length > 0 ? (
              <ul className="space-y-2 text-sm text-noche/80">
                {consejos.map((consejo) => (
                  <li key={consejo} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-atardecer" aria-hidden="true" />
                    {consejo}
                  </li>
                ))}
              </ul>
            ) : <SinDatos texto="Aún no hay consejos cargados." />}
          </Bloque>

          <Bloque titulo="Normas del lugar" icono={ClipboardList}>
            {normas.length > 0 ? (
              <ul className="space-y-2 text-sm text-noche/80">
                {normas.map((norma) => (
                  <li key={norma} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cielo-600" aria-hidden="true" />
                    {norma}
                  </li>
                ))}
              </ul>
            ) : <SinDatos texto="No hay normas especiales registradas. Respeta siempre el lugar y a las comunidades." />}
          </Bloque>

          <div className="md:col-span-2">
            <Bloque titulo="Seguridad" icono={ShieldCheck}>
              <p className="text-sm text-noche/80">
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
