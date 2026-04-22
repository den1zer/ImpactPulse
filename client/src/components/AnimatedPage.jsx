import React from 'react';
import { motion } from 'framer-motion';

const animations = {
  initial: { opacity: 0, y: 15 }, 
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 }, 
};

const AnimatedPage = ({ children, centerPage = false }) => {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={centerPage ? '' : 'dashboard-content-wrapper'}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;