import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Bell, 
  Moon, 
  Shield, 
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import authService from '../services/authService';

const SettingsPage = () => {
  const { user, checkAuthStatus } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    avatar: '',
    notificationsEnabled: true,
    emailNotifications: true,
    darkMode: false,
    canMessage: 'everyone',
    profileVisibility: 'everyone'
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) return;

    setFormData({
      displayName: user.profile?.displayName || '',
      phone: user.profile?.phone || '',
      avatar: user.profile?.avatar || '',
      notificationsEnabled: user.preferences?.notificationsEnabled ?? true,
      emailNotifications: user.preferences?.emailNotifications ?? true,
      darkMode: user.preferences?.darkMode ?? false,
      canMessage: user.privacy?.canMessage || 'everyone',
      profileVisibility: user.privacy?.profileVisibility || 'everyone'
    });

    setPasswordData((p) => ({ ...p, email: user.email || '' }));
  }, [user]);

  const handleToggle = (key) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await api.put('/user/profile', {
        displayName: formData.displayName?.trim(),
        phone: formData.phone?.trim(),
      avatar: formData.avatar?.trim(),
      notificationsEnabled: formData.notificationsEnabled,
      emailNotifications: formData.emailNotifications,
      darkMode: formData.darkMode,
      canMessage: formData.canMessage,
      profileVisibility: formData.profileVisibility
    });
      const updatedUser = response?.data?.data?.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      await checkAuthStatus();
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closePasswordModal = () => {
    setPasswordOpen(false);
    setPasswordStep(1);
    setPasswordLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordData((p) => ({
      email: p.email,
      otpCode: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const sendPasswordOtp = async () => {
    if (!passwordData.email) {
      toast.error('Email is missing');
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await authService.sendForgotPasswordOTP(passwordData.email);
      if (result.success) {
        toast.success('Reset code sent to your email!');
        setPasswordStep(2);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to send reset code. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const verifyPasswordOtp = async () => {
    if (!passwordData.otpCode) {
      toast.error('Enter the reset code');
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await authService.verifyForgotPasswordOTP(passwordData.email, passwordData.otpCode);
      if (result.success) {
        toast.success('Code verified! Set your new password.');
        setPasswordStep(3);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await authService.resetPassword(
        passwordData.email,
        passwordData.otpCode,
        passwordData.newPassword
      );
      if (result.success) {
        toast.success('Password updated successfully');
        closePasswordModal();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Password update failed. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-iv-bg text-iv-text font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-iv-indigo/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-iv-emerald/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-iv-text via-iv-indigo to-iv-text tracking-tight mb-8">
          Account Settings
        </h1>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
            <div className="p-6 border-b border-iv-border">
              <h2 className="text-xl font-bold text-iv-text">Account</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Email</label>
                  <input
                    value={user?.email || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm text-iv-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Display Name</label>
                  <input
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                    placeholder="Your display name"
                  />
                </div>
              </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-iv-text mb-1">Phone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                    placeholder="e.g. +92 3xx xxxxxxx"
                  />
        </div>
        <div>
          <label className="block text-sm font-medium text-iv-text mb-1">Avatar URL</label>
          <input
            name="avatar"
            value={formData.avatar}
            onChange={handleFieldChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
            placeholder="https://..."
          />
          <div className="mt-2 flex items-center gap-2">
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const form = new FormData();
                form.append('avatar', file);
                const res = await api.post('/user/upload-avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                const url = res?.data?.data?.url;
                if (url) setFormData((prev) => ({ ...prev, avatar: url }));
              } catch {}
            }} />
            <span className="text-xs text-iv-muted">Upload to Cloudinary</span>
          </div>
        </div>
      </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
            <div className="p-6 border-b border-iv-border">
              <h2 className="text-xl font-bold text-iv-text flex items-center gap-2">
                <Bell className="h-5 w-5 text-iv-indigo" />
                Notifications
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-iv-text">Push Notifications</p>
                  <p className="text-sm text-iv-muted">Receive notifications about updates and activities</p>
                </div>
                <button
                  onClick={() => handleToggle('notificationsEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.notificationsEnabled ? 'bg-iv-indigo' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-iv-text">Email Notifications</p>
                  <p className="text-sm text-iv-muted">Get emails for important announcements</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.emailNotifications ? 'bg-iv-indigo' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
        <div className="p-6 border-b border-iv-border">
          <h2 className="text-xl font-bold text-iv-text flex items-center gap-2">
            Privacy
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-iv-text mb-1">Who can message me</label>
            <select
              value={formData.canMessage}
              onChange={(e) => setFormData((p) => ({ ...p, canMessage: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="department">My Department</option>
              <option value="faculty_only">Faculty/Admin Only</option>
              <option value="none">No one</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-iv-text mb-1">Who can see my profile</label>
            <select
              value={formData.profileVisibility}
              onChange={(e) => setFormData((p) => ({ ...p, profileVisibility: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="department">My Department</option>
              <option value="faculty_only">Faculty/Admin Only</option>
              <option value="private">Only Me</option>
            </select>
          </div>
        </div>
      </div>

          {/* Security Section */}
          <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
            <div className="p-6 border-b border-iv-border">
              <h2 className="text-xl font-bold text-iv-text flex items-center gap-2">
                <Shield className="h-5 w-5 text-iv-indigo" />
                Security
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-iv-text">Change Password</p>
                  <p className="text-sm text-iv-muted">Update your password regularly for security</p>
                </div>
                <button
                  onClick={() => setPasswordOpen(true)}
                  className="bg-white text-iv-muted border border-gray-200 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 hover:text-iv-indigo transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
            <div className="p-6 border-b border-iv-border">
              <h2 className="text-xl font-bold text-iv-text flex items-center gap-2">
                <Moon className="h-5 w-5 text-iv-indigo" />
                Appearance
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-iv-text">Dark Mode</p>
                  <p className="text-sm text-iv-muted">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={() => handleToggle('darkMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.darkMode ? 'bg-iv-indigo' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-iv-indigo text-white px-6 py-2 rounded-xl font-medium shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:bg-indigo-600 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>

      {passwordOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePasswordModal} aria-hidden="true" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-iv-text">Change Password</p>
                <p className="text-sm text-iv-muted">
                  {passwordStep === 1 && 'Send a reset code to your email'}
                  {passwordStep === 2 && 'Enter the code from your email'}
                  {passwordStep === 3 && 'Set your new password'}
                </p>
              </div>
              <button
                onClick={closePasswordModal}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {passwordStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-iv-text mb-1">Email</label>
                    <input
                      value={passwordData.email}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-600"
                    />
                  </div>
                  <button
                    onClick={sendPasswordOtp}
                    disabled={passwordLoading}
                    className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-xl text-white bg-iv-indigo hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {passwordLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </div>
              )}

              {passwordStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-sm text-blue-800">
                      Reset code sent to <span className="font-semibold">{passwordData.email}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-iv-text mb-1">Reset Code</label>
                    <input
                      value={passwordData.otpCode}
                      onChange={(e) => setPasswordData((p) => ({ ...p, otpCode: e.target.value }))}
                      maxLength={6}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    onClick={verifyPasswordOtp}
                    disabled={passwordLoading}
                    className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-xl text-white bg-iv-indigo hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {passwordLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Verify Code'
                    )}
                  </button>
                  <button
                    onClick={sendPasswordOtp}
                    disabled={passwordLoading}
                    className="w-full text-sm font-medium text-iv-indigo hover:text-indigo-500 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Sending...' : 'Resend Code'}
                  </button>
                  <button
                    onClick={() => setPasswordStep(1)}
                    className="w-full text-sm font-medium text-gray-600 hover:text-gray-500"
                  >
                    Back
                  </button>
                </div>
              )}

              {passwordStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-sm text-green-800">Code verified! Create your new password below.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-iv-text mb-1">New Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                        className="block w-full px-3 pr-10 py-2 border border-gray-300 rounded-xl text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label="Toggle new password visibility"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-iv-text mb-1">Confirm Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                        className="block w-full px-3 pr-10 py-2 border border-gray-300 rounded-xl text-sm focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={resetPassword}
                    disabled={passwordLoading}
                    className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-xl text-white bg-iv-indigo hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {passwordLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Reset Password'
                    )}
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
