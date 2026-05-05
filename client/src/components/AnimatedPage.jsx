import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedPage — wraps each route with a fade+slide transition.
 *
 * IMPORTANT: `pointer-events` is set to "none" during initial/exit phases
 * so the ghost of the leaving page never blocks clicks on the incoming page.
 * framer-motion supports any CSS property as a motion value, so we pass it
 * directly inside the variant objects.
 */
const AnimatedPage = ({ children, centerPage = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, pointerEvents: 'none' }}
      animate={{ opacity: 1, y: 0, pointerEvents: 'auto' }}
      exit={{ opacity: 0, y: -15, pointerEvents: 'none' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={centerPage ? '' : 'dashboard-content-wrapper'}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;