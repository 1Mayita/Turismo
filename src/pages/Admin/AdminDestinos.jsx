import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import ImagenSegura from '../../components/ImagenSegura.jsx'
import SelectorImagen from '../../components/SelectorImagen.jsx'
import { publicarNovedad } from '../../services/notificacionesService.js'
import AdminNav from '../../components/AdminNav.jsx'
import { actualizarDestino, crearDestino, eliminarDestino, getDestinos } from '../../services/destinosService.js'
import { categoriasDeEjemplo, getCategorias } from '../../services/categoriasService.js'
import { departamentosDeEjemplo, getDepartamentos } from '../../services/departamentosService.js'
import { getMunicipios, municipiosDeEjemplo } from '../../services/municipiosService.js'
import { getRegiones, regionesDeEjemplo } from '../../services/regionesService.js'
import { actualizarDatosDeEjemplo, indexarAdministradoresPorCorreo } from '../../services/sembradoService.js'

// El mapa para marcar la ubicación (Leaflet) se descarga solo al abrir el formulario.
const SelectorUbicacion = lazy(() => import('../../components/mapa/SelectorUbicacion.jsx'))

// Transportes: una línea por opción con el formato "Medio | Desde | Tiempo | Detalle".
function transportesATexto(transportes) {
  return Array.isArray(transportes)
    ? transportes.map((item) => [item.medio, item.desde, item.tiempo, item.detalle].map((parte) => parte || '').join(' | ').replace(/( \| )+$/, '')).join('\n')
    : ''
}

function textoATransportes(texto) {
  return texto.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean).map((linea) => {
    const [medio = '', desde = '', tiempo = '', detalle = ''] = linea.split('|').map((parte) => parte.trim())
    return { medio, desde, tiempo, detalle }
  }).filter((item) => item.medio)
}

function lineasDe(texto) {
  return texto.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean)
}

// Convierte la lista del formulario en una lista de imágenes sin duplicados.
function listaDeUrls(texto) {
  return [...new Set(texto.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))]
}

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  categoria: '',
  id_departamento: '',
  id_municipio: '',
  id_region: '',
  direccion: '',
  latitud: '',
  longitud: '',
  horario: '',
  precio_ingreso: '',
  imagen_principal: '',
  imagenes: '',
  recomendaciones: '',
  destacado: false,
  como_llegar: '',
  transportes: '',
  mejor_epoca: '',
  clima_tipico: '',
  consejos: '',
  normas: '',
  seguridad: '',
}

