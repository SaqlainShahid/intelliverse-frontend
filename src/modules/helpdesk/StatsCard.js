// modules/helpdesk/StatsCard.js
import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  const gradientClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  const trendColor = trend?.startsWith('-') ? 'text-red-600' : 'text-green-600';

  return (
    <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 p-6 sm:p-8 overflow-hidden group">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full pointer-events-none transition-all group-hover:scale-150 group-hover:opacity-10"></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-gray-900 drop-shadow-sm">{displayValue}</p>
          </div>
          {trend && (
            <p className={`text-xs font-bold ${trendColor} bg-gray-50 px-2 py-1 rounded inline-block`}>{trend} <span className="text-gray-400 font-medium">vs last month</span></p>
          )}
        </div>
        
        <div className={`p-4 rounded-[1.5rem] bg-gradient-to-br shadow-inner ${gradientClasses[color] || gradientClasses.indigo} transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}> 
          {Icon ? (
            <Icon className="h-7 w-7 text-white drop-shadow-md" aria-hidden="true" />
          ) : (
            <svg className="h-7 w-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
