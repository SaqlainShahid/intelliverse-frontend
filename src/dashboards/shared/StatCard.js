import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'text-iv-indigo',
  delay = 0 
}) => {
  return (
    <GlassCard 
      className="p-4 flex items-center space-x-4"
      delay={delay}
      hoverEffect
    >
      <div className={`
        p-2.5 rounded-lg 
        bg-iv-indigo/5
        border border-iv-indigo/10
      `}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-iv-text">{value}</p>
        <p className="text-xs font-semibold text-iv-muted uppercase tracking-wider">{label}</p>
      </div>
    </GlassCard>
  );
};

export default StatCard;
