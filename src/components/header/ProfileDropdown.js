import React from 'react';
import { User, Settings, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ onClose, onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const name = user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`;
  const designation = user?.profile?.designation;
  const role = user?.role === 'faculty' && designation
    ? designation
    : (user?.role || '').toUpperCase();

  const menuItems = [
    { label: 'View Profile', icon: User, path: '/profile', color: 'text-gray-600' },
    { label: 'Account Settings', icon: Settings, path: '/settings', color: 'text-gray-600' },
  ];

  return (
    <div className="absolute right-0 mt-4 w-64 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[2000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header Capsule */}
      <div className={`p-5 flex flex-col items-center text-center ${isAdmin ? 'bg-rose-50/50' : 'bg-indigo-50/50'}`}>
        <div className={`w-16 h-16 rounded-full p-1 border-2 ${isAdmin ? 'border-rose-500' : 'border-indigo-500'} mb-3 shadow-md`}>
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
                <span className={`font-black text-xl ${isAdmin ? 'text-rose-600' : 'text-indigo-600'}`}>
                    {(name?.[0] || 'U').toUpperCase()}
                </span>
            )}
          </div>
        </div>
        <div className="w-full overflow-hidden">
            <div className="text-[15px] font-bold text-gray-900 truncate px-2">{name}</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {isAdmin && <ShieldCheck className="w-3 h-3 text-rose-600" />}
              <div className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-rose-600' : 'text-indigo-600'}`}>{role}</div>
            </div>
        </div>
      </div>

      {/* Action List */}
      <div className="p-2">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => { navigate(item.path); onClose?.(); }} 
            className="w-full group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">{item.label}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-all group-hover:translate-x-0.5" />
          </button>
        ))}
        
        <div className="h-px bg-gray-100 my-2 mx-2"></div>

        <button 
          onClick={() => { onLogout?.(); }} 
          className="w-full group flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100/50 text-red-600">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-red-600">Sign Out</span>
          </div>
        </button>
      </div>

      <div className={`p-3 text-center border-t border-gray-50 ${isAdmin ? 'bg-rose-50/20' : 'bg-indigo-50/20'}`}>
         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Security Verified Access</p>
      </div>
    </div>
  );
};

export default ProfileDropdown;

