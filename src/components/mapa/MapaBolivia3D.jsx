import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Color, ExtrudeGeometry, Shape, Vector3 } from 'three'
import { ALTO_MAPA, ANCHO_MAPA, DEPARTAMENTOS_MAPA, proyectar } from './boliviaSvg.js'

// Mapa 3D de Bolivia (DESIGN.md §6.1): los 9 departamentos como piezas
// extruidas, con más altura en el altiplano que en los llanos. Se carga en
// diferido desde HeroMapa y usa una calidad fija para evitar saltos de cámara
// o cambios de apariencia cuando varía la medición de FPS.

const ESCALA = 1 / 100 // 1000 unidades del SVG = 10 unidades 3D
const ALTURA_REGION = {
  'la-paz': 0.62, oruro: 0.58, potosi: 0.6,
  cochabamba: 0.42, chuquisaca: 0.4, tarija: 0.36,
  beni: 0.2, pando: 0.18, 'santa-cruz': 0.24,
}
const COLOR_REGION = {
  'la-paz': '#e9e7ef', oruro: '#eeecf2', potosi: '#f2f0f4',
  cochabamba: '#f1dccb', chuquisaca: '#f4e3d4', tarija: '#efd7c3',
  beni: '#cbd5e2', pando: '#c6d1df', 'santa-cruz': '#d0d9e5',
}
const COLOR_ACTIVO = new Color('#7d93c8')
const ELEVACION = 0.14
const SEPARACION = 0.985 // cada pieza se encoge un poco para que se vean separadas
const CAMARA_GENERAL = { objetivo: new Vector3(0, 0, 0.4), distancia: 21 }
const DISTANCIA_DEPARTAMENTO = 19.5
// Ángulo de la cámara: algo inclinada, mirando desde el sur.
const DIRECCION_CAMARA = new Vector3(0, 1.45, 1).normalize()

// Pasa un punto del SVG al plano del mapa 3D (centrado en el origen).
function aMundo([x, y]) {
  return [(x - ANCHO_MAPA / 2) * ESCALA, (y - ALTO_MAPA / 2) * ESCALA]
}

// "M x,y L x,y ... Z M ..." → lista de polígonos [[x, y], ...]
function poligonosDe(d) {
  return d.split('M').filter(Boolean).map((trozo) =>
    trozo.replace('Z', '').split('L').map((par) => par.split(',').map(Number)),
  )
}

function crearGeometria(departamento) {
  const [cx, cz] = aMundo(departamento.centro)
  const formas = poligonosDe(departamento.d).map((puntos) => {
    const forma = new Shape()
    puntos.forEach((punto, indice) => {
      const [x, z] = aMundo(punto)
      // El eje Y de la forma se vuelve -Z al acostarla (rotación de -90° en X).
      const px = (x - cx) * SEPARACION
      const py = -(z - cz) * SEPARACION
      if (indice === 0) forma.moveTo(px, py)
      else forma.lineTo(px, py)
    })
    return forma
  })
  const geometria = new ExtrudeGeometry(formas, {
    depth: ALTURA_REGION[departamento.id],
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  })
  geometria.rotateX(-Math.PI / 2)
  return { geometria, centro: [cx, cz] }
}

function Departamento({ departamento, datos, resaltado, alSobre, alElegir, sombras, children }) {
  const grupo = useRef(null)
  const material = useRef(null)
  const colorBase = useMemo(() => new Color(COLOR_REGION[departamento.id]), [departamento.id])
  const altura = ALTURA_REGION[departamento.id]

  // Sube y cambia de color con suavidad hacia el estado que corresponde.
  useFrame((_, delta) => {
    if (!grupo.current || !material.current) return
    const factor = 1 - Math.exp(-delta * 10)
    grupo.current.position.y += ((resaltado ? ELEVACION : 0) - grupo.current.position.y) * factor
    material.current.color.lerp(resaltado ? COLOR_ACTIVO : colorBase, factor)
  })

  return (
    <group ref={grupo} position={[datos.centro[0], 0, datos.centro[1]]}>
      <mesh
        geometry={datos.geometria}
        castShadow={sombras}
        receiveShadow={sombras}
        onPointerOver={(evento) => {
          evento.stopPropagation()
          alSobre(departamento.id)
        }}
        onPointerOut={() => alSobre('')}
        onClick={(evento) => {
          evento.stopPropagation()
          // Si la persona arrastró para girar el mapa, no cuenta como clic.
          if (evento.delta > 6) return
          alElegir(departamento.id)
        }}
      >
        <meshStandardMaterial ref={material} color={colorBase} roughness={0.85} metalness={0} />
      </mesh>
      {/* Lo que va encima del departamento (salar, lago, pines) sube con él. */}
      <group position={[0, altura + 0.03, 0]}>{children}</group>
    </group>
  )
}

