import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ onClose, onSettings, onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`;
  const role = (user?.role || '').toUpperCase();

  return (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
      <div className="px-3 py-2 border-b flex items-center gap-3">
        <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
                <span className="text-indigo-600 font-semibold text-lg">
                    {(user?.profile?.firstName?.[0] || name?.[0] || 'U').toUpperCase()}
                </span>
            )}
        </div>
        <div className="overflow-hidden">
            <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
            <div className="text-xs text-indigo-600 font-semibold truncate">{role}</div>
        </div>
      </div>
      <div className="py-1">
        <button onClick={() => { navigate('/profile'); onClose?.(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><User className="h-4 w-4" /> View Profile</button>
        <button onClick={() => { navigate('/settings'); onClose?.(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</button>
        <button onClick={() => { onLogout?.(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </div>
  );
};

export default ProfileDropdown;

