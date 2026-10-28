// Instalación de la app (PWA): utilidades compartidas entre el aviso de
// instalación y el menú.

// Evento que abre el aviso de instalación desde otros lugares (ej. el menú del celular).
export const EVENTO_MOSTRAR_INSTALACION = 'rutas:mostrar-instalacion'

// También cuenta como instalada la APK de Android (Capacitor): ahí no tiene
// sentido ofrecer la instalación.
export function yaEstaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true
    || window.Capacitor?.isNativePlatform?.() === true
}
