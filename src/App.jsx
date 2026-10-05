import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth.js'
import RutaPrivada from './routes/RutaPrivada.jsx'
import RutaAdmin from './routes/RutaAdmin.jsx'
import Inicio from './pages/Inicio/Inicio.jsx'
import Login from './pages/Login/Login.jsx'
import Registro from './pages/Registro/Registro.jsx'
import Destinos from './pages/Destinos/Destinos.jsx'
import DestinoDetalle from './pages/DestinoDetalle/DestinoDetalle.jsx'
import Departamentos from './pages/Departamentos/Departamentos.jsx'
import DepartamentoDetalle from './pages/Departamentos/DepartamentoDetalle.jsx'
import Perfil from './pages/Perfil/Perfil.jsx'
import AdminDestinos from './pages/Admin/AdminDestinos.jsx'
import AdminDepartamentos from './pages/Admin/AdminDepartamentos.jsx'
import AdminCategorias from './pages/Admin/AdminCategorias.jsx'
import AdminUsuarios from './pages/Admin/AdminUsuarios.jsx'
import AdminActividades from './pages/Admin/AdminActividades.jsx'
import AdminEventos from './pages/Admin/AdminEventos.jsx'
import Mapa from './pages/Mapa/Mapa.jsx'
import Eventos from './pages/Eventos/Eventos.jsx'
import Favoritos from './pages/Favoritos/Favoritos.jsx'
import Gastronomia from './pages/Gastronomia/Gastronomia.jsx'
import Restaurantes from './pages/Restaurantes/Restaurantes.jsx'
import Alojamientos from './pages/Alojamientos/Alojamientos.jsx'
import AdminRestaurantes from './pages/Admin/AdminRestaurantes.jsx'
import AdminAlojamientos from './pages/Admin/AdminAlojamientos.jsx'
import AdminResenas from './pages/Admin/AdminResenas.jsx'
import Busqueda from './pages/Busqueda/Busqueda.jsx'

function App() {
  const { cargando } = useAuth()

  if (cargando) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Cargando...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Los catálogos son públicos: cualquiera puede explorar destinos y departamentos. */}
      <Route path="/destinos" element={<Destinos />} />
      <Route path="/departamentos" element={<Departamentos />} />
      <Route path="/mapa" element={<Mapa />} />
      <Route path="/eventos" element={<Eventos />} />
      <Route path="/gastronomia" element={<Gastronomia />} />
      <Route path="/restaurantes" element={<Restaurantes />} />
      <Route path="/alojamientos" element={<Alojamientos />} />
      <Route path="/buscar" element={<Busqueda />} />

      {/* Ver el detalle completo, favoritos o el perfil sí requiere haber iniciado sesión. */}
      <Route path="/favoritos" element={<RutaPrivada><Favoritos /></RutaPrivada>} />
      <Route path="/destinos/:id" element={<RutaPrivada><DestinoDetalle /></RutaPrivada>} />
      <Route path="/departamentos/:id" element={<RutaPrivada><DepartamentoDetalle /></RutaPrivada>} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
