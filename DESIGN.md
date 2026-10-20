# DESIGN.md — Sistema de Turismo de Bolivia

Guía de diseño para el agente. Léela completa antes de tocar cualquier archivo de UI.

---

## 0. Regla número uno: no se elimina nada

Este es un **rediseño visual**, no una reescritura.

- **No elimines** páginas, rutas, componentes, funciones, campos, botones ni secciones existentes, aunque no aparezcan en esta guía o te parezcan sobrantes.
- **No cambies** la lógica de negocio, las llamadas a Firebase, la estructura de la base de datos, los nombres de colecciones, la autenticación ni el manejo de roles.
- Cambia solo **presentación**: estilos, layout, componentes visuales, animaciones y textos de interfaz.
- Si para mejorar el diseño crees que algo debería quitarse, moverse o renombrarse, **pregunta primero** y explica por qué. No lo hagas por tu cuenta.
- Antes de empezar cada fase, haz un **inventario** de lo que existe en esa parte (páginas, componentes, funcionalidades) y muéstramelo. Al terminar, confirma que todo lo del inventario sigue funcionando.

---

## 1. Para quién es

Familias, viajeros y turistas extranjeros. La página debe sentirse **acogedora, clara y fácil de usar** para cualquier edad, no fría ni corporativa. Si alguien de 60 años y alguien de 20 pueden encontrar un destino en menos de un minuto, vamos bien.

---

## 2. Dirección visual: "Salar cálido"

Base inspirada en el Salar de Uyuni (blancos, cielo, azul noche) con un acento cálido de atardecer que le da vida.
Elegante pero cercana. Las fotos son protagonistas. Mucho espacio en blanco, pero nunca vacía.

**Evitar:** look genérico de plantilla SaaS, gradientes morados, sombras duras, todo centrado y simétrico, cards idénticas en grilla sin jerarquía.

---

## 3. Tokens de diseño

### 3.1 Colores — sitio público (modo claro)

| Token | Hex | Uso |
|---|---|---|
| `--sal` | `#FAFAF7` | Fondo principal |
| `--sal-2` | `#F2F0EA` | Fondo de secciones alternas |
| `--cielo` | `#DCE6EE` | Fondos suaves, chips, hover |
| `--cielo-600` | `#5E89AD` | Enlaces, iconos activos |
| `--piedra` | `#7A8B99` | Texto secundario, bordes fuertes |
| `--noche` | `#0E2233` | Texto principal, footer, títulos |
| `--cobre` | `#B88A5A` | Detalles, separadores, badges premium |
| `--atardecer` | `#E07A4F` | **Acento principal**: botones primarios, favoritos, CTA |
| `--atardecer-hover` | `#C9653B` | Hover del acento |
| `--borde` | `#E4E2DC` | Bordes de tarjetas e inputs |

Reglas:
- Un solo botón con `--atardecer` relleno por vista. El resto, botones secundarios (borde) o fantasma.
- Texto sobre `--atardecer`: blanco.
- Verificar contraste AA en todo texto.

### 3.2 Colores — panel de administración (modo oscuro "glass")

| Token | Hex / valor | Uso |
|---|---|---|
| `--admin-bg` | `#0B1A27` | Fondo base |
| `--admin-glow` | `radial-gradient` de `#E07A4F` al 18% de opacidad, difuminado, en una esquina | Brillo cálido de fondo |
| `--glass` | `rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)` | Fondo de tarjetas |
| `--glass-borde` | `rgba(255,255,255,0.10)` | Borde de tarjetas (1px) |
| `--admin-texto` | `#F4F1EC` | Texto principal |
| `--admin-muted` | `#9AA8B4` | Texto secundario, ejes de gráficos |
| `--atardecer` | `#E07A4F` | Acento, línea principal de gráficos, botón primario |
| `--cielo-claro` | `#9CC3E0` | Segunda serie de gráficos, estados info |
| `--cobre` | `#B88A5A` | Tercera serie, badges |
| `--ok` / `--alerta` / `--error` | `#5BBF8A` / `#E8B44C` / `#E05A5A` | Estados |

### 3.3 Tipografía

- **Títulos grandes del sitio público** (hero, títulos de sección): `Cormorant Garamond`, peso 500–600. Solo en tamaños grandes (≥ 32px).
- **Todo lo demás** (UI, cuerpo, botones, panel admin completo): `Manrope`, pesos 400 / 500 / 700.
- Escala: 14 · 16 (cuerpo) · 18 · 22 · 28 · 40 · 56 (hero desktop). En móvil el hero baja a 36–40.
- Interlineado del cuerpo: 1.6. Ancho máximo de párrafos: ~70 caracteres.

### 3.4 Forma, espacio y profundidad

