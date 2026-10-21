import { motion } from 'framer-motion'

const ETIQUETAS = { div: motion.div, li: motion.li, section: motion.section, article: motion.article }

// Entrada breve y discreta al hacer scroll. En listas, "indice" escalona
// ligeramente los elementos para evitar una aparición simultánea brusca.
// Con "reducir movimiento" activo no se desplaza (lo maneja MotionConfig).
function Aparecer({ como = 'div', indice = 0, className = '', children, ...resto }) {
  const Elemento = ETIQUETAS[como] || motion.div
  return (
    <Elemento
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(indice, 6) * 0.025 }}
      className={className}
      {...resto}
    >
      {children}
    </Elemento>
  )
}

export default Aparecer
