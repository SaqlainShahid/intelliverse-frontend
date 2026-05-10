import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Clock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../../logo-intelliverse-transparent.png.png';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const Login = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', password: '', otpCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [waitingEmail, setWaitingEmail] = useState('');

  const { login, directLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleHODError = (msg) => {
    if (msg && msg.includes('pending HOD approval')) {
      setWaitingEmail(formData.email);
      setShowWaitingModal(true);
      return true;
    }
    return false;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authService.sendLoginOTP({ email: formData.email, password: formData.password });
      if (result.success) {
        if (result.skipOtp) {
          // 2FA is disabled — backend returned tokens directly
          directLogin(result.data.user);
          toast.success('Login successful!');
          navigate(from, { replace: true });
        } else {
          toast.success('Verification code sent!');
          setStep(2);
        }
      } else if (!handleHODError(result.message)) {
        toast.error(result.message);
      }
    } catch (error) {
      if (!handleHODError(error.message)) toast.error(error.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const result = await login({ email: formData.email, otpCode: formData.otpCode, deviceInfo: { deviceType: 'web', deviceId: navigator.userAgent } });
      if (result.success) { toast.success('Login successful!'); navigate(from, { replace: true }); }
      else if (!handleHODError(result.message)) toast.error(result.message);
    } catch (error) {
      if (!handleHODError(error.message)) toast.error(error.message || 'Login failed.');
    } finally { setOtpLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const result = await authService.sendLoginOTP({ email: formData.email, password: formData.password });
      if (result.success) toast.success('OTP resent!');
      else if (!handleHODError(result.message)) toast.error(result.message);
    } catch (error) {
      if (!handleHODError(error.message)) toast.error(error.message || 'Failed to resend OTP');
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="min-h-screen flex flex-col lg:flex-row font-['Inter'] relative overflow-hidden"
    >

      {/* Left: Aurora Branding Panel */}
      <div className="hidden lg:flex lg:flex-1 relative flex-col justify-center items-center p-14 overflow-hidden text-white"
        style={{ background: 'linear-gradient(145deg, #0d0a2e 0%, #1e1065 30%, #1e1b4b 60%, #0c1a3a 100%)' }}>
        {/* Ambient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full opacity-30 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)', filter: 'blur(40px)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full opacity-25 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.7) 0%, transparent 70%)', filter: 'blur(45px)', animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 right-[5%] w-64 h-64 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '1s' }}></div>

        <div className="relative z-10 max-w-md animate-fade-in text-center">
          <div className="mx-auto h-28 w-28 rounded-3xl flex items-center justify-center mb-8 transform transition hover:scale-110 hover:rotate-3 duration-500"
            style={{ filter: 'drop-shadow(0 0 20px rgba(147,197,253,0.5))' }}>
            <img src={logo} alt="IntelliVerse" className="h-full w-full object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 className="text-5xl font-[Outfit] font-extrabold tracking-tight mb-4 leading-tight">
            Welcome to<br />
            <span className="text-gradient">IntelliVerse</span>
          </h1>
          <p className="text-base text-slate-400 mb-12 leading-relaxed">
            Your intelligent campus ecosystem — powered by AI, built for you.
          </p>

          <div className="p-7 rounded-3xl text-left"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            <p className="text-sm font-medium text-violet-300 mb-1">New to IntelliVerse?</p>
            <p className="text-slate-400 text-sm mb-5">Create your account and join your smart campus community.</p>
            <Link to="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', backdropFilter: 'blur(10px)' }}>
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Form Panel — full half, no box */}
      <div className="w-full lg:flex-1 flex-shrink-0 h-screen overflow-y-auto scrollbar-hide flex flex-col"
        style={{ background: 'linear-gradient(160deg, #f8f7ff 0%, #faf5ff 40%, #f0f9ff 100%)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-10 pt-10 pb-2">
          <img src={logo} alt="IntelliVerse" className="h-10 w-10 object-contain" />
          <span className="font-[Outfit] font-bold text-slate-800 text-xl tracking-tight">IntelliVerse</span>
        </div>

        {/* Form — vertically centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[440px] mx-auto px-10 py-8 animate-slide-in">

            <div className="mb-10">
              <h2 className="text-3xl font-[Outfit] font-extrabold text-slate-900 mb-2">
                {step === 1 ? 'Sign in' : 'Check your email'}
              </h2>
              <p className="text-base text-slate-500">
                {step === 1 ? 'Enter your credentials to continue' : `Code sent to ${formData.email}`}
              </p>
            </div>

            {step === 1 ? (
              <form className="space-y-6" onSubmit={handleSendOTP}>
                <div>
                  <label htmlFor="email" className="block text-[15px] font-semibold text-slate-700 mb-2">University Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input id="email" name="email" type="email" autoComplete="email" required value={formData.email}
                      onChange={handleInputChange} className="glass-input pl-12 py-4 text-[15px]" placeholder="you@university.edu" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-[15px] font-semibold text-slate-700 mb-2">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                      required value={formData.password} onChange={handleInputChange} className="glass-input pl-12 py-4 text-[15px]" placeholder="Your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-600 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-[15px] font-semibold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1 group">
                    Forgot password?
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="glass-btn-primary py-4 text-[16px]">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Continue →'}
                  </button>
                </div>

                <div className="text-center pt-3 border-t border-slate-200/60 lg:hidden">
                  <p className="text-sm text-slate-500">
                    No account? <Link to="/signup" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">Sign up free</Link>
                  </p>
                </div>
              </form>
            ) : (
              <form className="space-y-5 animate-slide-in" onSubmit={handleVerifyOTP}>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <p className="text-sm text-slate-600 text-center">Enter the 6-digit code we sent to<br /><strong className="text-slate-900">{formData.email}</strong></p>
                </div>
                <input id="otpCode" name="otpCode" type="text" maxLength="6" required value={formData.otpCode}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-5 rounded-2xl text-slate-900 text-center text-4xl font-bold tracking-[0.6em] transition-all duration-300"
                  style={{ background: 'rgba(248,250,252,0.9)', border: '1.5px solid rgba(226,232,240,0.9)', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}
                  placeholder="••••••" />
                <div className="space-y-3 pt-1">
                  <button type="submit" disabled={otpLoading} className="glass-btn-primary py-4 text-[16px]">
                    {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Sign In →'}
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="glass-btn-secondary">← Back</button>
                    <button type="button" onClick={resendOTP} disabled={loading} className="glass-btn-secondary">
                      {loading ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* HOD Waiting Modal */}
      {showWaitingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(12px)' }}>
          <div className="glass-card w-full max-w-lg">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-[Outfit] font-bold text-slate-900">Pending HOD Approval</h2>
                <p className="text-sm text-slate-500 mt-1">Your account is under review.</p>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">A Head of Department needs to approve your registration for <strong>{waitingEmail}</strong> before you can log in.</p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setShowWaitingModal(false); setStep(1); setFormData({ email: '', password: '', otpCode: '' }); }} className="glass-btn-primary">
                Try Another Account
              </button>
              <button onClick={() => { setShowWaitingModal(false); navigate('/signup'); }} className="glass-btn-secondary">
                Create New Account
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Login;