- Radios: tarjetas `20px`, botones e inputs `12px`, chips `999px` (píldora), imágenes dentro de tarjetas `16px`.
- Espaciado base de 4px. Secciones con mucho aire: 96px de separación vertical en desktop, 56px en móvil.
- Sombras suaves y difusas, nunca duras: `0 8px 30px rgba(14,34,51,0.08)`. En hover: `0 14px 40px rgba(14,34,51,0.12)`.
- Iconos: una sola librería (Lucide), trazo 1.75, tamaño 20px.

---

## 4. Componentes base (sitio público)

- **Botón primario:** fondo `--atardecer`, texto blanco, radio 12px, padding 12×20. Hover: `--atardecer-hover` y leve elevación.
- **Botón secundario:** borde `--borde`, texto `--noche`, fondo transparente. Hover: fondo `--cielo`.
- **Tarjeta de destino:** imagen grande arriba (proporción 4:3) con radio 16px; botón de favorito (corazón) flotando en la esquina superior derecha; debajo, nombre, departamento, chip de categoría, valoración con estrella y precio de ingreso. Hover: la imagen hace un zoom suave (scale 1.04) y la tarjeta se eleva.
- **Chips de categoría:** píldoras con icono + texto (Naturaleza, Cultura, Aventura, Gastronomía, Historia, Entretenimiento, Religión). Inactivo: fondo `--cielo`. Activo: fondo `--noche`, texto blanco.
- **Buscador:** grande, redondeado, con icono de lupa, placeholder cercano ("¿A dónde vamos hoy?") y botón de buscar con el acento.
- **Inputs y filtros:** fondo blanco, borde `--borde`, foco con anillo `--cielo-600`.
- **Estados vacíos:** ilustración o icono simple + frase amable + acción ("Aún no guardaste destinos. Explora y toca el ♥").
- **Skeletons** de carga en vez de spinners en listas y tarjetas.

Usa shadcn/ui como base de componentes cuando convenga, personalizado con estos tokens.

---

## 5. Movimiento (Framer Motion)

- Entradas al hacer scroll: fade + subida de 16px, 0.5s, `ease-out`, escalonado de 0.06s entre elementos de una lista.
- Hover y taps: 150–200ms.
- Transiciones entre páginas: fade suave, nada brusco.
- Respetar `prefers-reduced-motion`: si está activo, sin animaciones de desplazamiento ni 3D animado.
- El movimiento debe ayudar a entender, no distraer. Nada parpadea ni rebota sin motivo.

---

## 6. Página de inicio

### 6.1 Hero con mapa 3D interactivo de Bolivia (pieza principal)

**Qué es:** un mapa de Bolivia en relieve, estilo low-poly, con los 9 departamentos como piezas separadas.

**Comportamiento:**
- Al cargar, la cámara está enfocada en **Cochabamba** (departamento por defecto del sistema).
- El usuario puede girar e inclinar el mapa con mouse o dedo, con límites para que no se pierda (sin dar vuelta completa por debajo).
- **Hover / toque** sobre un departamento: la pieza se eleva un poco, cambia a `--atardecer` y aparece una etiqueta con su nombre y cantidad de destinos.
- **Clic** sobre un departamento: la cámara vuela suavemente hacia él y aparece un panel lateral (o inferior en móvil) con 3–4 destinos destacados y un botón "Ver todos los destinos de [departamento]" que lleva a la vista del departamento ya existente.
- Pines o marcadores pequeños para destinos destacados (por ejemplo Salar de Uyuni, Lago Titicaca, Cristo de la Concordia).
- Colores del mapa: altiplano en tonos `--sal` y `--cielo`, zonas bajas en verde suave desaturado, el salar casi blanco con un brillo sutil. Fondo del hero en `--sal` o cielo muy claro.
- Superpuesto al mapa, a un costado: título grande en Cormorant ("Descubre Bolivia"), una línea de subtítulo y el buscador.

**Técnica:**
- React Three Fiber + `@react-three/drei` (OrbitControls con límites, Html para etiquetas, CameraControls o animación de cámara).
- Geometría a partir de un GeoJSON de los departamentos de Bolivia, extruido con `ExtrudeGeometry` (altura diferente por región para simular relieve).
- **Carga diferida:** el 3D se carga con `lazy` + `Suspense` después del resto de la página. Mientras carga, se muestra una imagen estática del mapa con el mismo encuadre.
- **Móvil o equipos lentos:** versión simplificada (menos polígonos, sin sombras) o, si el rendimiento es bajo, el mapa 2D interactivo con el mismo comportamiento de clic.
- Con `prefers-reduced-motion`: mapa estático, sin vuelos de cámara.
- Accesibilidad: debajo del mapa, una lista de departamentos navegable con teclado que hace lo mismo que el clic.

### 6.2 Resto del inicio (en este orden)
1. Chips de categorías.
2. "Destacados en Cochabamba" (o el departamento seleccionado): carrusel horizontal de tarjetas grandes.
3. Próximos eventos y festividades: tarjetas con fecha destacada.
4. Gastronomía: platos típicos con foto grande, layout tipo mosaico.
5. Bloque "Arma tu viaje" que invita a usar Mi viaje / itinerarios.
6. Footer en `--noche`.

