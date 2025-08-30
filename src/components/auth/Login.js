// src/components/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const Login = () => {
  const [step, setStep] = useState(1); // 1: credentials, 2: OTP
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otpCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.sendLoginOTP({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        toast.success('OTP sent to your email!');
        setStep(2);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);

    try {
      const result = await login({
        email: formData.email,
        otpCode: formData.otpCode,
        deviceInfo: {
          deviceType: 'web',
          deviceId: navigator.userAgent
        }
      });

      if (result.success) {
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const result = await authService.sendLoginOTP({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        toast.success('OTP resent successfully!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome back to IntelliVerse
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? 'Enter your credentials to continue' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your university email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Forgot Password Link - ADDED THIS */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  We've sent a 6-digit OTP to <strong>{formData.email}</strong>
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <div className="mt-1">
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  maxLength="6"
                  required
                  value={formData.otpCode}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={otpLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Verify OTP & Login'
                )}
              </button>

              <button
                type="button"
                onClick={resendOTP}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-500"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;