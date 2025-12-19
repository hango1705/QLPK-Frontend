import { Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedRoutesProps {
  children: ReactNode;
}

export const AnimatedRoutes = ({ children }: AnimatedRoutesProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {children}
      </Routes>
    </AnimatePresence>
  );
};

