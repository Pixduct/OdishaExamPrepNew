import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, useLocation } from 'react-router-dom';
import LoadingPortal from './LoadingPortal';

const pageVariants = {
  initial: { opacity: 0, scale: 0.985, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.985, y: -6 },
};

export default function AnimatedRoutes({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingPortal />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Routes location={location}>
            {children}
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}
