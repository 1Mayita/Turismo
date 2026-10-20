import { motion } from 'framer-motion'

const ETIQUETAS = { div: motion.div, li: motion.li, section: motion.section, article: motion.article }

// Entrada al hacer scroll (DESIGN.md §5): aparece y sube 16px en 0.5s, una
// sola vez. En listas, "indice" escalona los elementos 0.06s entre sí.
// Con "reducir movimiento" activo no se desplaza (lo maneja MotionConfig).
function Aparecer({ como = 'div', indice = 0, className = '', children, ...resto }) {
  const Elemento = ETIQUETAS[como] || motion.div
  return (
    <Elemento
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: Math.min(indice, 10) * 0.06 }}
      className={className}
      {...resto}
    >
      {children}
    </Elemento>
  )
}

export default Aparecer
