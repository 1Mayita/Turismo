import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { LucideProvider } from 'lucide-react'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FavoritosProvider } from './context/FavoritosContext.jsx'
import { NotificacionesProvider } from './context/NotificacionesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Iconos Lucide a 20px y trazo 1.75 en toda la app; las animaciones se
        apagan solas si la persona pidió "reducir movimiento" en su sistema. */}
    <LucideProvider size={20} strokeWidth={1.75}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <FavoritosProvider>
              <NotificacionesProvider>
                <App />
              </NotificacionesProvider>
            </FavoritosProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </LucideProvider>
  </StrictMode>,
)