// Lleva la cámara hacia el departamento elegido (o a la vista general).
// Si la persona toma el control y gira el mapa, el vuelo se detiene.
function Camara({ objetivo, controles }) {
  const { camera } = useThree()
  const volando = useRef(true)

  useEffect(() => {
    volando.current = true
  }, [objetivo])

  useEffect(() => {
    const actuales = controles.current
    if (!actuales) return
    const detener = () => {
      volando.current = false
    }
    actuales.addEventListener('start', detener)
    return () => actuales.removeEventListener('start', detener)
  }, [controles])

  useFrame((_, delta) => {
    if (!volando.current || !controles.current) return
    const factor = 1 - Math.exp(-delta * 3)
    const destinoCamara = objetivo.centro.clone().addScaledVector(DIRECCION_CAMARA, objetivo.distancia)
    controles.current.target.lerp(objetivo.centro, factor)
    camera.position.lerp(destinoCamara, factor)
    controles.current.update()
    if (camera.position.distanceTo(destinoCamara) < 0.01) volando.current = false
  })

  return null
}

// Pone la etiqueta (un elemento normal de la página, fuera del lienzo) sobre
// el departamento: en cada cuadro proyecta su posición 3D a la pantalla.
function SeguirEtiqueta({ posicion, alMover }) {
  const { camera, size } = useThree()
  const punto = useMemo(() => new Vector3(), [])

  useFrame(() => {
    if (!posicion) {
      alMover(null)
      return
    }
    punto.set(...posicion).project(camera)
    alMover([((punto.x + 1) / 2) * size.width, ((1 - punto.y) / 2) * size.height])
  })

  return null
}

function Escena({ idActivo, alElegir, pines, sombras, conPanel, alMoverEtiqueta, alCambiarEtiqueta }) {
  const controles = useRef(null)
  const [idSobre, setIdSobre] = useState('')
  const piezas = useMemo(() => Object.fromEntries(DEPARTAMENTOS_MAPA.map((departamento) => [departamento.id, crearGeometria(departamento)])), [])
  useEffect(() => () => Object.values(piezas).forEach((pieza) => pieza.geometria.dispose()), [piezas])

  useEffect(() => {
    document.body.style.cursor = idSobre ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [idSobre])

  const objetivo = useMemo(() => {
    const pieza = piezas[idActivo]
    const centro = pieza
      // Se acerca al departamento, pero quedándose cerca del centro del país
      // para que Bolivia completa siga a la vista.
      ? new Vector3(pieza.centro[0], 0.3, pieza.centro[1]).lerp(CAMARA_GENERAL.objetivo, 0.85)
      : CAMARA_GENERAL.objetivo.clone()
    // Con el panel abierto a la derecha, el mapa se corre un poco a la
    // izquierda y la cámara se aleja para que el país entre completo.
    if (conPanel) centro.x += 0.8
    const distancia = conPanel ? CAMARA_GENERAL.distancia + 1.5 : pieza ? DISTANCIA_DEPARTAMENTO : CAMARA_GENERAL.distancia
    return { centro, distancia }
  }, [idActivo, piezas, conPanel])

  const idEtiqueta = idSobre || idActivo
  const departamentoEtiqueta = DEPARTAMENTOS_MAPA.find((departamento) => departamento.id === idEtiqueta)
  const posicionEtiqueta = departamentoEtiqueta
    ? [piezas[departamentoEtiqueta.id].centro[0], ALTURA_REGION[departamentoEtiqueta.id] + ELEVACION + 0.25, piezas[departamentoEtiqueta.id].centro[1]]
    : null

  useEffect(() => {
    alCambiarEtiqueta(departamentoEtiqueta?.id || '')
  }, [departamentoEtiqueta?.id, alCambiarEtiqueta])
  const salar = aMundo(proyectar(-20.13, -67.49))
  const lago = aMundo(proyectar(-16.05, -69.05))

  // Elementos que van encima de cada departamento, en coordenadas locales.
  function extrasDe(id) {
    const [cx, cz] = piezas[id].centro
    const local = ([x, z]) => [x - cx, 0, z - cz]
    return (
      <>
        {id === 'potosi' && (
          <mesh position={local(salar)} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.78, 1]}>
            <circleGeometry args={[0.34, 40]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} roughness={0.3} />
          </mesh>
        )}
        {id === 'la-paz' && (
          <mesh position={local(lago)} rotation={[-Math.PI / 2, 0, 0.66]} scale={[1, 0.42, 1]}>
            <circleGeometry args={[0.27, 32]} />
            <meshStandardMaterial color="#9cc3e0" roughness={0.2} />
          </mesh>
        )}
        {pines.filter((pin) => pin.departamento === id).map((pin) => {
          const [x, , z] = local(aMundo(proyectar(pin.latitud, pin.longitud)))
          return (
            <group key={pin.id} position={[x, 0, z]}>
              <mesh position={[0, 0.16, 0]} castShadow={sombras}>
                <sphereGeometry args={[0.085, 20, 20]} />
                <meshStandardMaterial color="#1a3c62" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
                <meshStandardMaterial color="#1a3c62" />
              </mesh>
            </group>
          )
        })}
      </>
    )
  }

  return (
    <>
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#ffffff', '#c9d6e0', 0.6]} />
      <directionalLight
        position={[-6, 12, 7]}
        intensity={1.6}
        castShadow={sombras}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0005}
      />
      {sombras && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.12} />
        </mesh>
      )}

      {DEPARTAMENTOS_MAPA.map((departamento) => (
        <Departamento
          key={departamento.id}
          departamento={departamento}
          datos={piezas[departamento.id]}
          resaltado={departamento.id === idEtiqueta}
          alSobre={setIdSobre}
          alElegir={alElegir}
          sombras={sombras}
        >
          {extrasDe(departamento.id)}
        </Departamento>
      ))}

      <SeguirEtiqueta posicion={posicionEtiqueta} alMover={alMoverEtiqueta} />

      <OrbitControls
        ref={controles}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={9}
        maxDistance={25}
        // Se puede inclinar, pero nunca pasar por debajo del mapa.
        minPolarAngle={0.15}
        maxPolarAngle={1.05}
        minAzimuthAngle={-0.9}
        maxAzimuthAngle={0.9}
        zoomSpeed={0.6}
        rotateSpeed={0.6}
      />
      <Camara objetivo={objetivo} controles={controles} />
    </>
  )
}

