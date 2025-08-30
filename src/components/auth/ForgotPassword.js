// src/components/auth/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: Send reset code to email
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.sendForgotPasswordOTP(formData.email);

      if (result.success) {
        toast.success('Reset code sent to your email!');
        setStep(2);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.verifyForgotPasswordOTP(
        formData.email, 
        formData.otpCode
      );

      if (result.success) {
        toast.success('Code verified! Set your new password.');
        setStep(3);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(
        formData.email,
        formData.otpCode,
        formData.newPassword
      );

      if (result.success) {
        toast.success('Password reset successfully! You can now login.');
        navigate('/login');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    try {
      const result = await authService.sendForgotPasswordOTP(formData.email);
      if (result.success) {
        toast.success('Reset code resent successfully!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && 'Enter your email to receive a reset code'}
            {step === 2 && 'Enter the verification code sent to your email'}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {/* Step 1: Email Input */}
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSendResetCode}>
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
                <p className="mt-2 text-xs text-gray-500">
                  We'll send a 6-digit reset code to this email
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>

                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-800 transition duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div className="text-center mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Reset code sent to <strong>{formData.email}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                  Reset Code
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
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full flex justify-center items-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="text-center mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Code verified! Create your new password below.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Create a strong password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Confirm your new password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={`flex items-center ${formData.newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.newPassword.length >= 6 ? '✅' : '⭕'}</span>
                    At least 6 characters long
                  </li>
                  <li className={`flex items-center ${formData.newPassword === formData.confirmPassword && formData.newPassword ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.newPassword === formData.confirmPassword && formData.newPassword ? '✅' : '⭕'}</span>
                    Passwords match
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || formData.newPassword !== formData.confirmPassword || formData.newPassword.length < 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full flex justify-center items-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Code Verification
                </button>
              </div>
            </form>
          )}

          {/* Progress Indicator */}
          <div className="mt-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Email</span>
              <span>Verify</span>
              <span>Reset</span>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;