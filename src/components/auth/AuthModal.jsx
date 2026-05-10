import React from 'react';
import authService from '../../services/authService';
import helpdeskService from '../../services/helpdeskService';
import api from '../../services/api';

export default function AuthModal({ open, mode = 'login', onClose }) {
  const [active, setActive] = React.useState(mode);
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [departments, setDepartments] = React.useState([
    'Computer Science',
    'Software Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Other'
  ]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => { setActive(mode); setStep(1); setError(''); }, [mode]);
  React.useEffect(() => { 
    (async () => { 
      try { 
        const response = await fetch('/api/departments/public');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            const deptNames = data.data.map(d => typeof d === 'string' ? d : d.name).filter(Boolean);
            if (deptNames.length > 0) {
              setDepartments(deptNames);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch departments, using defaults:', err);
        // Keep default departments if fetch fails
      }
    })(); 
  }, []);

  if (!open) return null;

  const sendLogin = async () => {
    setLoading(true); setError('');
    try { const res = await authService.sendLoginOTP({ email }); if (res?.success) setStep(2); else setError(res?.message || 'Failed'); } finally { setLoading(false); }
  };
  const verifyLogin = async () => {
    setLoading(true); setError('');
    try { const res = await authService.verifyLoginOTP({ email, otpCode: otp }); if (res?.success) { onClose && onClose(); window.location.reload(); } else setError(res?.message || 'Failed'); } finally { setLoading(false); }
  };
  const sendSignup = async () => {
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || firstName.trim().length < 3 || lastName.trim().length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }
    const nameOnlyLetters = /^[A-Za-z\s]+$/;
    if (!nameOnlyLetters.test(firstName.trim()) || !nameOnlyLetters.test(lastName.trim())) {
      setError('Name must contain only letters');
      return;
    }
    setLoading(true); setError('');
    try { const res = await authService.sendSignupOTP({ email, firstName, lastName, department }); if (res?.success) setStep(2); else setError(res?.message || 'Failed'); } finally { setLoading(false); }
  };
  const verifySignup = async () => {
    setLoading(true); setError('');
    try { const res = await authService.verifySignupOTP({ email, otpCode: otp, firstName, lastName, department }); if (res?.success) { onClose && onClose(); window.location.reload(); } else setError(res?.message || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button onClick={() => { setActive('login'); setStep(1); }} className={`px-3 py-1.5 rounded-xl text-sm ${active==='login' ? 'bg-iv-indigo text-white' : 'bg-gray-100 text-gray-700'}`}>Login</button>
            <button onClick={() => { setActive('signup'); setStep(1); }} className={`px-3 py-1.5 rounded-xl text-sm ${active==='signup' ? 'bg-iv-indigo text-white' : 'bg-gray-100 text-gray-700'}`}>Signup</button>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-sm bg-gray-100 text-gray-700">Close</button>
        </div>

        {active === 'login' && (
          <div>
            {step === 1 ? (
              <div className="space-y-3">
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded-xl" />
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button disabled={loading || !email} onClick={sendLogin} className="w-full px-4 py-2 rounded-xl bg-iv-indigo text-white disabled:opacity-60">{loading ? 'Sending…' : 'Send OTP'}</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full px-3 py-2 border rounded-xl" />
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button disabled={loading || !otp} onClick={verifyLogin} className="w-full px-4 py-2 rounded-xl bg-iv-indigo text-white disabled:opacity-60">{loading ? 'Verifying…' : 'Verify & Login'}</button>
              </div>
            )}
          </div>
        )}

        {active === 'signup' && (
          <div>
            {step === 1 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="First Name" className="px-3 py-2 border rounded-xl" />
                  <input value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Last Name" className="px-3 py-2 border rounded-xl" />
                </div>
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded-xl" />
                <select value={department} onChange={(e)=>setDepartment(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">Select Department</option>
                  {departments.map((d)=>(<option key={d} value={d}>{d}</option>))}
                </select>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button disabled={loading || !email || !firstName || !lastName || !department} onClick={sendSignup} className="w-full px-4 py-2 rounded-xl bg-iv-indigo text-white disabled:opacity-60">{loading ? 'Sending…' : 'Send OTP'}</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full px-3 py-2 border rounded-xl" />
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button disabled={loading || !otp} onClick={verifySignup} className="w-full px-4 py-2 rounded-xl bg-iv-indigo text-white disabled:opacity-60">{loading ? 'Verifying…' : 'Verify & Create Account'}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