---

## 7. Otras páginas del sitio público

Aplica los mismos tokens y componentes a **todas** las páginas existentes, sin eliminar ninguna. Prioridades:

- **Detalle del destino:** galería grande arriba, información clave (horario, precio, ubicación) en tarjetas pequeñas con icono, botones "Guardar" y "Agregar a mi viaje" siempre visibles (barra fija abajo en móvil), mapa, actividades, reseñas, cómo llegar y consejos.
- **Mapa turístico:** mapa a pantalla casi completa con panel de resultados y filtros a un costado (hoja deslizable en móvil).
- **Búsqueda y filtros:** filtros en panel lateral en desktop, en hoja inferior en móvil; mostrar filtros activos como chips que se pueden quitar.
- **Mi viaje / itinerarios:** línea de tiempo vertical con los lugares en orden, reordenables arrastrando.
- **Login, registro y perfil:** pantallas limpias, una foto de paisaje boliviano a un lado en desktop.

---

## 8. Panel de administración (estilo "dark glass")

Referencia: dashboard oscuro con tarjetas translúcidas tipo vidrio, brillo cálido de fondo, sidebar de iconos y tarjetas grandes con mucho redondeo. Adaptado a nuestra paleta (sección 3.2).

**Layout:**
- **Sidebar** izquierda angosta, solo iconos (con tooltip al pasar el mouse), fondo glass, ítem activo resaltado con `--atardecer`. Abajo: notificaciones y configuración. En móvil se convierte en menú inferior o drawer.
- **Barra superior:** título de la sección, buscador, notificaciones y avatar del administrador.
- **Fondo:** `--admin-bg` con el brillo cálido difuminado (`--admin-glow`) detrás de las tarjetas.

**Dashboard (inicio del admin):**
- **Tarjeta hero** grande: saludo ("Hola, [nombre]"), resumen corto del día y una foto de un destino boliviano recortada que se integra con el fondo. Botón primario hacia la acción más común (por ejemplo "Agregar destino").
- **Fila de KPIs** dentro o debajo del hero: destinos, usuarios, reseñas, favoritos. Número grande, etiqueta pequeña con punto de color y una mini barra de progreso.
- **Gráfico de líneas** en tarjeta glass: usuarios activos / visitas en el tiempo, línea principal `--atardecer` y secundaria `--cielo-claro`, tooltip con burbuja.
- **Tarjeta lateral:** departamento más popular o destino más visitado con imagen.
- **Tabla** de "Destinos más visitados" (o reseñas recientes) con miniatura redondeada, nombre, departamento, visitas, valoración y una sparkline pequeña. Selector de orden (Popularidad, Recientes) arriba a la derecha.

**Páginas de gestión** (destinos, departamentos, categorías, actividades, eventos, restaurantes, alojamientos, usuarios, reseñas y cualquier otra que ya exista):
- Mismo estilo glass. Tablas con filas espaciadas, miniaturas, acciones (editar, eliminar) con iconos y confirmación antes de eliminar.
- Formularios en tarjetas glass o en panel lateral deslizable, inputs oscuros con borde `--glass-borde` y foco `--atardecer`.
- **Mantener todos los campos, validaciones y funciones que ya existen.**

Gráficos: Recharts (o la librería que ya esté usando el proyecto).

---

## 9. Responsive y accesibilidad

- Mobile-first. Probar en 375px, 768px, 1280px y 1536px.
- Áreas táctiles de al menos 44×44px.
- Contraste AA en todo el texto, incluido el modo glass del admin.
- Navegación completa con teclado y foco visible.
- Imágenes con `alt` descriptivo, carga diferida (`loading="lazy"`) y formatos optimizados.

---

## 10. Cómo trabajar (orden de fases)

Trabaja **una fase a la vez**. Al empezar cada una: inventario de lo existente. Al terminar: resumen de cambios y confirmación de que nada se perdió.

1. **Tokens y base:** variables CSS / configuración de Tailwind, fuentes, componentes base (botones, tarjetas, chips, inputs). Sin cambiar páginas todavía.
2. **Layout general:** navbar, footer, contenedores.
3. **Inicio sin 3D:** todas las secciones del inicio con el nuevo estilo, con imagen estática en el hero.
4. **Hero 3D:** mapa interactivo de Bolivia, con sus versiones de carga y móvil.
5. **Resto de páginas públicas**, una por una.
6. **Panel de administración:** primero layout y dashboard, luego cada página de gestión.
7. **Pulido:** animaciones, estados vacíos, skeletons, revisión responsive y de accesibilidad.

Si una instrucción de esta guía choca con algo que ya existe en el proyecto, **gana lo que existe**: adapta el estilo y pregúntame.