function MapaBolivia3D({ cantidades = {}, idActivo = '', alElegir, pines = [], conPanel = false, className = '' }) {
  const etiqueta = useRef(null)
  const [idEtiqueta, setIdEtiqueta] = useState('')
  const departamentoEtiqueta = DEPARTAMENTOS_MAPA.find((departamento) => departamento.id === idEtiqueta)
  const cantidad = cantidades[idEtiqueta]

  // Mueve la etiqueta directo en el DOM (sin re-render en cada cuadro).
  function moverEtiqueta(punto) {
    const elemento = etiqueta.current
    if (!elemento) return
    elemento.style.opacity = punto ? '1' : '0'
    if (punto) elemento.style.transform = `translate(${punto[0]}px, ${punto[1]}px) translate(-50%, -100%)`
  }
  const inicio = CAMARA_GENERAL.objetivo.clone().addScaledVector(DIRECCION_CAMARA, CAMARA_GENERAL.distancia)

  return (
    <div className={`relative aspect-[1000/1050] w-full ${className}`}>
      <Canvas
        dpr={1.25}
        shadows={false}
        // Sin "tone mapping", para que los colores sean los de la paleta.
        flat
        camera={{ position: inicio.toArray(), fov: 34, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <Escena
          idActivo={idActivo}
          alElegir={alElegir}
          pines={pines}
          sombras={false}
          conPanel={conPanel}
          alMoverEtiqueta={moverEtiqueta}
          alCambiarEtiqueta={setIdEtiqueta}
        />
      </Canvas>
      <div ref={etiqueta} className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-opacity duration-150" aria-hidden="true">
        {departamentoEtiqueta && (
          <div className="rounded-control bg-noche px-3 py-2 text-center text-white shadow-elevada ring-1 ring-white/20">
            <p className="whitespace-nowrap text-sm font-bold">{departamentoEtiqueta.nombre}</p>
            <p className="whitespace-nowrap text-xs text-admin-muted">
              {cantidad ? `${cantidad} ${cantidad === 1 ? 'destino' : 'destinos'}` : 'Ver el departamento'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapaBolivia3D
