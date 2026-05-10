import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Hash, Calendar, Building, Shield, Sparkles, ArrowRight, Check, ChevronLeft, Lock, User } from 'lucide-react';
import { PiStudentFill, PiChalkboardTeacherFill } from 'react-icons/pi';
import { motion } from 'framer-motion';
import logo from '../../logo-intelliverse-transparent.png.png';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'Profile', 'Password', 'Verify'];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', role: 'student',
    profile: { firstName: '', lastName: '', department: '', studentId: '', semester: '', employeeId: '', designation: '', adminCode: '' },
    otpCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [departments, setDepartments] = useState(['Computer Science','Software Engineering','Electrical Engineering','Mechanical Engineering','Civil Engineering','Business Administration','Mathematics','Physics','Chemistry','Other']);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/departments/public')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && Array.isArray(data.data)) {
          const names = data.data.map(d => typeof d === 'string' ? d : d.name).filter(Boolean);
          if (names.length > 0) setDepartments(names);
        }
      }).catch(() => {});
  }, []);

  const buildProfile = (role, profile) => {
    const base = { firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), department: profile.department };
    if (role === 'student') {
      const sem = profile.semester !== '' ? parseInt(profile.semester, 10) : undefined;
      return { ...base, studentId: profile.studentId.trim(), ...(Number.isInteger(sem) ? { semester: sem } : {}) };
    }
    if (role === 'faculty') return { ...base, employeeId: profile.employeeId.trim(), ...(profile.designation ? { designation: profile.designation.trim() } : {}) };
    if (role === 'admin') return { ...base, employeeId: profile.employeeId.trim(), designation: profile.designation.trim(), adminCode: profile.adminCode.trim() };
    return base;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const setRole = (role) => setFormData(prev => ({
    ...prev, role,
    profile: { ...prev.profile, ...(role === 'student' ? { employeeId: '', designation: '', adminCode: '' } : { studentId: '', semester: '' }) }
  }));

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.email) { toast.error('Email is required'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error('Enter a valid email'); return false; }
      return true;
    }
    if (s === 2) {
      const { firstName, lastName, department, studentId, employeeId, adminCode } = formData.profile;
      if (!firstName || !lastName || !department) { toast.error('Please fill all required fields'); return false; }
      if (firstName.trim().length < 3 || lastName.trim().length < 3) { toast.error('Name must be at least 3 characters'); return false; }
      if (!/^[A-Za-z\s]+$/.test(firstName) || !/^[A-Za-z\s]+$/.test(lastName)) { toast.error('Name must contain only letters'); return false; }
      if (formData.role === 'student' && !studentId) { toast.error('Student ID is required'); return false; }
      if ((formData.role === 'faculty' || formData.role === 'admin') && !employeeId) { toast.error('Employee ID is required'); return false; }
      if (formData.role === 'admin' && !adminCode) { toast.error('Admin code is required'); return false; }
      if (formData.role === 'admin' && adminCode !== 'ADMIN001') { toast.error('Invalid admin code'); return false; }
      return true;
    }
    if (s === 3) {
      if (!formData.password || !formData.confirmPassword) { toast.error('Please fill in password fields'); return false; }
      if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
      if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleSendOTP = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const result = await authService.sendSignupOTP({ email: formData.email, role: formData.role, profile: buildProfile(formData.role, formData.profile) });
      if (result.success) { toast.success('OTP sent!'); setStep(4); }
      else toast.error(result.message);
    } catch { toast.error('Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const result = await authService.verifySignupOTP({ email: formData.email, otpCode: formData.otpCode, password: formData.password, role: formData.role, profile: buildProfile(formData.role, formData.profile) });
      if (result.success) { toast.success('Account created!'); navigate('/login'); }
      else toast.error(result.message);
    } catch { toast.error('Account creation failed.'); }
    finally { setOtpLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const result = await authService.sendSignupOTP({ email: formData.email, role: formData.role, profile: buildProfile(formData.role, formData.profile) });
      if (result.success) toast.success('OTP resent!');
      else toast.error(result.message);
    } catch { toast.error('Failed to resend OTP'); }
    finally { setLoading(false); }
  };

  const Icon = ({ icon: Ic }) => (
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors duration-200">
      <Ic className="h-[18px] w-[18px]" />
    </div>
  );

  const ROLES = [
    { id: 'student', label: 'Student', Icon: PiStudentFill },
    { id: 'faculty', label: 'Faculty', Icon: PiChalkboardTeacherFill },
  ];

  const RoleBtn = ({ role: r, label, Icon: RIcon }) => {
    const active = formData.role === r;
    return (
      <button type="button" onClick={() => setRole(r)}
        className={`flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl border text-[14px] font-semibold transition-all duration-200 w-full ${
          active
            ? 'border-violet-400 text-violet-700 bg-violet-50 shadow-sm shadow-violet-100'
            : 'border-slate-200 text-slate-500 bg-white hover:border-violet-200 hover:text-slate-700 hover:bg-slate-50'
        }`}>
        <RIcon className={`text-[18px] ${active ? 'text-violet-500' : 'text-slate-400'}`} />
        {label}
        {active && <Check className="w-3.5 h-3.5 ml-auto text-violet-500" />}
      </button>
    );
  };

  // ── Step Indicator ──
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-10">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                done ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' :
                active ? 'text-violet-700 ring-2 ring-violet-400 ring-offset-2' :
                'bg-white/70 border border-slate-200 text-slate-400'
              }`} style={active ? { background: 'rgba(139,92,246,0.1)' } : {}}>
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-violet-600' : done ? 'text-violet-400' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 rounded-full transition-all duration-500 ${done ? 'bg-violet-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="min-h-screen flex flex-col lg:flex-row font-['Inter'] relative overflow-hidden"
      style={{ background: '#fafafa' }}
    >

      {/* Left: Full-panel Form */}
      <div className="w-full lg:flex-1 flex-shrink-0 h-screen overflow-y-auto scrollbar-hide flex flex-col"
        style={{ background: 'linear-gradient(160deg, #f8f7ff 0%, #faf5ff 40%, #f0f9ff 100%)' }}>

        {/* Top logo bar */}
        <div className="flex items-center gap-3 px-10 pt-10 pb-2">
          <img src={logo} alt="IntelliVerse" className="h-10 w-10 object-contain" />
          <span className="font-[Outfit] font-bold text-slate-800 text-xl tracking-tight">IntelliVerse</span>
        </div>

        {/* Form content — centered vertically in the remaining space */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[480px] mx-auto px-10 py-8 animate-slide-in">

            <StepIndicator />

            {/* ── STEP 1: Role + Email ── */}
            {step === 1 && (
              <div className="animate-slide-in space-y-5">
                <div className="mb-6">
                  <h2 className="text-3xl font-[Outfit] font-extrabold text-slate-900 mb-1">Create your account</h2>
                  <p className="text-base text-slate-500">Join the IntelliVerse campus ecosystem</p>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-3">I am a:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map(r => (
                      <RoleBtn key={r.id} role={r.id} label={r.label} Icon={r.Icon} />
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-[15px] font-semibold text-slate-700 mb-2">University Email *</label>
                  <div className="relative group">
                    <Icon icon={Mail} />
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                      className="glass-input pl-12 py-4 text-[15px]" placeholder="your.email@university.edu" />
                  </div>
                </div>

                <button type="button" onClick={nextStep} className="glass-btn-primary py-4 text-[16px] mt-2">
                  Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>

                <div className="text-center pt-3 border-t border-slate-100 lg:hidden">
                  <p className="text-sm text-slate-500">Have an account? <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">Sign in</Link></p>
                </div>
              </div>
            )}

            {/* ── STEP 2: Profile Info ── */}
            {step === 2 && (
              <div className="animate-slide-in space-y-5">
                <div className="mb-6">
                  <h2 className="text-3xl font-[Outfit] font-extrabold text-slate-900 mb-1">Your profile</h2>
                  <p className="text-base text-slate-500">Tell us a bit about yourself</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[15px] font-semibold text-slate-700 mb-2">First Name *</label>
                    <input name="profile.firstName" type="text" value={formData.profile.firstName} onChange={handleChange}
                      className="glass-input !pl-4 py-4 text-[15px]" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-[15px] font-semibold text-slate-700 mb-2">Last Name *</label>
                    <input name="profile.lastName" type="text" value={formData.profile.lastName} onChange={handleChange}
                      className="glass-input !pl-4 py-4 text-[15px]" placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-2">Department *</label>
                  <div className="relative group">
                    <Icon icon={Building} />
                    <select name="profile.department" value={formData.profile.department} onChange={handleChange}
                      className="glass-input appearance-none bg-transparent py-4 text-[15px]">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {formData.role === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[15px] font-semibold text-slate-700 mb-2">Student ID *</label>
                      <div className="relative group"><Icon icon={Hash} />
                        <input name="profile.studentId" type="text" value={formData.profile.studentId} onChange={handleChange}
                          className="glass-input py-4 text-[15px]" placeholder="221447" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[15px] font-semibold text-slate-700 mb-2">Semester</label>
                      <div className="relative group"><Icon icon={Calendar} />
                        <select name="profile.semester" value={formData.profile.semester} onChange={handleChange}
                          className="glass-input appearance-none bg-transparent py-4 text-[15px]">
                          <option value="">Select</option>
                          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'faculty' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[15px] font-semibold text-slate-700 mb-2">Employee ID *</label>
                      <div className="relative group"><Icon icon={Hash} />
                        <input name="profile.employeeId" type="text" value={formData.profile.employeeId} onChange={handleChange}
                          className="glass-input py-4 text-[15px]" placeholder="EMP001" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[15px] font-semibold text-slate-700 mb-2">Designation</label>
                      <input name="profile.designation" type="text" value={formData.profile.designation} onChange={handleChange}
                        className="glass-input !pl-4 py-4 text-[15px]" placeholder="Asst. Professor" />
                    </div>
                  </div>
                )}

                {formData.role === 'admin' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[15px] font-semibold text-slate-700 mb-2">Employee ID *</label>
                        <div className="relative group"><Icon icon={Hash} />
                          <input name="profile.employeeId" type="text" value={formData.profile.employeeId} onChange={handleChange}
                            className="glass-input py-4 text-[15px]" placeholder="ADMIN001" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[15px] font-semibold text-slate-700 mb-2">Designation</label>
                        <input name="profile.designation" type="text" value={formData.profile.designation} onChange={handleChange}
                          className="glass-input !pl-4 py-4 text-[15px]" placeholder="System Admin" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[15px] font-semibold text-slate-700 mb-2">Admin Code *</label>
                      <div className="relative group"><Icon icon={Shield} />
                        <input name="profile.adminCode" type="password" value={formData.profile.adminCode} onChange={handleChange}
                          className="glass-input py-4 text-[15px]" placeholder="Enter admin code" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="glass-btn-secondary py-4 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={nextStep} className="glass-btn-primary py-4 text-[16px]">
                    Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Password ── */}
            {step === 3 && (
              <div className="animate-slide-in space-y-5">
                <div className="mb-6">
                  <h2 className="text-3xl font-[Outfit] font-extrabold text-slate-900 mb-1">Set your password</h2>
                  <p className="text-base text-slate-500">Choose a strong password for your account</p>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-2">Password *</label>
                  <div className="relative group">
                    <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                      className="glass-input !pl-4 pr-12 py-4 text-[15px]" placeholder="Create a strong password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-600 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-2">Confirm Password *</label>
                  <div className="relative group">
                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                      className="glass-input !pl-4 pr-12 py-4 text-[15px]" placeholder="Repeat your password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-600 transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="glass-btn-secondary py-4 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={handleSendOTP} disabled={loading} className="glass-btn-primary py-4 text-[16px]">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <>Send OTP <ArrowRight className="w-4 h-4 inline ml-1" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: OTP Verify ── */}
            {step === 4 && (
              <form className="animate-slide-in space-y-5" onSubmit={handleVerifyOTP}>
                <div className="mb-6">
                  <h2 className="text-3xl font-[Outfit] font-extrabold text-slate-900 mb-1">Verify your email</h2>
                  <p className="text-base text-slate-500">We sent a code to <strong className="text-slate-700">{formData.email}</strong></p>
                </div>

                <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <p className="text-sm text-slate-500">Check your inbox and enter the 6-digit code below</p>
                </div>

                <input name="otpCode" type="text" maxLength="6" value={formData.otpCode} onChange={handleChange}
                  className="block w-full px-4 py-5 rounded-2xl text-slate-900 text-center text-4xl font-bold tracking-[0.6em] transition-all duration-300"
                  style={{ background: 'rgba(248,250,252,0.9)', border: '1.5px solid rgba(226,232,240,0.9)', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}
                  placeholder="••••••" />

                <button type="submit" disabled={otpLoading} className="glass-btn-primary py-4 text-[16px]">
                  {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Create Account →'}
                </button>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)} className="glass-btn-secondary py-3.5 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={resendOTP} disabled={loading} className="glass-btn-secondary py-3.5">
                    {loading ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* Right: Aurora Branding Panel */}
      <div className="hidden lg:flex lg:flex-1 relative flex-col justify-center items-center p-14 overflow-hidden text-white"
        style={{ background: 'linear-gradient(145deg, #0d0a2e 0%, #1e1065 30%, #1e1b4b 60%, #0c1a3a 100%)' }}>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full opacity-30 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full opacity-25 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.7) 0%, transparent 70%)', filter: 'blur(45px)', animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-md animate-fade-in text-center">
          <div className="mx-auto h-28 w-28 flex items-center justify-center mb-8 transform transition hover:scale-110 hover:-rotate-3 duration-500"
            style={{ filter: 'drop-shadow(0 0 20px rgba(147,197,253,0.5))' }}>
            <img src={logo} alt="IntelliVerse" className="h-full w-full object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 className="text-5xl font-[Outfit] font-extrabold tracking-tight mb-4 leading-tight">
            Join the<br /><span className="text-gradient">IntelliVerse</span>
          </h1>
          <p className="text-base text-slate-400 mb-12 leading-relaxed">
            A connected, AI-driven campus experience designed for every student and faculty member.
          </p>
          <div className="p-7 rounded-3xl text-left"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            <p className="text-sm font-medium text-violet-300 mb-1">Already have an account?</p>
            <p className="text-slate-400 text-sm mb-5">Sign in and pick up exactly where you left off.</p>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', backdropFilter: 'blur(10px)' }}>
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default Signup;
