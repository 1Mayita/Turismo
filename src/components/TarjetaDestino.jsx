import { Link } from 'react-router-dom'

// Tarjeta reutilizable para mostrar un destino en cualquier listado (catálogo,
// departamento, destacados de inicio).
function TarjetaDestino({ destino }) {
  const Contenedor = destino.id ? Link : 'div'
  const props = destino.id ? { to: `/destinos/${destino.id}` } : {}

  return (
    <Contenedor
      {...props}
      className="group block overflow-hidden rounded-2xl bg-white shadow-lg shadow-brand-950/10 ring-1 ring-brand-900/5 transition hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-900/20"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={destino.imagen_principal}
          alt={destino.nombre}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-800 shadow-sm">
          {destino.precio_entrada > 0 ? `Bs ${destino.precio_entrada}` : 'Entrada libre'}
        </span>
      </div>
      <div className="p-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent-600">{destino.categoria}</p>
        <h2 className="text-2xl font-bold text-brand-900">{destino.nombre}</h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-brand-700">
          <span aria-hidden="true">📍</span> {destino.ubicacion}
        </p>
        {destino.descripcion && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{destino.descripcion}</p>}
      </div>
    </Contenedor>
  )
}

export default TarjetaDestino
