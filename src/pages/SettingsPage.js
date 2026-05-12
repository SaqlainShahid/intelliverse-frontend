import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Bell, Shield, Save, X, Eye, EyeOff, User, Fingerprint, Lock,
  Camera, CheckCircle2, ChevronRight, ShieldCheck, ShieldOff, KeyRound, Smartphone
} from 'lucide-react';
import { getTheme } from '../styles/theme';
import authService from '../services/authService';

const SettingsPage = () => {
  const { user, checkAuthStatus } = useAuth();
  const theme  = getTheme(user?.role);
  const rgb    = theme.primaryRgb || '79, 70, 229';
  const p      = (a = 1)   => `rgba(${rgb},${a})`;
  const primary = p(1);

  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    displayName: '', phone: '', avatar: '',
    notificationsEnabled: true, emailNotifications: true,
    twoFactorEnabled: true,
    canMessage: 'everyone', profileVisibility: 'everyone',
  });

  const [passwordOpen,    setPasswordOpen]    = useState(false);
  const [passwordStep,    setPasswordStep]    = useState(1);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPw,       setShowNewPw]       = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [passwordData,    setPasswordData]    = useState({
    email: '', otpCode: '', newPassword: '', confirmPassword: '',
  });

  // 2FA toggle verification modal
  const [twoFaModal,     setTwoFaModal]     = useState(false);   // open/closed
  const [twoFaIntent,    setTwoFaIntent]    = useState(true);    // what the user WANTS to change TO
  const [twoFaStep,      setTwoFaStep]      = useState(1);       // 1=send, 2=verify
  const [twoFaCode,      setTwoFaCode]      = useState('');
  const [twoFaLoading,   setTwoFaLoading]   = useState(false);

  const open2FaModal = (newValue) => {
    setTwoFaIntent(newValue);
    setTwoFaStep(1);
    setTwoFaCode('');
    setTwoFaModal(true);
  };

  const close2FaModal = () => {
    setTwoFaModal(false);
    setTwoFaCode('');
    setTwoFaStep(1);
    setTwoFaLoading(false);
  };

  const send2FaOtp = async () => {
    setTwoFaLoading(true);
    try {
      const res = await api.post('/user/2fa/send-otp');
      if (res.data.success) { toast.success('Verification code sent to your email'); setTwoFaStep(2); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to send verification code'); }
    finally { setTwoFaLoading(false); }
  };

  const verify2FaToggle = async () => {
    if (!twoFaCode) return toast.error('Enter the code');
    setTwoFaLoading(true);
    try {
      const res = await api.post('/user/2fa/toggle', { otpCode: twoFaCode, enable: twoFaIntent });
      if (res.data.success) {
        // Patch localStorage NOW so checkAuthStatus reads the updated value
        // (checkAuthStatus returns early from localStorage cache, so we must update it first)
        try {
          const raw = localStorage.getItem('user');
          if (raw) {
            const u = JSON.parse(raw);
            if (!u.preferences) u.preferences = {};
            u.preferences.twoFactorEnabled = twoFaIntent;
            localStorage.setItem('user', JSON.stringify(u));
          }
        } catch {}

        // Update form state immediately so UI reflects the change
        setFormData(prev => ({ ...prev, twoFactorEnabled: twoFaIntent }));
        toast.success(res.data.message);
        close2FaModal();
        await checkAuthStatus();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setTwoFaLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    setFormData({
      displayName:          user.profile?.displayName      || '',
      phone:                user.profile?.phone            || '',
      avatar:               user.profile?.avatar           || '',
      notificationsEnabled: user.preferences?.notificationsEnabled ?? true,
      emailNotifications:   user.preferences?.emailNotifications   ?? true,
      twoFactorEnabled:     user.preferences?.twoFactorEnabled     ?? true,
      canMessage:           user.privacy?.canMessage        || 'everyone',
      profileVisibility:    user.privacy?.profileVisibility || 'everyone',
    });
    setPasswordData(prev => ({ ...prev, email: user.email || '' }));
  }, [user]);

  const handleToggle = key => setFormData(p => ({ ...p, [key]: !p[key] }));
  const handleField  = e  => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/user/profile', {
        displayName: formData.displayName?.trim(), phone: formData.phone?.trim(),
        avatar: formData.avatar?.trim(), notificationsEnabled: formData.notificationsEnabled,
        emailNotifications: formData.emailNotifications, twoFactorEnabled: formData.twoFactorEnabled,
        canMessage: formData.canMessage, profileVisibility: formData.profileVisibility,
      });
      const updated = res?.data?.data?.user;
      if (updated) localStorage.setItem('user', JSON.stringify(updated));
      await checkAuthStatus();
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const closePasswordModal = () => {
    setPasswordOpen(false); setPasswordStep(1); setPasswordLoading(false);
    setShowNewPw(false); setShowConfirmPw(false);
    setPasswordData(prev => ({ email: prev.email, otpCode: '', newPassword: '', confirmPassword: '' }));
  };
  const sendOtp = async () => {
    if (!passwordData.email) return toast.error('Email missing');
    setPasswordLoading(true);
    try {
      const r = await authService.sendForgotPasswordOTP(passwordData.email);
      if (r.success) { toast.success('Code sent to your email'); setPasswordStep(2); }
      else toast.error(r.message);
    } catch { toast.error('Failed to send code'); }
    finally { setPasswordLoading(false); }
  };
  const verifyOtp = async () => {
    if (!passwordData.otpCode) return toast.error('Enter the code');
    setPasswordLoading(true);
    try {
      const r = await authService.verifyForgotPasswordOTP(passwordData.email, passwordData.otpCode);
      if (r.success) { toast.success('Code verified'); setPasswordStep(3); }
      else toast.error(r.message);
    } catch { toast.error('Verification failed'); }
    finally { setPasswordLoading(false); }
  };
  const doResetPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('Passwords do not match');
    if (passwordData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setPasswordLoading(true);
    try {
      const r = await authService.resetPassword(passwordData.email, passwordData.otpCode, passwordData.newPassword);
      if (r.success) { toast.success('Password updated'); closePasswordModal(); }
      else toast.error(r.message);
    } catch { toast.error('Password update failed'); }
    finally { setPasswordLoading(false); }
  };

  /* ── Reusable sub-components ── */
  const Toggle = ({ checked, onChange }) => (
    <button onClick={onChange}
      className="relative inline-flex h-7 w-[52px] items-center rounded-full transition-all duration-300 focus:outline-none flex-shrink-0"
      style={{ background: checked ? primary : '#e5e7eb', boxShadow: checked ? `0 0 0 3px ${p(0.12)}` : 'none' }}>
      <span className="inline-block h-[22px] w-[22px] rounded-full bg-white shadow-md transition-transform duration-300"
        style={{ transform: checked ? 'translateX(26px)' : 'translateX(3px)' }} />
    </button>
  );

  const FieldLabel = ({ children }) => (
    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: p(0.7) }}>
      {children}
    </label>
  );

  const Input = ({ className = '', ...props }) => (
    <input
      {...props}
      className={`w-full h-12 px-4 text-sm text-gray-800 rounded-xl outline-none transition-all duration-200 ${className}`}
      style={{
        background: '#f9fafb',
        border: '1.5px solid #f0f0f2',
        ...(props.disabled ? { color: '#9ca3af', cursor: 'not-allowed', background: '#f3f4f6' } : {}),
        ...props.style,
      }}
      onFocus={e => { if (!props.disabled) { e.target.style.background = '#fff'; e.target.style.borderColor = p(0.4); e.target.style.boxShadow = `0 0 0 3px ${p(0.07)}`; } }}
      onBlur={e => { e.target.style.background = props.disabled ? '#f3f4f6' : '#f9fafb'; e.target.style.borderColor = '#f0f0f2'; e.target.style.boxShadow = 'none'; }}
    />
  );

  const Select = ({ children, ...props }) => (
    <select
      {...props}
      className="w-full h-12 px-4 text-sm text-gray-800 rounded-xl outline-none transition-all duration-200 cursor-pointer appearance-none"
      style={{ background: '#f9fafb', border: '1.5px solid #f0f0f2' }}
      onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = p(0.4); e.target.style.boxShadow = `0 0 0 3px ${p(0.07)}`; }}
      onBlur={e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#f0f0f2'; e.target.style.boxShadow = 'none'; }}
    >
      {children}
    </select>
  );

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: User,        desc: 'Your information' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,        desc: 'Alerts & emails' },
    { id: 'security',      label: 'Security',       icon: Lock,        desc: 'Password & access' },
    { id: 'privacy',       label: 'Privacy',        icon: Fingerprint, desc: 'Visibility settings' },
  ];

  // dots overlay for premium feel
  const dotsOverlay = {
    position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
    backgroundImage: `radial-gradient(circle, ${p(0.06)} 1px, transparent 1px)`,
    backgroundSize: '18px 18px',
    maskImage: `radial-gradient(ellipse 75% 65% at 100% 0%, black 0%, transparent 70%)`,
    WebkitMaskImage: `radial-gradient(ellipse 75% 65% at 100% 0%, black 0%, transparent 70%)`,
  };

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #fff 0%, #fafafa 40%, #fff5f6 100%)' }}>

      {/* ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${p(0.06)} 0%, transparent 70%)` }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.65)})`, boxShadow: `0 8px 24px ${p(0.30)}` }}>
              <div style={dotsOverlay} />
              <Shield size={22} className="relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Settings</h1>
              <p className="text-xs text-gray-400 mt-1 font-medium">Manage your account & preferences</p>
            </div>
          </div>
          <button
            onClick={saveSettings} disabled={saving}
            className="flex items-center gap-2.5 px-6 h-11 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.75)})`, boxShadow: `0 6px 20px ${p(0.30)}` }}
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {/* user mini card */}
              <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)', background: `linear-gradient(135deg, ${p(0.04)}, transparent)` }}>
                <div className="flex items-center gap-3">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2" style={{ borderColor: p(0.2) }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black"
                      style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.7)})` }}>
                      {(user?.profile?.displayName || user?.profile?.firstName || user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.profile?.displayName || (user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : 'My Account')}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.role?.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* nav items */}
              <div className="p-2 space-y-0.5">
                {tabs.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group"
                      style={active ? {
                        background: `linear-gradient(135deg, ${p(0.10)}, ${p(0.05)})`,
                        border: `1px solid ${p(0.15)}`,
                      } : {
                        background: 'transparent', border: '1px solid transparent',
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                        style={active ? {
                          background: `linear-gradient(135deg, ${p(1)}, ${p(0.75)})`,
                          boxShadow: `0 4px 12px ${p(0.25)}`,
                        } : {
                          background: 'rgba(0,0,0,0.04)',
                        }}>
                        <tab.icon size={14} style={{ color: active ? '#fff' : '#9ca3af' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-none mb-0.5" style={{ color: active ? primary : '#374151' }}>
                          {tab.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{tab.desc}</p>
                      </div>
                      {active && <ChevronRight size={13} style={{ color: p(0.5) }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Content Panel ── */}
          <div className="lg:col-span-3">

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl overflow-hidden relative" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>
                <div style={dotsOverlay} />
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${p(1)}, ${p(0.5)}, ${p(0.2)})` }} />

                {/* card header */}
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.7)})`, boxShadow: `0 4px 12px ${p(0.25)}` }}>
                      <User size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Profile</h2>
                      <p className="text-[11px] text-gray-400">Your public information</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold text-emerald-600" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <CheckCircle2 size={12} />
                    Saved
                  </div>
                </div>

                <div className="p-6 space-y-6 relative z-10">
                  {/* avatar preview strip */}
                  {formData.avatar && (
                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: p(0.04), border: `1px solid ${p(0.10)}` }}>
                      <img src={formData.avatar} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: p(0.2) }} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Profile photo set</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{formData.avatar}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <FieldLabel>Email Address</FieldLabel>
                      <div className="relative">
                        <Input value={user?.email || ''} disabled />
                        <Shield size={13} className="absolute right-4 top-4 text-gray-300" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Display Name</FieldLabel>
                      <Input name="displayName" value={formData.displayName} onChange={handleField} placeholder="Your name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input name="phone" value={formData.phone} onChange={handleField} placeholder="+92 XXX XXXXXXX" />
                    </div>
                    <div>
                      <FieldLabel>Profile Photo</FieldLabel>
                      <div className="flex gap-2">
                        <Input name="avatar" value={formData.avatar} onChange={handleField} placeholder="Paste image URL" />
                        <label className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl cursor-pointer text-white transition-opacity hover:opacity-85"
                          style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.75)})`, boxShadow: `0 4px 14px ${p(0.28)}` }} title="Upload photo">
                          <Camera size={15} />
                          <input type="file" accept="image/*" className="hidden" onChange={async e => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const tid = toast.loading('Uploading…');
                            try {
                              const form = new FormData(); form.append('avatar', file);
                              const res = await api.post('/user/upload-avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                              const url = res?.data?.data?.url;
                              if (url) { setFormData(p => ({ ...p, avatar: url })); toast.success('Photo uploaded', { id: tid }); }
                            } catch { toast.error('Upload failed', { id: tid }); }
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl overflow-hidden relative" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>
                <div style={dotsOverlay} />
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${p(1)}, ${p(0.5)}, ${p(0.2)})` }} />
                <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.7)})`, boxShadow: `0 4px 12px ${p(0.25)}` }}>
                    <Bell size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                    <p className="text-[11px] text-gray-400">Control how you receive alerts</p>
                  </div>
                </div>

                <div className="p-6 space-y-3 relative z-10">
                  {[
                    { key: 'notificationsEnabled', label: 'Push Notifications', sub: 'Real-time alerts for platform activities', icon: '🔔' },
                    { key: 'emailNotifications',   label: 'Email Notifications', sub: 'Monthly digest reports sent to your inbox', icon: '📧' },
                  ].map(item => (
                    <div key={item.key}
                      className="flex items-center justify-between p-5 rounded-xl transition-all duration-200 cursor-pointer group"
                      style={{ border: `1px solid ${formData[item.key] ? p(0.12) : 'rgba(0,0,0,0.05)'}`, background: formData[item.key] ? p(0.03) : '#fafafa' }}
                      onClick={() => handleToggle(item.key)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: formData[item.key] ? p(0.08) : 'rgba(0,0,0,0.04)' }}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                      <Toggle checked={formData[item.key]} onChange={() => handleToggle(item.key)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="rounded-2xl overflow-hidden relative" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>
                <div style={dotsOverlay} />
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${p(1)}, ${p(0.5)}, ${p(0.2)})` }} />
                <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.7)})`, boxShadow: `0 4px 12px ${p(0.25)}` }}>
                    <Lock size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Security</h2>
                    <p className="text-[11px] text-gray-400">Manage your password and access</p>
                  </div>
                </div>

                <div className="p-6 space-y-3 relative z-10">

                  {/* ── 2FA Toggle Card ── */}
                  <div className="rounded-2xl overflow-hidden" style={{
                    border: formData.twoFactorEnabled ? `1.5px solid ${p(0.20)}` : '1.5px solid rgba(245,158,11,0.30)',
                    background: formData.twoFactorEnabled ? p(0.03) : 'rgba(255,251,235,0.8)',
                    transition: 'all 0.3s ease',
                  }}>
                    {/* coloured top bar */}
                    <div className="h-[3px]" style={{
                      background: formData.twoFactorEnabled
                        ? `linear-gradient(90deg,${p(1)},${p(0.5)})`
                        : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                    }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* icon */}
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                            style={{
                              background: formData.twoFactorEnabled
                                ? `linear-gradient(135deg,${p(1)},${p(0.7)})`
                                : 'linear-gradient(135deg,#f59e0b,#d97706)',
                              boxShadow: formData.twoFactorEnabled
                                ? `0 4px 14px ${p(0.28)}`
                                : '0 4px 14px rgba(245,158,11,0.28)',
                            }}>
                            {formData.twoFactorEnabled
                              ? <ShieldCheck size={18} />
                              : <ShieldOff size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={formData.twoFactorEnabled
                                  ? { background: p(0.10), color: primary }
                                  : { background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
                                {formData.twoFactorEnabled ? 'ON' : 'OFF'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                              {formData.twoFactorEnabled
                                ? 'A verification code is sent to your email each time you sign in.'
                                : 'Sign-in code is disabled. You will be logged in with password only.'}
                            </p>
                          </div>
                        </div>
                        <Toggle
                          checked={formData.twoFactorEnabled}
                          onChange={() => open2FaModal(!formData.twoFactorEnabled)}
                        />
                      </div>

                      {/* warning when disabled */}
                      {!formData.twoFactorEnabled && (
                        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
                          <ShieldOff size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#d97706' }} />
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            Disabling 2FA reduces your account security. Anyone with your password can sign in without a code.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── 2FA method info ── */}
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.06)', background: '#fafafa' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.08)' }}>
                      <Smartphone size={15} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Verification Method</p>
                      <p className="text-xs text-gray-400 mt-0.5">Email OTP — code sent to <span className="font-medium text-gray-600">{user?.email}</span></p>
                    </div>
                    <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold text-indigo-600"
                      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      Active
                    </span>
                  </div>

                  {/* ── Change password ── */}
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.06)', background: '#fafafa' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p(0.07) }}>
                        <KeyRound size={15} style={{ color: primary }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Password</p>
                        <p className="text-xs text-gray-400 mt-0.5">Change your account password</p>
                      </div>
                    </div>
                    <button onClick={() => setPasswordOpen(true)}
                      className="flex items-center gap-2 px-4 h-9 text-sm font-semibold rounded-lg transition-all hover:-translate-y-0.5"
                      style={{ background: `linear-gradient(135deg,${p(1)},${p(0.75)})`, color: '#fff', boxShadow: `0 4px 12px ${p(0.22)}` }}>
                      <KeyRound size={12} />
                      Change
                    </button>
                  </div>

                  {/* ── account email ── */}
                  <div className="p-4 rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.06)', background: '#fafafa' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                        <Shield size={15} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Account Email</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: primary }}>{user?.email}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Contact support to change your email.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="rounded-2xl overflow-hidden relative" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>
                <div style={dotsOverlay} />
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${p(1)}, ${p(0.5)}, ${p(0.2)})` }} />
                <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.7)})`, boxShadow: `0 4px 12px ${p(0.25)}` }}>
                    <Fingerprint size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Privacy</h2>
                    <p className="text-[11px] text-gray-400">Control who can see and contact you</p>
                  </div>
                </div>

                <div className="p-6 space-y-5 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <FieldLabel>Who can message me</FieldLabel>
                      <Select value={formData.canMessage} onChange={e => setFormData(p => ({ ...p, canMessage: e.target.value }))}>
                        <option value="everyone">Everyone</option>
                        <option value="department">My department only</option>
                        <option value="faculty_only">Faculty only</option>
                        <option value="none">No one</option>
                      </Select>
                    </div>
                    <div>
                      <FieldLabel>Profile visibility</FieldLabel>
                      <Select value={formData.profileVisibility} onChange={e => setFormData(p => ({ ...p, profileVisibility: e.target.value }))}>
                        <option value="everyone">Everyone</option>
                        <option value="department">My department only</option>
                        <option value="faculty_only">Faculty only</option>
                        <option value="private">Private</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── 2FA Toggle Verification Modal ── */}
      {twoFaModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close2FaModal} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={dotsOverlay} />
            {/* coloured bar — amber when disabling, primary when enabling */}
            <div className="h-[3px]" style={{
              background: twoFaIntent
                ? `linear-gradient(90deg,${p(1)},${p(0.4)})`
                : 'linear-gradient(90deg,#f59e0b,#fbbf24)'
            }} />

            {/* header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{
                    background: twoFaIntent
                      ? `linear-gradient(135deg,${p(1)},${p(0.75)})`
                      : 'linear-gradient(135deg,#f59e0b,#d97706)',
                    boxShadow: twoFaIntent ? `0 4px 12px ${p(0.25)}` : '0 4px 12px rgba(245,158,11,0.28)'
                  }}>
                  {twoFaIntent ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {twoFaIntent ? 'Enable' : 'Disable'} Two-Factor Auth
                  </h3>
                  <p className="text-[11px] text-gray-400">Verify your identity to continue</p>
                </div>
              </div>
              <button onClick={close2FaModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* step bar */}
            <div className="px-6 pt-4 flex gap-2">
              {[1, 2].map(s => (
                <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: s <= twoFaStep
                      ? (twoFaIntent ? `linear-gradient(90deg,${p(1)},${p(0.6)})` : 'linear-gradient(90deg,#f59e0b,#fbbf24)')
                      : '#e5e7eb'
                  }} />
              ))}
            </div>

            <div className="p-6 relative z-10">
              {/* Step 1 — confirm intent & send code */}
              {twoFaStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-sm text-gray-600"
                    style={{
                      background: twoFaIntent ? p(0.06) : 'rgba(245,158,11,0.07)',
                      border: `1px solid ${twoFaIntent ? p(0.12) : 'rgba(245,158,11,0.20)'}`
                    }}>
                    {twoFaIntent
                      ? <>A verification code will be sent to <span className="font-semibold" style={{ color: primary }}>{user?.email}</span> to confirm enabling 2FA.</>
                      : <>You are about to <span className="font-semibold text-amber-600">disable</span> two-factor authentication. A code will be sent to <span className="font-semibold text-amber-700">{user?.email}</span> to confirm.</>
                    }
                  </div>
                  <button onClick={send2FaOtp} disabled={twoFaLoading}
                    className="w-full h-11 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: twoFaIntent
                        ? `linear-gradient(135deg,${p(1)},${p(0.75)})`
                        : 'linear-gradient(135deg,#f59e0b,#d97706)',
                      boxShadow: twoFaIntent ? `0 4px 14px ${p(0.25)}` : '0 4px 14px rgba(245,158,11,0.28)'
                    }}>
                    {twoFaLoading ? 'Sending…' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {/* Step 2 — enter code */}
              {twoFaStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: twoFaIntent ? p(0.7) : '#d97706' }}>
                      Enter the 6-digit code
                    </label>
                    <input
                      value={twoFaCode}
                      onChange={e => setTwoFaCode(e.target.value)}
                      maxLength={6}
                      placeholder="000000"
                      className="w-full h-14 text-center text-2xl font-black tracking-widest rounded-xl outline-none transition-all"
                      style={{
                        background: '#f9fafb',
                        border: `1.5px solid ${twoFaIntent ? p(0.2) : 'rgba(245,158,11,0.3)'}`,
                        color: twoFaIntent ? primary : '#d97706'
                      }}
                    />
                  </div>
                  <button onClick={verify2FaToggle} disabled={twoFaLoading}
                    className="w-full h-11 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all hover:opacity-90"
                    style={{
                      background: twoFaIntent
                        ? `linear-gradient(135deg,${p(1)},${p(0.75)})`
                        : 'linear-gradient(135deg,#f59e0b,#d97706)',
                      boxShadow: twoFaIntent ? `0 4px 14px ${p(0.25)}` : '0 4px 14px rgba(245,158,11,0.28)'
                    }}>
                    {twoFaLoading ? 'Verifying…' : `Confirm — ${twoFaIntent ? 'Enable' : 'Disable'} 2FA`}
                  </button>
                  <button onClick={send2FaOtp} disabled={twoFaLoading}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Resend code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {passwordOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePasswordModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={dotsOverlay} />
            <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${p(1)}, ${p(0.4)})` }} />

            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.75)})`, boxShadow: `0 4px 12px ${p(0.25)}` }}>
                  <Lock size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
                  <p className="text-[11px] text-gray-400">Step {passwordStep} of 3</p>
                </div>
              </div>
              <button onClick={closePasswordModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* step bar */}
            <div className="px-6 pt-5 flex gap-2">
              {[1,2,3].map(s => (
                <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-400"
                  style={{ background: s <= passwordStep ? `linear-gradient(90deg,${p(1)},${p(0.6)})` : '#e5e7eb' }} />
              ))}
            </div>

            <div className="p-6 relative z-10">
              {passwordStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-sm text-gray-600" style={{ background: p(0.06), border: `1px solid ${p(0.12)}` }}>
                    A 6-digit code will be sent to{' '}
                    <span className="font-semibold" style={{ color: primary }}>{passwordData.email}</span>
                  </div>
                  <button onClick={sendOtp} disabled={passwordLoading}
                    className="w-full h-11 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.75)})`, boxShadow: `0 4px 14px ${p(0.25)}` }}>
                    {passwordLoading ? 'Sending…' : 'Send Reset Code'}
                  </button>
                </div>
              )}
              {passwordStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: p(0.7) }}>
                      Enter the 6-digit code
                    </label>
                    <input value={passwordData.otpCode}
                      onChange={e => setPasswordData(p => ({ ...p, otpCode: e.target.value }))}
                      maxLength={6} placeholder="000000"
                      className="w-full h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl outline-none transition-all"
                      style={{ background: '#f9fafb', border: `1.5px solid ${p(0.2)}`, color: primary }} />
                  </div>
                  <button onClick={verifyOtp} disabled={passwordLoading}
                    className="w-full h-11 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${p(1)}, ${p(0.75)})`, boxShadow: `0 4px 14px ${p(0.25)}` }}>
                    {passwordLoading ? 'Verifying…' : 'Verify Code'}
                  </button>
                  <button onClick={sendOtp} disabled={passwordLoading}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Resend code
                  </button>
                </div>
              )}
              {passwordStep === 3 && (
                <div className="space-y-4">
                  {[
                    { label: 'New Password',     key: 'newPassword',     show: showNewPw,     toggle: () => setShowNewPw(!showNewPw) },
                    { label: 'Confirm Password', key: 'confirmPassword', show: showConfirmPw, toggle: () => setShowConfirmPw(!showConfirmPw) },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: p(0.7) }}>{f.label}</label>
                      <div className="relative">
                        <input type={f.show ? 'text' : 'password'} value={passwordData[f.key]}
                          onChange={e => setPasswordData(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full h-12 px-4 pr-10 text-sm rounded-xl outline-none transition-all"
                          style={{ background: '#f9fafb', border: '1.5px solid #f0f0f2' }} />
                        <button onClick={f.toggle} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                          {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={doResetPassword} disabled={passwordLoading}
                    className="w-full h-11 text-white text-sm font-semibold rounded-xl mt-2 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#10b981,#14b8a6)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                    {passwordLoading ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