function AdminDestinos() {
  const [destinos, setDestinos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [regiones, setRegiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [destinoEditando, setDestinoEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [subidasPendientes, setSubidasPendientes] = useState(0)
  const [actualizandoEjemplos, setActualizandoEjemplos] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true)
      setError('')
      try {
        const [destinosFirestore, categoriasFirestore, departamentosFirestore, municipiosFirestore, regionesFirestore] = await Promise.all([
          getDestinos(),
          getCategorias(),
          getDepartamentos(),
          getMunicipios(),
          getRegiones(),
        ])
        setDestinos(destinosFirestore)
        setCategorias(categoriasFirestore.length > 0 ? categoriasFirestore : categoriasDeEjemplo)
        setDepartamentos(departamentosFirestore.length > 0 ? departamentosFirestore : departamentosDeEjemplo)
        setMunicipios(municipiosFirestore.length > 0 ? municipiosFirestore : municipiosDeEjemplo)
        setRegiones(regionesFirestore.length > 0 ? regionesFirestore : regionesDeEjemplo)
      } catch (errorLectura) {
        console.error('Error al cargar datos en AdminDestinos:', errorLectura)
        setError('No se pudieron cargar los destinos. Verifica tu conexión con Firestore.')
      } finally {
        setCargando(false)
      }
    }

    cargarTodo()
  }, [version])

  function refrescar() {
    setVersion((valorAnterior) => valorAnterior + 1)
  }

  function abrirNuevo() {
    setDestinoEditando(null)
    setFormulario(FORMULARIO_VACIO)
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function abrirEditar(destino) {
    setDestinoEditando(destino)
    setFormulario({
      nombre: destino.nombre || '',
      descripcion: destino.descripcion || '',
      categoria: destino.categoria || '',
      id_departamento: destino.id_departamento || '',
      id_municipio: destino.id_municipio || '',
      id_region: destino.id_region || '',
      direccion: destino.direccion || '',
      latitud: destino.latitud ?? '',
      longitud: destino.longitud ?? '',
      horario: destino.horario || '',
      precio_ingreso: destino.precio_ingreso ?? '',
      imagen_principal: destino.imagen_principal || '',
      imagenes: (destino.imagenes || []).join('\n'),
      recomendaciones: destino.recomendaciones || '',
      como_llegar: destino.como_llegar || '',
      transportes: transportesATexto(destino.transportes),
      mejor_epoca: destino.mejor_epoca || '',
      clima_tipico: destino.clima_tipico || '',
      consejos: Array.isArray(destino.consejos) ? destino.consejos.join('\n') : '',
      normas: Array.isArray(destino.normas) ? destino.normas.join('\n') : '',
      seguridad: destino.seguridad || '',
      destacado: Boolean(destino.destacado),
    })
    setFormularioAbierto(true)
    setMensaje('')
    setError('')
  }

  function actualizarCampo(evento) {
    const { name, type, checked } = evento.target
    const value = type === 'checkbox' ? checked : evento.target.value
    // Al cambiar departamento o municipio se limpian los niveles de abajo.
    if (name === 'id_departamento') {
      setFormulario({ ...formulario, id_departamento: value, id_municipio: '', id_region: '' })
    } else if (name === 'id_municipio') {
      setFormulario({ ...formulario, id_municipio: value, id_region: '' })
    } else {
      setFormulario({ ...formulario, [name]: value })
    }
  }

  const municipiosDelDepartamento = municipios.filter((municipio) => municipio.id_departamento === formulario.id_departamento)
  const regionesDelMunicipio = regiones.filter((region) => region.id_municipio === formulario.id_municipio)

  async function guardar(evento) {
    evento.preventDefault()
    setError('')

    if (!formulario.nombre.trim() || !formulario.categoria || !formulario.id_departamento || !formulario.id_municipio) {
      setError('Nombre, categoría, departamento y municipio son obligatorios.')
      return
    }

    const departamento = departamentos.find((item) => item.id === formulario.id_departamento)
    const municipio = municipios.find((item) => item.id === formulario.id_municipio)

    // La imagen principal siempre va primera en la galería; si no se indicó
    // una, se usa la primera foto de la galería.
    const imagenPrincipal = formulario.imagen_principal.trim() || listaDeUrls(formulario.imagenes)[0] || ''
    const imagenes = listaDeUrls([imagenPrincipal, formulario.imagenes].join('\n'))
    const cambiaronLasFotos = destinoEditando && imagenes.join('|') !== (destinoEditando.imagenes || []).join('|')

    const datos = {
      ...formulario,
      nombre: formulario.nombre.trim(),
      imagen_principal: imagenPrincipal,
      imagenes,
      // El crédito pertenecía a las fotos anteriores.
      ...(cambiaronLasFotos ? { credito_imagenes: '' } : {}),
      // Texto legible para tarjetas y detalle; los filtros usan los id_*.
      ubicacion: [municipio?.nombre, departamento?.nombre].filter(Boolean).join(', '),
      precio_ingreso: Number(formulario.precio_ingreso) || 0,
      latitud: formulario.latitud === '' ? null : Number(formulario.latitud),
      longitud: formulario.longitud === '' ? null : Number(formulario.longitud),
      como_llegar: formulario.como_llegar.trim(),
      transportes: textoATransportes(formulario.transportes),
      mejor_epoca: formulario.mejor_epoca.trim(),
      clima_tipico: formulario.clima_tipico.trim(),
      consejos: lineasDe(formulario.consejos),
      normas: lineasDe(formulario.normas),
      seguridad: formulario.seguridad.trim(),
    }

    try {
      setGuardando(true)
      if (destinoEditando) {
        await actualizarDestino(destinoEditando.id, datos)
        setMensaje('Destino actualizado correctamente.')
      } else {
        const idNuevo = await crearDestino(datos)
        // Notifica a los turistas (si falla, el destino igual queda creado).
        await publicarNovedad({
          tipo: 'destino',
          titulo: `Nuevo destino: ${datos.nombre}`,
          mensaje: [datos.categoria, datos.ubicacion].filter(Boolean).join(' · '),
          enlace: `/destinos/${idNuevo}`,
          categoria: datos.categoria,
        }).catch((errorNovedad) => console.warn('No se publicó la notificación del destino:', errorNovedad))
        setMensaje('Destino creado y notificado a los turistas.')
      }
      setFormularioAbierto(false)
      refrescar()
    } catch (error) {
      console.error('Error al guardar destino:', error)
      setError('No se pudo guardar el destino. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(destino) {
    if (!window.confirm(`¿Eliminar el destino "${destino.nombre}"? Sus actividades, reseñas y favoritos quedarán sin destino. Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await eliminarDestino(destino.id)
      setMensaje('Destino eliminado.')
      refrescar()
    } catch (error) {
      console.error('Error al eliminar destino:', error)
      setError('No se pudo eliminar el destino.')
    }
  }

  async function cargarDatosDeEjemplo() {
    if (!window.confirm('Se cargarán los datos de ejemplo: departamentos (eslogan y portada), destinos, actividades, eventos, platos típicos, restaurantes y alojamientos, con sus fotos. Los registros de ejemplo se actualizan; lo que tú creaste no se toca. ¿Continuar?')) return
    setError('')
    setMensaje('')
    try {
      setActualizandoEjemplos(true)
      const { cargadas, fallidas } = await actualizarDatosDeEjemplo()
      // Con las reglas de seguridad ya publicadas este paso se rechaza (y ya
      // no hace falta): no debe impedir que se carguen los datos.
      await indexarAdministradoresPorCorreo().catch((errorIndice) => console.warn('No se indexaron los administradores:', errorIndice.code || errorIndice.message))
      const resumen = Object.entries(cargadas).map(([coleccion, cantidad]) => `${cantidad} ${coleccion}`).join(', ')
      if (resumen) setMensaje(`Datos de ejemplo cargados: ${resumen}.`)
      if (fallidas.length > 0) {
        setError(`No se pudieron cargar: ${fallidas.join(', ')}. Revisa que las reglas de Firestore publicadas incluyan esas colecciones y que tu cuenta sea administradora.`)
      }
      refrescar()
    } catch (errorEscritura) {
      console.error('Error al cargar los datos de ejemplo:', errorEscritura)
      setError('No se pudieron cargar los datos de ejemplo. Revisa tu conexión y que tu cuenta tenga permiso de escritura.')
    } finally {
      setActualizandoEjemplos(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="admin-layout contenedor max-w-6xl py-12">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Administración de destinos</h1>
        <AdminNav />

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {mensaje && <p className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800" role="status">{mensaje}</p>}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={abrirNuevo}
            className="rounded-xl boton-principal px-5 py-3 font-bold text-white transition"
          >
            Nuevo destino
          </button>
        </div>

        {formularioAbierto && (
          <form onSubmit={guardar} className="mb-8 space-y-4 rounded-2xl p-6 cristal">
            <h2 className="text-xl font-bold text-slate-900">{destinoEditando ? 'Editar destino' : 'Nuevo destino'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre
                <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Precio de entrada (Bs)
                <input name="precio_ingreso" type="number" min="0" value={formulario.precio_ingreso} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Categoría
                <select name="categoria" value={formulario.categoria} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30">
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id || categoria.nombre} value={categoria.nombre}>{categoria.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Departamento
                <select name="id_departamento" value={formulario.id_departamento} onChange={actualizarCampo} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30">
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Municipio
                <select name="id_municipio" value={formulario.id_municipio} onChange={actualizarCampo} disabled={!formulario.id_departamento} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-100">
                  <option value="">Selecciona un municipio</option>
                  {municipiosDelDepartamento.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Región (opcional)
                <select name="id_region" value={formulario.id_region} onChange={actualizarCampo} disabled={!formulario.id_municipio} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-100">
                  <option value="">Sin región</option>
                  {regionesDelMunicipio.map((region) => (
                    <option key={region.id} value={region.id}>{region.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Horario
                <input name="horario" value={formulario.horario} onChange={actualizarCampo} placeholder="Todos los días, 08:00 - 18:00" className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
              </label>
              <SelectorImagen
                etiqueta="Imagen principal"
                valor={formulario.imagen_principal}
                onUploading={(subiendo) => setSubidasPendientes((pendientes) => pendientes + (subiendo ? 1 : -1))}
                onChange={(imagen_principal) => setFormulario((actual) => ({ ...actual, imagen_principal }))}
              />
              <label className="block text-sm font-semibold text-slate-700">
                Dirección
                <input name="direccion" value={formulario.direccion} onChange={actualizarCampo} placeholder="Referencia o dirección" className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
              </label>
            </div>
            <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-sal-2" />}>
              <SelectorUbicacion
                latitud={formulario.latitud}
                longitud={formulario.longitud}
                clave={formulario.categoria}
                onCambiar={(ubicacion) => setFormulario((actual) => ({ ...actual, ...ubicacion }))}
              />
            </Suspense>
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
              <textarea name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} rows={3} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Recomendaciones para el visitante
              <textarea name="recomendaciones" value={formulario.recomendaciones} onChange={actualizarCampo} rows={2} placeholder="Qué llevar, mejor época, precauciones..." className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
            </label>
            <fieldset className="space-y-4 rounded-2xl border border-sky-200 p-4">
              <legend className="px-2 text-sm font-bold text-slate-900">Información práctica (cómo llegar y antes de ir)</legend>
              <label className="block text-sm font-semibold text-slate-700">
                Cómo llegar (resumen)
                <textarea name="como_llegar" value={formulario.como_llegar} onChange={actualizarCampo} rows={2} placeholder="Desde qué ciudad se sale y por dónde se entra." className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Medios de transporte (uno por línea: Medio | Desde | Tiempo | Detalle)
                <textarea name="transportes" value={formulario.transportes} onChange={actualizarCampo} rows={3} placeholder={'Bus | La Paz | 9 h | Salidas nocturnas\nAvión | La Paz | 1 h | Vuelos diarios'} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 font-mono text-sm" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Mejor época para ir
                  <input name="mejor_epoca" value={formulario.mejor_epoca} onChange={actualizarCampo} placeholder="Ej.: abril a octubre" className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Clima típico
                  <input name="clima_tipico" value={formulario.clima_tipico} onChange={actualizarCampo} placeholder="Ej.: días soleados y noches frías" className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Consejos (uno por línea)
                  <textarea name="consejos" value={formulario.consejos} onChange={actualizarCampo} rows={3} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Normas del lugar (una por línea)
                  <textarea name="normas" value={formulario.normas} onChange={actualizarCampo} rows={3} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Seguridad
                <textarea name="seguridad" value={formulario.seguridad} onChange={actualizarCampo} rows={2} placeholder="Precauciones, zonas a evitar, salud (altura, vacunas)..." className="mt-2 w-full rounded-xl border border-sky-200 bg-white/70 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
              </label>
              <p className="text-xs text-slate-500">El clima actual se muestra solo a partir de la ubicación en el mapa (Open-Meteo); aquí va el clima típico por época.</p>
            </fieldset>
            <SelectorImagen
              multiple
              etiqueta="Fotos de la galería"
              valor={listaDeUrls(formulario.imagenes)}
              onUploading={(subiendo) => setSubidasPendientes((pendientes) => pendientes + (subiendo ? 1 : -1))}
              onChange={(imagenes) => setFormulario((actual) => ({ ...actual, imagenes: imagenes.join('\n') }))}
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input name="destacado" type="checkbox" checked={formulario.destacado} onChange={actualizarCampo} className="h-4 w-4 rounded border-neutral-300" />
              Mostrar como destacado en la página de inicio
            </label>
            <div className="flex gap-3">
              <button disabled={guardando || subidasPendientes > 0} className="rounded-xl bg-brand-700 px-5 py-2.5 font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
                {guardando ? 'Guardando...' : subidasPendientes > 0 ? 'Subiendo imágenes...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setFormularioAbierto(false)} className="rounded-xl border border-neutral-300 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cargando ? (
          <div className="h-64 animate-pulse rounded-2xl bg-sal-2 cristal" />
        ) : (
          <div className="overflow-x-auto rounded-2xl cristal">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Foto</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {destinos.map((destino) => (
                  <tr key={destino.id} className="border-t border-neutral-100">
                    <td className="px-5 py-3"><ImagenSegura src={destino.imagen_principal || destino.imagenes?.[0]} alt="" className="h-12 w-16 rounded-lg object-cover" /></td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{destino.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{destino.categoria}</td>
                    <td className="px-5 py-3 text-slate-600">{destino.ubicacion}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <Link to={`/destinos/${destino.id}`} className="mr-3 font-semibold text-slate-700 hover:underline">Ver publicado</Link>
                      <button type="button" onClick={() => abrirEditar(destino)} className="mr-3 font-semibold text-brand-700 hover:underline">Editar</button>
                      <button type="button" onClick={() => eliminar(destino)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {destinos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate-500">No hay destinos registrados todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDestinos
