import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Hash, Calendar, Building } from 'lucide-react';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const Signup = () => {
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    profile: {
      firstName: '',
      lastName: '',
      department: '',
      studentId: '',
      semester: '',
      // Faculty specific fields
      employeeId: '',
      designation: ''
    },
    otpCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();

  const departments = [
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
  ];

  // Build a profile object that only contains fields allowed by backend for the selected role
  const buildFilteredProfile = (role, profile) => {
    const base = {
      firstName: (profile.firstName || '').trim(),
      lastName: (profile.lastName || '').trim(),
      department: profile.department || ''
    };

    if (role === 'student') {
      const semesterNumber =
        profile.semester !== '' && profile.semester !== null && profile.semester !== undefined
          ? parseInt(profile.semester, 10)
          : undefined;

      return {
        ...base,
        studentId: (profile.studentId || '').trim(),
        ...(Number.isInteger(semesterNumber) ? { semester: semesterNumber } : {})
      };
    }

    if (role === 'faculty') {
      return {
        ...base,
        employeeId: (profile.employeeId || '').trim(),
        ...(profile.designation ? { designation: profile.designation.trim() } : {})
      };
    }

    // Fallback (shouldn't happen with current UI)
    return base;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const { email, password, confirmPassword, profile } = formData;

    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (!profile.firstName || !profile.lastName || !profile.department) {
      toast.error('Please complete your profile information');
      return false;
    }

    if (formData.role === 'student' && !profile.studentId) {
      toast.error('Student ID is required for students');
      return false;
    }

    if (formData.role === 'faculty' && !profile.employeeId) {
      toast.error('Employee ID is required for faculty');
      return false;
    }

    return true;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const filteredProfile = buildFilteredProfile(formData.role, formData.profile);

      const result = await authService.sendSignupOTP({
        email: formData.email,
        role: formData.role,
        profile: filteredProfile
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
      const filteredProfile = buildFilteredProfile(formData.role, formData.profile);

      const result = await authService.verifySignupOTP({
        email: formData.email,
        otpCode: formData.otpCode,
        password: formData.password,
        role: formData.role,
        profile: filteredProfile
      });

      if (result.success) {
        toast.success('Account created successfully! You can now login.');
        navigate('/login');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Account creation failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const filteredProfile = buildFilteredProfile(formData.role, formData.profile);

      const result = await authService.sendSignupOTP({
        email: formData.email,
        role: formData.role,
        profile: filteredProfile
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Join IntelliVerse
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? 'Create your smart campus account' : 'Verify your email address'}
          </p>
        </div>

        {step === 1 ? (
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
            <form className="space-y-6" onSubmit={handleSendOTP}>
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        role: 'student',
                        profile: {
                          ...prev.profile,
                          // clear faculty-only fields on role switch
                          employeeId: '',
                          designation: ''
                        }
                      }))
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                      formData.role === 'student'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        role: 'faculty',
                        profile: {
                          ...prev.profile,
                          // clear student-only fields on role switch
                          studentId: '',
                          semester: ''
                        }
                      }))
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                      formData.role === 'faculty'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Faculty
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="your.email@university.edu"
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile.firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="profile.firstName"
                    name="profile.firstName"
                    type="text"
                    required
                    value={formData.profile.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="profile.lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="profile.lastName"
                    name="profile.lastName"
                    type="text"
                    required
                    value={formData.profile.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="profile.department" className="block text-sm font-medium text-gray-700">
                  Department *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="profile.department"
                    name="profile.department"
                    required
                    value={formData.profile.department}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role-specific fields */}
              {formData.role === 'student' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile.studentId" className="block text-sm font-medium text-gray-700">
                      Student ID *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="profile.studentId"
                        name="profile.studentId"
                        type="text"
                        required
                        value={formData.profile.studentId}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="221447"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="profile.semester" className="block text-sm font-medium text-gray-700">
                      Semester
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="profile.semester"
                        name="profile.semester"
                        value={formData.profile.semester}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile.employeeId" className="block text-sm font-medium text-gray-700">
                      Employee ID *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="profile.employeeId"
                        name="profile.employeeId"
                        type="text"
                        required
                        value={formData.profile.employeeId}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="EMP001"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="profile.designation" className="block text-sm font-medium text-gray-700">
                      Designation
                    </label>
                    <input
                      id="profile.designation"
                      name="profile.designation"
                      type="text"
                      value={formData.profile.designation}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Assistant Professor"
                    />
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full px-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                    Confirm Password *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full px-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Confirm your password"
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
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Send Verification OTP'
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
            <div className="text-center mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  We've sent a 6-digit verification code to <strong>{formData.email}</strong>
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                  Verification Code
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
                    'Create Account'
                  )}
                </button>

                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  ← Back to Registration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
