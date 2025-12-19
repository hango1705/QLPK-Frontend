import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageWrapperProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const PageWrapper = ({ children }: PageWrapperProps) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
};

