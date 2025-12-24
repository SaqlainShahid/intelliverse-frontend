import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  onClick,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hoverEffect ? { 
        y: -4, 
        scale: 1.01,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      } : {}}
      onClick={onClick}
      className={`
        backdrop-blur-xl 
        bg-white/70 
        border border-white/40 
        rounded-[20px] 
        shadow-sm 
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
