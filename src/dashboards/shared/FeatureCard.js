import React from 'react';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color = 'text-iv-indigo', 
  bgGradient,
  onClick, 
  delay = 0,
  available = true,
  isPremium = false,
  badge
}) => {
  return (
    <GlassCard 
      className={`relative h-full flex flex-col p-6 transition-all duration-500 group overflow-hidden ${
        !available 
          ? 'opacity-70 grayscale-[0.5]' 
          : 'hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:-translate-y-2'
      }`}
      hoverEffect={false} // We handle hover manually here for more complex effects
      onClick={available ? onClick : undefined}
      delay={delay}
    >
      {/* Dynamic Background Mesh Gradient on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_50%)] animate-spin-slow pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.05)_0%,transparent_50%)] animate-spin-reverse-slow pointer-events-none" />
      </div>

      {/* Decorative Top Highlight Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isPremium ? 'from-iv-indigo via-purple-500 to-iv-indigo' : 'from-transparent via-iv-indigo/30 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-5">
          <div className={`
            p-3.5 rounded-2xl 
            bg-white/40
            shadow-[0_4px_12px_rgba(0,0,0,0.05)]
            border border-white/60
            backdrop-blur-md
            group-hover:scale-110 
            group-hover:bg-white/60
            group-hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]
            transition-all duration-300 ease-out
          `}>
            <Icon className={`w-8 h-8 ${color}`} strokeWidth={1.5} />
          </div>
          
          <div className="flex gap-2">
            {!available && (
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-iv-muted bg-gray-100/80 rounded-full border border-gray-200 uppercase">
                Soon
              </span>
            )}
            {badge && (
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-white bg-gradient-to-r from-iv-indigo to-purple-600 rounded-full shadow-sm uppercase">
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-xl font-bold text-iv-text mb-2 group-hover:text-iv-indigo transition-colors duration-300">
            {title}
          </h3>
          
          <p className="text-sm text-iv-muted leading-relaxed font-medium group-hover:text-gray-600 transition-colors duration-300">
            {description}
          </p>
        </div>

        {isPremium ? (
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-iv-indigo/5 to-purple-500/5 border border-iv-indigo/10 group-hover:border-iv-indigo/20 transition-colors">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-iv-indigo opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-iv-indigo"></span>
                </span>
                <span className="text-xs font-bold text-iv-indigo tracking-wide">AI POWERED</span>
              </div>
              <motion.span 
                className="text-iv-indigo"
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
              >
                →
              </motion.span>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-6 flex items-center text-xs font-semibold text-iv-indigo opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <span>Access Tool</span>
            <span className="ml-1">→</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default FeatureCard;
