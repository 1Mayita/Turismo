import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/useAuth.js'
import { useTituloPagina } from './hooks/useTituloPagina.js'
import RutaPrivada from './routes/RutaPrivada.jsx'
import RutaAdmin from './routes/RutaAdmin.jsx'
import LimiteDeErrores from './components/LimiteDeErrores.jsx'
import PantallaCarga from './components/PantallaCarga.jsx'
import PieDePagina from './components/PieDePagina.jsx'
import Inicio from './pages/Inicio/Inicio.jsx'

// Cada página se descarga recién cuando se visita (el Inicio va incluido para
// que la primera pantalla aparezca de inmediato).
const Login = lazy(() => import('./pages/Login/Login.jsx'))
const Registro = lazy(() => import('./pages/Registro/Registro.jsx'))
const Destinos = lazy(() => import('./pages/Destinos/Destinos.jsx'))
const DestinoDetalle = lazy(() => import('./pages/DestinoDetalle/DestinoDetalle.jsx'))
const Departamentos = lazy(() => import('./pages/Departamentos/Departamentos.jsx'))
const DepartamentoDetalle = lazy(() => import('./pages/Departamentos/DepartamentoDetalle.jsx'))
const Mapa = lazy(() => import('./pages/Mapa/Mapa.jsx'))
const Eventos = lazy(() => import('./pages/Eventos/Eventos.jsx'))
const Gastronomia = lazy(() => import('./pages/Gastronomia/Gastronomia.jsx'))
const Restaurantes = lazy(() => import('./pages/Restaurantes/Restaurantes.jsx'))
const RestauranteDetalle = lazy(() => import('./pages/Restaurantes/RestauranteDetalle.jsx'))
const Alojamientos = lazy(() => import('./pages/Alojamientos/Alojamientos.jsx'))
const AlojamientoDetalle = lazy(() => import('./pages/Alojamientos/AlojamientoDetalle.jsx'))
const Busqueda = lazy(() => import('./pages/Busqueda/Busqueda.jsx'))
const Favoritos = lazy(() => import('./pages/Favoritos/Favoritos.jsx'))
const Perfil = lazy(() => import('./pages/Perfil/Perfil.jsx'))
const MisViajes = lazy(() => import('./pages/Viajes/MisViajes.jsx'))
const ViajeDetalle = lazy(() => import('./pages/Viajes/ViajeDetalle.jsx'))
const ViajeCompartido = lazy(() => import('./pages/Viajes/ViajeCompartido.jsx'))
const Notificaciones = lazy(() => import('./pages/Notificaciones/Notificaciones.jsx'))
const AdminReportes = lazy(() => import('./pages/Admin/AdminReportes.jsx'))
const AdminEstadisticas = lazy(() => import('./pages/Admin/AdminEstadisticas.jsx'))
const NoEncontrada = lazy(() => import('./pages/NoEncontrada/NoEncontrada.jsx'))
const AdminDestinos = lazy(() => import('./pages/Admin/AdminDestinos.jsx'))
const AdminDepartamentos = lazy(() => import('./pages/Admin/AdminDepartamentos.jsx'))
const AdminCategorias = lazy(() => import('./pages/Admin/AdminCategorias.jsx'))
const AdminUsuarios = lazy(() => import('./pages/Admin/AdminUsuarios.jsx'))
const AdminActividades = lazy(() => import('./pages/Admin/AdminActividades.jsx'))
const AdminEventos = lazy(() => import('./pages/Admin/AdminEventos.jsx'))
const AdminRestaurantes = lazy(() => import('./pages/Admin/AdminRestaurantes.jsx'))
const AdminAlojamientos = lazy(() => import('./pages/Admin/AdminAlojamientos.jsx'))
const AdminResenas = lazy(() => import('./pages/Admin/AdminResenas.jsx'))
const AdminPlatos = lazy(() => import('./pages/Admin/AdminPlatos.jsx'))

// Título de la pestaña según la ruta. Los detalles (destino, departamento)
// lo reemplazan por el nombre del lugar cuando terminan de cargar.
const TITULOS = [
  ['/admin', 'Panel de administración'],
  ['/destinos', 'Destinos'],
  ['/departamentos', 'Departamentos'],
  ['/mapa', 'Mapa turístico'],
  ['/eventos', 'Eventos'],
  ['/gastronomia', 'Gastronomía típica'],
  ['/restaurantes', 'Restaurantes'],
  ['/alojamientos', 'Alojamientos'],
  ['/buscar', 'Búsqueda'],
  ['/favoritos', 'Mis favoritos'],
  ['/viajes', 'Mis viajes'],
  ['/viaje-compartido', 'Viaje compartido'],
  ['/notificaciones', 'Notificaciones'],
  ['/perfil', 'Mi perfil'],
  ['/login', 'Iniciar sesión'],
  ['/registro', 'Crear cuenta'],
]

function App() {
  const { cargando } = useAuth()
  const { pathname } = useLocation()

  useTituloPagina(TITULOS.find(([prefijo]) => pathname.startsWith(prefijo))?.[1] || '')

  // Cada página nueva empieza arriba, no donde quedó el scroll de la anterior.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (cargando) return <PantallaCarga />

  return (
    <LimiteDeErrores>
      <Suspense fallback={<PantallaCarga />}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Todo el catálogo es público: se puede explorar sin cuenta. La sesión
              solo se pide para guardar favoritos o escribir una reseña. */}
          <Route path="/destinos" element={<Destinos />} />
          <Route path="/destinos/:id" element={<DestinoDetalle />} />
          <Route path="/departamentos" element={<Departamentos />} />
          <Route path="/departamentos/:id" element={<DepartamentoDetalle />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/gastronomia" element={<Gastronomia />} />
          <Route path="/restaurantes" element={<Restaurantes />} />
          <Route path="/restaurantes/:id" element={<RestauranteDetalle />} />
          <Route path="/alojamientos" element={<Alojamientos />} />
          <Route path="/alojamientos/:id" element={<AlojamientoDetalle />} />
          <Route path="/buscar" element={<Busqueda />} />

          <Route path="/viaje-compartido/:token" element={<ViajeCompartido />} />

          <Route path="/favoritos" element={<RutaPrivada><Favoritos /></RutaPrivada>} />
          <Route path="/viajes" element={<RutaPrivada><MisViajes /></RutaPrivada>} />
          <Route path="/viajes/:id" element={<RutaPrivada><ViajeDetalle /></RutaPrivada>} />
          <Route path="/notificaciones" element={<RutaPrivada><Notificaciones /></RutaPrivada>} />
          <Route path="/perfil" element={<RutaPrivada><Perfil /></RutaPrivada>} />

          <Route path="/admin/destinos" element={<RutaAdmin><AdminDestinos /></RutaAdmin>} />
          <Route path="/admin/departamentos" element={<RutaAdmin><AdminDepartamentos /></RutaAdmin>} />
          <Route path="/admin/categorias" element={<RutaAdmin><AdminCategorias /></RutaAdmin>} />
          <Route path="/admin/usuarios" element={<RutaAdmin><AdminUsuarios /></RutaAdmin>} />
          <Route path="/admin/actividades" element={<RutaAdmin><AdminActividades /></RutaAdmin>} />
          <Route path="/admin/eventos" element={<RutaAdmin><AdminEventos /></RutaAdmin>} />
          <Route path="/admin/restaurantes" element={<RutaAdmin><AdminRestaurantes /></RutaAdmin>} />
          <Route path="/admin/alojamientos" element={<RutaAdmin><AdminAlojamientos /></RutaAdmin>} />
          <Route path="/admin/resenas" element={<RutaAdmin><AdminResenas /></RutaAdmin>} />
          <Route path="/admin/platos" element={<RutaAdmin><AdminPlatos /></RutaAdmin>} />
          <Route path="/admin/reportes" element={<RutaAdmin><AdminReportes /></RutaAdmin>} />
          <Route path="/admin/estadisticas" element={<RutaAdmin><AdminEstadisticas /></RutaAdmin>} />

          <Route path="*" element={<NoEncontrada />} />
        </Routes>
        {!['/login', '/registro'].includes(pathname) && <PieDePagina />}
      </Suspense>
    </LimiteDeErrores>
  )
}

export default App
