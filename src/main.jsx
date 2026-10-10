import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FavoritosProvider } from './context/FavoritosContext.jsx'
import { NotificacionesProvider } from './context/NotificacionesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritosProvider>
          <NotificacionesProvider>
            <App />
          </NotificacionesProvider>
        </FavoritosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
