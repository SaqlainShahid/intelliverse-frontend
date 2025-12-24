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
    <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
      <div className="flex items-center">
        <div className={`bg-indigo-600 bg-gradient-to-br ${gradientClasses[color] || gradientClasses.indigo} p-3 rounded-lg shadow-sm`}> 
          {Icon ? (
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          ) : (
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
          {trend && (
            <p className={`text-sm ${trendColor}`}>{trend} from last month</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
