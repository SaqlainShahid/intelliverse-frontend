import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase, 
  GraduationCap, 
  Save, 
  Camera,
  Loader2,
  CreditCard,
  Hash
} from 'lucide-react';

const ProfilePage = () => {
  const { user, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
    avatar: '',
    department: '',
    campus: '',
    // Student
    studentId: '',
    semester: '',
    cgpa: '',
    // Faculty
    employeeId: '',
    designation: '',
    officeRoom: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        displayName: user.profile?.displayName || '',
        phone: user.profile?.phone || '',
        avatar: user.profile?.avatar || '',
        department: user.profile?.department || '',
        campus: user.profile?.campus || '',
        studentId: user.profile?.studentId || '',
        semester: user.profile?.semester || '',
        cgpa: user.profile?.cgpa || '',
        employeeId: user.profile?.employeeId || '',
        designation: user.profile?.designation || '',
        officeRoom: user.profile?.officeRoom || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    setUploading(true);
    try {
      const response = await api.post('/user/upload-avatar', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const newUrl = response.data.data.url;
        setFormData(prev => ({ ...prev, avatar: newUrl }));
        toast.success('Avatar uploaded! Click Save to apply changes.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/user/profile', formData);
      const updatedUser = response?.data?.data?.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      await checkAuthStatus();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user?.role === 'faculty' && user?.profile?.designation
    ? user.profile.designation
    : (user?.role || 'User').toUpperCase();

  return (
    <div className="min-h-screen bg-iv-bg text-iv-text font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-iv-indigo/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-iv-emerald/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden mb-6 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
          <div className="h-32 bg-gradient-to-r from-iv-indigo to-purple-600"></div>
          <div className="px-6 pb-6">
            <div className="relative flex items-end -mt-12 mb-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full ring-4 ring-white bg-white flex items-center justify-center overflow-hidden relative">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-indigo-100 flex items-center justify-center text-iv-indigo text-2xl font-bold">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="ml-4 mb-1">
                <h1 className="text-2xl font-bold text-iv-text">
                  {formData.displayName || `${formData.firstName} ${formData.lastName}`}
                </h1>
                <p className="text-sm font-medium text-iv-indigo">{roleLabel}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-iv-muted">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user?.email}
              </div>
              {formData.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {formData.phone}
                </div>
              )}
              {formData.campus && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {formData.campus}
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
              <h2 className="text-xl font-bold text-iv-text mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-iv-indigo" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="How your name appears to others"
                    className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-iv-text mb-1">Avatar URL</label>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Academic/Professional Info */}
            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
              <h2 className="text-xl font-bold text-iv-text mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-iv-indigo" />
                {user?.role === 'student' ? 'Academic Information' : 'Professional Details'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-iv-muted" />
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 border pl-10 pr-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-iv-text mb-1">Campus</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-iv-muted" />
                    <input
                      type="text"
                      name="campus"
                      value={formData.campus}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 border pl-10 pr-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {user?.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-iv-text mb-1">Student ID</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-iv-muted" />
                        <input
                          type="text"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleChange}
                          className="w-full rounded-xl border-gray-200 border pl-10 pr-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-iv-text mb-1">Current Semester</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-iv-muted" />
                        <input
                          type="number"
                          name="semester"
                          value={formData.semester}
                          onChange={handleChange}
                          min="1"
                          max="8"
                          className="w-full rounded-xl border-gray-200 border pl-10 pr-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-iv-text mb-1">CGPA</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-iv-muted" />
                        <input
                          type="number"
                          name="cgpa"
                          value={formData.cgpa}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          max="4"
                          className="w-full rounded-xl border-gray-200 border pl-10 pr-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {user?.role === 'faculty' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-iv-text mb-1">Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-iv-text mb-1">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-iv-text mb-1">Office Room</label>
                      <input
                        type="text"
                        name="officeRoom"
                        value={formData.officeRoom}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 border px-3 py-2 bg-white/50 focus:ring-2 focus:ring-iv-indigo focus:border-iv-indigo focus:outline-none transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Summary */}
          <div className="space-y-6">
            <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sticky top-24 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300">
              <h3 className="font-bold text-iv-text mb-4">Profile Status</h3>
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-iv-indigo h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-iv-muted mt-2">Your profile is 85% complete</p>
              </div>
              
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-iv-indigo text-white px-4 py-2 rounded-xl font-medium shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:bg-indigo-600 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
