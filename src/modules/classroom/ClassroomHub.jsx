import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  BookOpen,
  FileText, 
  ArrowLeft, 
  Plus, 
  Share2, 
  Download, 
  Trash2, 
  MoreVertical,
  Calendar,
  Clock,
  ShieldCheck,
  Zap,
  Info,
  X,
  Upload,
  Link as LinkIcon,
  MessageSquare,
  Send,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Filter,
  GraduationCap,
  Paperclip,
  File,
  User as UserIcon,
  HelpCircle,
  Layout,
  Book,
  Laptop,
  PenTool,
  Atom,
  Lock
} from 'lucide-react';
import { getTheme } from '../../styles/theme';

const ClassroomHub = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme(user?.role);
  const fileInputRef = useRef(null);
  const submissionFileRef = useRef(null);
  
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream');
  
  // Modals / Focused States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showSubmissionViewer, setShowSubmissionViewer] = useState(null); // Faculty view
  const [focusedAssignment, setFocusedAssignment] = useState(null); // Student focus view

  // Form states
  const [uploadData, setUploadData] = useState({ title: '', description: '', fileUrl: '', fileType: 'pdf', topic: 'General' });
  const [assignmentData, setAssignmentData] = useState({ title: '', description: '', dueDate: '', maxPoints: 100, fileUrl: '', topic: 'General' });
  const [topicName, setTopicName] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [submissionData, setSubmissionData] = useState({ fileUrl: '', content: '' });
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });

  // Processing states
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/classroom/details/${classId}`);
      if (res.data.success) {
        setClassroom(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access denied');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/classroom/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (error) {
      toast.error('File upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!uploadData.title) return toast.error('Title is required');
    setIsPosting(true);
    try {
      const res = await api.post(`/classroom/upload-material/${classId}`, uploadData);
      if (res.data.success) {
        toast.success('Material added!');
        setClassroom({ ...classroom, materials: res.data.data });
        setShowUploadModal(false);
        setUploadData({ title: '', description: '', fileUrl: '', fileType: 'pdf', topic: 'General' });
      }
    } catch (error) { toast.error('Failed to save material'); } finally { setIsPosting(false); }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentData.title) return toast.error('Title is required');
    setIsPosting(true);
    try {
      const res = await api.post(`/classroom/create-assignment/${classId}`, assignmentData);
      if (res.data.success) {
        toast.success('Assignment created!');
        setClassroom({ ...classroom, assignments: res.data.data });
        setShowAssignmentModal(false);
      }
    } catch (error) { toast.error('Failed to create assignment'); } finally { setIsPosting(false); }
  };

  const handleSubmitWork = async () => {
    if (!submissionData.fileUrl) return toast.error('Please upload your work first');
    setIsPosting(true);
    try {
      const res = await api.post(`/classroom/submit-assignment/${classId}/${focusedAssignment._id}`, submissionData);
      if (res.data.success) {
        toast.success('Work turned in successfully!');
        fetchClassDetails();
        // Refresh focused assignment data manually or via find
        const updatedClass = await api.get(`/classroom/details/${classId}`);
        const updatedAsgn = updatedClass.data.data.assignments.find(a => a._id === focusedAssignment._id);
        setFocusedAssignment(updatedAsgn);
      }
    } catch (error) { toast.error('Submission failed'); } finally { setIsPosting(false); }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementContent.trim()) return;
    setIsPosting(true);
    try {
      const res = await api.post(`/classroom/post-announcement/${classId}`, { content: announcementContent });
      if (res.data.success) {
        toast.success('Announcement posted');
        setClassroom({ ...classroom, announcements: res.data.data });
        setAnnouncementContent('');
      }
    } catch (error) { toast.error('Failed to post'); } finally { setIsPosting(false); }
  };

  const handleAddTopic = async () => {
    if (!topicName.trim()) return;
    try {
      const res = await api.post(`/classroom/add-topic/${classId}`, { name: topicName });
      if (res.data.success) {
        toast.success('Topic added');
        setClassroom({ ...classroom, topics: res.data.data });
        setTopicName('');
        setShowTopicModal(false);
      }
    } catch (error) { toast.error('Failed to add topic'); }
  };

  const handleFileChange = async (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const result = await uploadToCloudinary(file);
    if (result && result.success) {
      if (target === 'material') setUploadData({ ...uploadData, fileUrl: result.fileUrl, fileType: result.fileType });
      else if (target === 'assignment') setAssignmentData({ ...assignmentData, fileUrl: result.fileUrl });
      else if (target === 'submission') setSubmissionData({ ...submissionData, fileUrl: result.fileUrl });
      toast.success('File ready!');
    }
  };

  const handleGrade = async (assignmentId, submissionId) => {
    try {
      const res = await api.post(`/classroom/grade-submission/${classId}/${assignmentId}/${submissionId}`, gradingData);
      if (res.data.success) {
        toast.success('Grade saved');
        setGradingData({ grade: '', feedback: '' });
        fetchClassDetails();
        // Refresh faculty view
        const updatedClass = await api.get(`/classroom/details/${classId}`);
        const updatedAsgn = updatedClass.data.data.assignments.find(a => a._id === assignmentId);
        setShowSubmissionViewer(updatedAsgn);
      }
    } catch (error) { toast.error('Grading failed'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className={`w-16 h-16 border-4 border-${theme.primary}/10 border-t-${theme.primary} rounded-full animate-spin`} />
    </div>
  );

  const isFaculty = classroom.faculty?._id === user?._id;

  return (
    <div className="min-h-screen bg-white pb-20 relative overflow-hidden">
      {/* ── Ambient Background Art & Patterns ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* Base High-Contrast Education Pattern */}
         <div className="absolute inset-0 opacity-[0.08]" 
            style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20h4v4h-4zM70 20h4v4h-4zM50 50h4v4h-4zM20 70h4v4h-4zM80 70h4v4h-4z' fill='%234F46E5' fill-opacity='0.4'/%3E%3Cpath d='M15 15l10 10M85 15l-10 10M15 85l10-10M85 85l-10-10' stroke='%234F46E5' stroke-width='1' stroke-opacity='0.2'/%3E%3Ccircle cx='50' cy='20' r='3' fill='%234F46E5' fill-opacity='0.2'/%3E%3Ccircle cx='20' cy='50' r='3' fill='%234F46E5' fill-opacity='0.2'/%3E%3Ccircle cx='80' cy='50' r='3' fill='%234F46E5' fill-opacity='0.2'/%3E%3Ccircle cx='50' cy='80' r='3' fill='%234F46E5' fill-opacity='0.2'/%3E%3C/svg%3E")`,
               backgroundSize: '150px 150px' 
            }} 
         />

        {/* ── "Smexy" Knowledge Nebula Background ── */}
         <div className="absolute inset-0 overflow-hidden">
            {/* Multi-chromatic Mesh Gradient */}
            <div className="absolute inset-0 opacity-[0.07] mix-blend-multiply">
               <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-gradient-conic from-indigo-500 via-violet-500 to-cyan-400 blur-[160px] animate-spin-slow" />
            </div>

            {/* High-Density Randomized Academic Icons */}
            <div className="absolute inset-0 opacity-[0.18] grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 p-10 gap-x-24 gap-y-36 scale-125">
               {[...Array(60)].map((_, i) => {
                  const Icons = [Book, GraduationCap, Atom, Laptop, PenTool, BookOpen, FileText, ClipboardList, ShieldCheck, Zap];
                  const Icon = Icons[i % Icons.length];
                  const rotation = (i * 13) % 360;
                  const randomOpacity = 0.3 + (i % 7) * 0.1;
                  return (
                     <div 
                        key={i} 
                        className={`flex items-center justify-center transition-all duration-1000 ${i % 4 === 0 ? 'animate-pulse' : ''}`}
                        style={{ 
                           transform: `rotate(${rotation}deg) scale(${0.8 + (i % 3) * 0.1})`,
                           opacity: randomOpacity 
                        }}
                     >
                        <Icon size={22} className={`text-indigo-${400 + (i % 5) * 100}`} strokeWidth={1.5} />
                     </div>
                  );
               })}
            </div>

            {/* Interconnection Nodes (SVG Knowledge Graph) */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
               <defs>
                  <pattern id="node-links" width="200" height="200" patternUnits="userSpaceOnUse">
                     <circle cx="20" cy="20" r="1" fill="#4F46E5" />
                     <circle cx="180" cy="180" r="1" fill="#4F46E5" />
                     <line x1="20" y1="20" x2="180" y2="180" stroke="#4F46E5" strokeWidth="0.5" />
                     <line x1="180" y1="20" x2="20" y2="180" stroke="#4F46E5" strokeWidth="0.2" strokeDasharray="4 4" />
                  </pattern>
               </defs>
               <rect width="100%" height="100%" fill="url(#node-links)" />
            </svg>
         </div>
         
         {/* Ambient Light Orbs (The 'Smexy' Glow) */}
         <div className={`absolute top-[-5%] right-[-5%] w-[60%] h-[60%] bg-indigo-500/15 rounded-full blur-[140px] animate-pulse`} style={{ animationDuration: '6s' }} />
         <div className={`absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[140px] animate-pulse`} style={{ animationDuration: '10s' }} />
         <div className={`absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-400/5 rounded-full blur-[120px] animate-pulse`} style={{ animationDuration: '15s' }} />
         
         {/* Subtle Grain Overlay */}
         <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
         />
      </div>

      {/* ── Sticky Glassmorphic Header with Ultra-Strong Blue Pattern ── */}
      <header className="sticky top-0 z-[100] bg-blue-600/5 backdrop-blur-3xl border-b border-blue-100/50 shadow-sm overflow-hidden">
         {/* Hex Texture Overlay for Header */}
         <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
               <pattern id="header-hex" width="30" height="26" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
                  <path d="M15 0L30 8.6V26L15 34.6L0 26V8.6L15 0Z" fill="none" stroke="#2563EB" strokeWidth="1"/>
               </pattern>
               <rect width="100%" height="100%" fill="url(#header-hex)" />
            </svg>
         </div>

         {/* Ultra-Strong Blue High-Contrast Data-Node Pattern */}
         <div className="absolute inset-0 opacity-[0.25] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
               <pattern id="blue-circuit-ultra" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                  <circle cx="20" cy="20" r="4" fill="#2563EB" />
                  <circle cx="100" cy="100" r="4" fill="#2563EB" />
                  <line x1="20" y1="20" x2="60" y2="20" stroke="#2563EB" strokeWidth="2" />
                  <line x1="60" y1="20" x2="60" y2="60" stroke="#2563EB" strokeWidth="2" />
                  <line x1="60" y1="60" x2="100" y2="100" stroke="#2563EB" strokeWidth="2" />
                  <circle cx="60" cy="60" r="3" fill="#3B82F6" />
                  <path d="M20 20 Q 50 50, 20 80" fill="none" stroke="#1D4ED8" strokeWidth="1.2" strokeDasharray="4 4" />
                  <rect x="95" y="15" width="12" height="12" fill="none" stroke="#2563EB" strokeWidth="1" />
               </pattern>
               <rect width="100%" height="100%" fill="url(#blue-circuit-ultra)" />
            </svg>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8 relative z-10">
            {/* Top Nav */}
            <div className="flex items-center justify-between">
               <button 
                  onClick={() => navigate('/dashboard')} 
                  className="group flex items-center gap-4 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-3xl px-6 py-3 rounded-2xl border-t border-l border-white/60 border-b border-r border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-1 ring-white/20 hover:scale-105 transition-all"
               >
                  <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-all border border-white">
                     <ArrowLeft size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 drop-shadow-sm">Back to Dashboard</span>
               </button>

               <div className="flex items-center gap-8">
                  <div className="flex items-center gap-4 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-3xl px-8 py-4 rounded-[2rem] border-t border-l border-white/70 border-b border-r border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-1 ring-white/30">
                     <div className={`w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 border-t border-l border-white/30`}><GraduationCap size={24} /></div>
                     <span className="text-base font-black uppercase tracking-[0.15em] text-gray-900 drop-shadow-md">{classroom.name} Hub</span>
                  </div>
               </div>
            </div>

            {/* Tab Navigation with Hyper-Realistic Glass Isolation Bar */}
            <div className="flex justify-center pb-4">
               <div className="flex bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-3xl border-t border-l border-white/70 border-b border-r border-white/20 p-2 rounded-[3rem] shadow-[0_15px_45px_0_rgba(31,38,135,0.2)] ring-1 ring-white/30">
                  {['Stream', 'Classwork', 'People'].map(tab => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-14 py-4 text-[12px] font-black uppercase tracking-[0.3em] rounded-[2.5rem] relative transition-all duration-300 ${
                           activeTab === tab.toLowerCase() 
                           ? 'text-indigo-600 bg-white/95 shadow-2xl shadow-indigo-200 scale-105 border-t border-l border-white' 
                           : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
                        }`}
                     >
                        <span className="relative z-10">{tab}</span>
                        {activeTab === tab.toLowerCase() && (
                           <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]`} />
                        )}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
           
           {/* Sidebar Info (Only on Stream) */}
           {activeTab === 'stream' && (
              <aside className="lg:col-span-1 space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
                  {/* Class Code Card (Now with Subtle Blue Chroma) */}
                  <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 border border-blue-100 rounded-[2.5rem] p-8 shadow-[rgba(17,17,26,0.1)_0px_4px_16px,rgba(17,17,26,0.05)_0px_8px_32px] ring-1 ring-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 blur-3xl pointer-events-none group-hover:bg-blue-400/20 transition-all" />
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 relative z-10">Class Code</p>
                     <div className="flex items-center justify-between relative z-10">
                        <h2 className="text-2xl font-black text-gray-900 tracking-[0.2em] font-mono drop-shadow-sm">{classroom.code}</h2>
                        <button onClick={() => { navigator.clipboard.writeText(classroom.code); toast.success('Copied'); }} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-all border border-blue-50"><Share2 size={18} /></button>
                     </div>
                  </div>

                  {/* Teacher Card (Hyper-Vibrant Material) */}
                  <div className={`bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-[rgba(31,38,135,0.2)_0px_8px_32px] relative overflow-hidden ring-1 ring-white/20`}>
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-60 relative z-10">Chief Instructor</h3>
                     <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black border border-white/30 shadow-xl">{classroom.faculty?.profile?.firstName?.charAt(0)}</div>
                        <div>
                           <p className="font-black text-sm drop-shadow-sm">{classroom.faculty?.profile?.firstName} {classroom.faculty?.profile?.lastName}</p>
                           <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-1">{classroom.faculty?.profile?.designation}</p>
                        </div>
                     </div>
                  </div>

                  {/* Upcoming Work Card (Emergency Rose Tint) */}
                  <div className="bg-gradient-to-br from-rose-50/50 to-white border border-rose-100 rounded-[2.5rem] p-8 shadow-[rgba(17,17,26,0.05)_0px_8px_24px] relative overflow-hidden">
                     <div className="absolute bottom-0 right-0 w-20 h-20 bg-rose-500/5 blur-3xl" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-rose-500 relative z-10">Deadlines Approaching</h3>
                     <div className="space-y-4 relative z-10">
                        {classroom.assignments?.filter(a => !a.submissions?.find(s => s.student === user?._id)).slice(0, 2).map((a, i) => (
                           <div key={i} className="flex items-center gap-4 text-xs font-bold text-gray-600 bg-white/60 p-3 rounded-xl border border-rose-50">
                              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                              <span className="truncate">{a.title}</span>
                           </div>
                        ))}
                        {classroom.assignments?.filter(a => !a.submissions?.find(s => s.student === user?._id)).length === 0 && (
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">No pending tasks</p>
                        )}
                        <button onClick={() => setActiveTab('classwork')} className={`text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline mt-2`}>Access Hub Control</button>
                     </div>
                  </div>
              </aside>
           )}

           {/* Main Work Area */}
           <main className={`${activeTab === 'stream' ? 'lg:col-span-3' : 'lg:col-span-4'} animate-in fade-in slide-in-from-bottom-6 duration-700`}>
              
              {activeTab === 'stream' && (
                 <div className="space-y-8">
                    {/* Announcement Input */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-[rgba(17,17,26,0.1)_0px_8px_32px] flex gap-8 ring-1 ring-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
                        <div className={`w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100 relative z-10`}>{user?.profile?.firstName?.charAt(0)}</div>
                        <div className="flex-1 relative z-10">
                           <textarea 
                              value={announcementContent}
                              onChange={(e) => setAnnouncementContent(e.target.value)}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none h-32"
                              placeholder="Broadcast a message to the academic stream..."
                           />
                           <div className="flex justify-end mt-6">
                              <button 
                                 onClick={handlePostAnnouncement}
                                 disabled={isPosting || !announcementContent.trim()}
                                 className={`px-12 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
                              >
                                 <Send size={16} /> Deploy Broadcast
                              </button>
                           </div>
                        </div>
                    </div>

                    {/* Stream Items (Enhanced) */}
                    <div className="space-y-8">
                       {[...(classroom.announcements || [])].reverse().map((ann, i) => (
                          <div key={i} className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-[rgba(17,17,26,0.05)_0px_8px_24px] hover:shadow-[rgba(17,17,26,0.15)_0px_16px_56px] hover:-translate-y-2 transition-all duration-500 group border-l-8 border-l-indigo-600">
                             <div className="flex items-start gap-8">
                                <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner group-hover:shadow-indigo-200`}>
                                   {classroom.faculty?.profile?.firstName?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                      <div>
                                         <p className="text-base font-black text-gray-900">{classroom.faculty?.profile?.firstName} {classroom.faculty?.profile?.lastName}</p>
                                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{new Date(ann.createdAt).toLocaleString()}</p>
                                      </div>
                                      <button className="w-10 h-10 hover:bg-gray-50 rounded-xl text-gray-300 flex items-center justify-center transition-all"><MoreVertical size={18} /></button>
                                   </div>
                                   <p className="text-base font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {activeTab === 'classwork' && (
                 <div className="max-w-4xl mx-auto space-y-12">
                    {/* Classwork Controls */}
                    {isFaculty && (
                       <div className="flex justify-center gap-6 mb-12">
                          <button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-3 px-8 py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all"><Plus size={20} /> Create Assignment</button>
                          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-3 px-8 py-5 bg-white border border-gray-100 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-gray-50 transition-all"><Upload size={20} /> Material</button>
                       </div>
                    )}

                    {/* Topics & Content */}
                    {['General', ...(classroom.topics || [])].map(topic => {
                       const assignments = classroom.assignments?.filter(a => a.topic === topic) || [];
                       const materials = classroom.materials?.filter(m => m.topic === topic) || [];
                       if (assignments.length === 0 && materials.length === 0) return null;

                       return (
                          <div key={topic} className="space-y-6">
                             <div className="flex items-center gap-6 mb-8">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{topic}</h2>
                                <div className={`flex-1 h-[2px] bg-gradient-to-r from-${theme.primary}/20 to-transparent`} />
                             </div>
                             
                             <div className="space-y-4">
                                {/* Assignments in Topic */}
                                {assignments.map((asgn, i) => {
                                   const submission = asgn.submissions?.find(s => s.student === user?._id);
                                   return (
                                      <div 
                                         key={asgn._id} 
                                         onClick={() => isFaculty ? setShowSubmissionViewer(asgn) : setFocusedAssignment(asgn)}
                                         className="group flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[2rem] shadow-[rgba(17,17,26,0.1)_0px_4px_16px,rgba(17,17,26,0.05)_0px_8px_32px] hover:shadow-[rgba(17,17,26,0.15)_0px_8px_24px,rgba(17,17,26,0.1)_0px_16px_56px] hover:-translate-y-1 cursor-pointer transition-all active:scale-[0.99]"
                                      >
                                         <div className="flex items-center gap-8">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ClipboardList size={24} /></div>
                                            <div>
                                               <h4 className="text-base font-black text-gray-900">{asgn.title}</h4>
                                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Due {new Date(asgn.dueDate).toLocaleDateString()}</p>
                                            </div>
                                         </div>
                                         <div className="flex items-center gap-6">
                                            {submission ? (
                                               <span className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest"><CheckCircle size={14} /> Turned In</span>
                                            ) : (
                                               <span className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest"><AlertCircle size={14} /> Assigned</span>
                                            )}
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                                         </div>
                                      </div>
                                   );
                                })}

                                {/* Materials in Topic */}
                                {materials.map((mat, i) => (
                                   <div 
                                      key={mat._id} 
                                      className="group flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[2rem] shadow-[rgba(17,17,26,0.1)_0px_4px_16px,rgba(17,17,26,0.05)_0px_8px_32px] hover:shadow-[rgba(17,17,26,0.1)_0px_8px_24px] transition-all"
                                   >
                                      <div className="flex items-center gap-8">
                                         <div className={`w-14 h-14 rounded-2xl bg-${theme.primary}/5 flex items-center justify-center text-${theme.primary}`}><FileText size={24} /></div>
                                         <div>
                                            <h4 className="text-base font-black text-gray-900">{mat.title}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Material posted {new Date(mat.uploadedAt).toLocaleDateString()}</p>
                                         </div>
                                      </div>
                                      <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:shadow-lg transition-all"><Download size={20} /></a>
                                   </div>
                                ))}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}

              {activeTab === 'people' && (
                 <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-[rgba(17,17,26,0.1)_0px_4px_16px,rgba(17,17,26,0.05)_0px_8px_32px]">
                    <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                       <h2 className="text-xl font-black text-gray-900 tracking-tight">Teachers</h2>
                       <div className={`w-10 h-10 rounded-xl bg-${theme.primary}/10 flex items-center justify-center text-${theme.primary}`}><UserIcon size={20} /></div>
                    </div>
                    <div className="p-10">
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl bg-${theme.primary}/10 flex items-center justify-center text-2xl font-black text-${theme.primary}`}>{classroom.faculty?.profile?.firstName?.charAt(0)}</div>
                          <p className="text-lg font-black text-gray-900">{classroom.faculty?.profile?.firstName} {classroom.faculty?.profile?.lastName}</p>
                       </div>
                    </div>
                    <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                       <h2 className="text-xl font-black text-gray-900 tracking-tight">Students</h2>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{classroom.students?.length || 0} students</span>
                    </div>
                    <div className="p-10 space-y-6">
                       {classroom.students?.map((s, i) => (
                          <div key={i} className="flex items-center gap-6 group">
                             <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-base font-black text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">{s.profile?.firstName?.charAt(0)}</div>
                             <p className="font-black text-gray-900 text-base">{s.profile?.firstName} {s.profile?.lastName}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
            </main>
         </div>
      </div>

      {/* ── MODERN GCR ASSIGNMENT FOCUS VIEW (STUDENT) ── */}
      {focusedAssignment && (
         <div className="fixed inset-0 z-[2000] bg-white animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
            {/* Background for Workspace */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]">
               <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='26' viewBox='0 0 30 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0L30 8.6V26L15 34.6L0 26V8.6L15 0Z' fill='none' stroke='%234F46E5' stroke-width='1'/%3E%3C/svg%3E")` }} />
               <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/10 blur-[120px]" />
               <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-violet-500/5 blur-[120px]" />
            </div>

            {/* Header */}
            <div className="h-24 bg-white/95 backdrop-blur-3xl border-b border-gray-100 px-8 flex items-center justify-between relative z-10 shadow-sm">
               <div className="flex items-center gap-6">
                  <button onClick={() => setFocusedAssignment(null)} className="w-12 h-12 rounded-2xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-all border border-gray-100 shadow-sm"><X size={24} /></button>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200"><ClipboardList size={22} /></div>
                     <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{focusedAssignment.title}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{classroom.name}</p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <div className="hidden md:flex flex-col items-end mr-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logged in as</p>
                     <p className="text-xs font-black text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center font-black text-white shadow-xl">{user?.profile?.firstName?.charAt(0)}</div>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative z-10">
               <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 p-8 sm:p-12">
                  
                  {/* Left Column: Instructions */}
                  <div className="lg:col-span-2 space-y-10">
                     <div className="bg-white/40 backdrop-blur-sm border border-white rounded-[3rem] p-10 shadow-[rgba(17,17,26,0.05)_0px_8px_32px]">
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100/50">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><UserIcon size={20} /></div>
                              <div>
                                 <p className="text-sm font-black text-gray-900">{classroom.faculty?.profile?.firstName} {classroom.faculty?.profile?.lastName}</p>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(focusedAssignment.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black text-gray-900">{focusedAssignment.maxPoints}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Points Possible</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 text-rose-500 font-black text-[11px] uppercase tracking-[0.2em] mb-10 bg-rose-50/50 w-fit px-4 py-2 rounded-xl border border-rose-100/50">
                           <Clock size={14} /> Due {new Date(focusedAssignment.dueDate).toLocaleDateString()}
                        </div>

                        <div className="prose prose-sm max-w-none">
                           <p className="text-lg font-bold text-gray-800 leading-relaxed whitespace-pre-wrap">{focusedAssignment.description || 'No instructions provided.'}</p>
                        </div>
                     </div>

                     {/* Reference Attachments */}
                     {focusedAssignment.fileUrl && (
                        <div className="space-y-6">
                           <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400 ml-6">Reference Materials</h3>
                           <a 
                              href={focusedAssignment.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="group flex items-center gap-8 p-8 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-2xl hover:border-indigo-100 transition-all max-w-lg shadow-[rgba(17,17,26,0.05)_0px_8px_32px]"
                           >
                              <div className="w-20 h-24 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-300 relative overflow-hidden group-hover:bg-indigo-50 transition-all shadow-inner">
                                 <File size={40} className="group-hover:text-indigo-200 transition-colors" />
                                 <div className="absolute bottom-0 left-0 right-0 h-2 bg-indigo-600" />
                              </div>
                              <div className="flex-1">
                                 <p className="text-base font-black text-gray-900 mb-1">Assignment Resources</p>
                                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1 rounded-lg">View Document</p>
                              </div>
                              <Download size={24} className="text-gray-200 group-hover:text-indigo-500 transition-all" />
                           </a>
                        </div>
                     )}

                     {/* ── REDESIGNED CLASS CONVERSATION ── */}
                     <div className="pt-10 space-y-8">
                        <div className="flex items-center gap-4 ml-6">
                           <MessageSquare size={20} className="text-indigo-500" />
                           <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Class Conversation</h3>
                        </div>
                        
                        <div className="bg-gray-50/50 rounded-[3rem] p-8 border border-gray-100/50 min-h-[150px] flex flex-col">
                           <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-30">
                              <MessageSquare size={40} className="mb-4" />
                              <p className="text-[11px] font-black uppercase tracking-widest text-center">Start a discussion with your classmates</p>
                           </div>

                           <div className="mt-auto flex gap-4 bg-white p-2 rounded-[2rem] shadow-xl border border-gray-100">
                              <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-100">{user?.profile?.firstName?.charAt(0)}</div>
                              <input 
                                 className="flex-1 bg-transparent border-none px-4 text-sm font-bold text-gray-900 focus:ring-0 outline-none" 
                                 placeholder="Add class comment..." 
                              />
                              <button className="w-12 h-12 rounded-[1.5rem] bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                 <Send size={20} />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Your Work */}
                  <div className="lg:col-span-1">
                     <div className="sticky top-8 space-y-8">
                        <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-[rgba(17,17,26,0.1)_0px_8px_24px,rgba(17,17,26,0.05)_0px_16px_56px] ring-1 ring-gray-100 relative overflow-hidden">
                           {/* Subtitle Glow */}
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none" />

                           <div className="flex items-center justify-between mb-10">
                              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your work</h3>
                              {(() => {
                                 const submission = focusedAssignment.submissions?.find(s => s.student === user?._id);
                                 return submission ? (
                                    <div className="flex flex-col items-end">
                                       <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-100">Turned In</span>
                                    </div>
                                 ) : (
                                    <span className="px-4 py-1.5 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-rose-100">Assigned</span>
                                 );
                              })()}
                           </div>

                           {/* Submission List */}
                           <div className="space-y-6 mb-10">
                              {(() => {
                                 const submission = focusedAssignment.submissions?.find(s => s.student === user?._id);
                                 if (submission) {
                                    return (
                                       <div className="space-y-4">
                                          <a 
                                             href={submission.fileUrl} 
                                             target="_blank" 
                                             rel="noreferrer"
                                             className="flex items-center justify-between p-6 border-2 border-indigo-50 bg-indigo-50/20 rounded-[2rem] hover:bg-indigo-50/40 hover:shadow-xl transition-all group/sub"
                                          >
                                             <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transition-all group-hover/sub:scale-110"><FileText size={24} /></div>
                                                <div>
                                                   <p className="text-sm font-black text-gray-900 mb-0.5">Submitted Work</p>
                                                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Uploaded {new Date(submission.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                             </div>
                                          </a>
                                          {submission.grade && (
                                             <div className="p-8 bg-emerald-900 text-white rounded-[2rem] shadow-2xl shadow-emerald-200 animate-in slide-in-from-top-4 duration-500">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-emerald-300">Official Grade</p>
                                                <div className="flex items-end gap-2">
                                                   <span className="text-5xl font-black">{submission.grade}</span>
                                                   <span className="text-xl font-bold opacity-40 mb-2">/ {focusedAssignment.maxPoints}</span>
                                                </div>
                                                {submission.feedback && (
                                                   <div className="mt-6 pt-6 border-t border-white/10">
                                                      <p className="text-xs font-bold leading-relaxed italic opacity-80">"{submission.feedback}"</p>
                                                   </div>
                                                )}
                                             </div>
                                          )}
                                       </div>
                                    );
                                 }
                                 if (submissionData.fileUrl) {
                                    return (
                                       <div className="flex items-center justify-between p-6 border-2 border-dashed border-indigo-300 bg-indigo-50/30 rounded-[2.5rem] animate-in zoom-in-95 duration-300">
                                          <div className="flex items-center gap-5">
                                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100"><FileText size={24} /></div>
                                             <div>
                                                <p className="text-sm font-black text-indigo-600 mb-0.5">Ready to Turn In</p>
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pending Upload</p>
                                             </div>
                                          </div>
                                          <button onClick={() => setSubmissionData({ ...submissionData, fileUrl: '' })} className="w-12 h-12 bg-white rounded-2xl text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shadow-lg"><X size={20} /></button>
                                       </div>
                                    );
                                 }
                                 return (
                                    <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/50 group hover:border-indigo-200 transition-all">
                                       <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-gray-200 mx-auto mb-6 group-hover:text-indigo-200 transition-colors"><Paperclip size={32} /></div>
                                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">No work attached</p>
                                    </div>
                                 );
                              })()}
                           </div>

                           {/* Actions */}
                           <div className="space-y-4">
                               {!focusedAssignment.submissions?.find(s => s.student === user?._id) && !submissionData.fileUrl && (
                                  <button 
                                     onClick={() => submissionFileRef.current.click()}
                                     disabled={isUploading}
                                     className="w-full h-20 bg-white border-2 border-gray-50 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.25em] hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-6 group"
                                  >
                                     <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><Plus size={24} /></div>
                                     {isUploading ? 'Encrypting...' : 'Add or create'}
                                     <input type="file" ref={submissionFileRef} className="hidden" onChange={(e) => handleFileChange(e, 'submission')} />
                                  </button>
                               )}
                               
                               <button 
                                  onClick={handleSubmitWork}
                                  disabled={isPosting || isUploading || (!submissionData.fileUrl && !focusedAssignment.submissions?.find(s => s.student === user?._id))}
                                  className={`w-full h-20 bg-gradient-to-br from-gray-900 to-indigo-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-100 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:grayscale`}
                               >
                                  {isPosting ? 'Deploying...' : focusedAssignment.submissions?.find(s => s.student === user?._id) ? 'Unsubmit Work' : 'Turn in Assignment'}
                               </button>
                           </div>
                        </div>

                        {/* Private Conversation */}
                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-[3rem] p-10 shadow-[rgba(17,17,26,0.05)_0px_8px_32px]">
                            <div className="flex items-center gap-4 mb-10">
                               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><Lock size={20} /></div>
                               <h3 className="text-sm font-black text-gray-900 tracking-[0.1em] uppercase">Teacher's Private Channel</h3>
                            </div>
                            
                            <div className="flex gap-4 p-2 bg-white rounded-2xl border border-gray-100 shadow-lg">
                               <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-black text-gray-400">{user?.profile?.firstName?.charAt(0)}</div>
                               <input className="flex-1 bg-transparent border-none px-4 text-sm font-bold text-gray-800 outline-none" placeholder="Message teacher..." />
                               <button className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 transition-all"><Send size={20} /></button>
                            </div>
                        </div>
                     </div>
                  </div>

               </div>
            </div>
         </div>
      )}

      {/* ── FACULTY VIEW SUBMISSIONS (SMEXY REDESIGN) ── */}
      {showSubmissionViewer && (
         <div className="fixed inset-0 z-[2000] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='26' viewBox='0 0 30 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0L30 8.6V26L15 34.6L0 26V8.6L15 0Z' fill='none' stroke='%234F46E5' stroke-width='1'/%3E%3C/svg%3E")` }} />

            <div className="h-24 bg-white/95 backdrop-blur-3xl border-b border-gray-100 px-10 flex items-center justify-between shadow-sm relative z-20">
                <div className="flex items-center gap-8">
                   <button onClick={() => setShowSubmissionViewer(null)} className="w-14 h-14 rounded-2xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-all border border-gray-100 shadow-sm bg-white"><X size={28} /></button>
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">{showSubmissionViewer.title}</h2>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{showSubmissionViewer.submissions?.length || 0} Turned In</span>
                         </div>
                         <div className="flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{Math.max(0, (classroom.students?.length || 0) - (showSubmissionViewer.submissions?.length || 0))} Missing</span>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="flex gap-6">
                   <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-200 hover:scale-105 transition-all">Batch Return Work</button>
                </div>
             </div>

             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white relative z-10">
                {/* Left: Students Roster */}
                <div className="w-full lg:w-[450px] bg-white border-r border-gray-100 overflow-y-auto border-b lg:border-b-0 shadow-2xl shadow-gray-200/50">
                   <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Student Roster</h3>
                         <Filter size={16} className="text-gray-300" />
                      </div>
                   </div>
                   <div className="p-6 space-y-3">
                      {classroom.students?.map((student, i) => {
                         const submission = showSubmissionViewer.submissions?.find(s => s.student === student._id);
                         return (
                            <button key={i} className={`w-full flex items-center gap-6 p-6 rounded-[2.5rem] transition-all border-2 group ${submission ? 'bg-white border-indigo-50 hover:border-indigo-600 hover:shadow-[rgba(17,17,26,0.1)_0px_8px_32px] hover:-translate-y-1' : 'bg-gray-50/50 border-transparent opacity-60 grayscale'}`}>
                               <div className={`w-14 h-14 rounded-2xl ${submission ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-200 text-gray-400'} flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform`}>
                                  {student.profile?.firstName?.charAt(0)}
                               </div>
                               <div className="flex-1 text-left">
                                  <p className="text-base font-black text-gray-900">{student.profile?.firstName} {student.profile?.lastName}</p>
                                  {submission ? (
                                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1 flex items-center gap-2"><CheckCircle size={12} /> Ready to Grade</p>
                                  ) : (
                                     <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2"><AlertCircle size={12} /> Work Pending</p>
                                  )}
                               </div>
                               <div className="text-right bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                                  <p className="text-lg font-black text-gray-900 leading-none mb-1">{submission?.grade || '—'}</p>
                                  <p className="text-[9px] font-black text-gray-300 uppercase">Grade</p>
                               </div>
                            </button>
                         );
                      })}
                   </div>
                </div>

                {/* Right: Submission Canvas */}
                <div className="flex-1 overflow-y-auto p-12 bg-gray-50/20">
                   <div className="max-w-5xl mx-auto space-y-12">
                      {showSubmissionViewer.submissions?.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-48 space-y-10 text-center animate-in fade-in zoom-in duration-700">
                            <div className="relative">
                               <div className="w-40 h-40 rounded-[3rem] bg-white shadow-[rgba(17,17,26,0.1)_0px_8px_24px,rgba(17,17,26,0.05)_0px_16px_56px] flex items-center justify-center text-gray-100 transform rotate-6 animate-pulse">
                                  <ClipboardList size={80} />
                               </div>
                               <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl flex items-center justify-center text-white animate-bounce" style={{ animationDuration: '3s' }}>
                                  <Clock size={32} />
                               </div>
                            </div>
                            <div>
                               <h3 className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase">Waiting for Excellence</h3>
                               <p className="text-gray-400 font-bold text-lg max-w-md mx-auto leading-relaxed">The digital portal is open. Student submissions will appear here once they are deployed to the hub.</p>
                            </div>
                            <button className="px-12 py-5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">Broadcast Reminder</button>
                         </div>
                      ) : (
                         showSubmissionViewer.submissions?.map((sub, i) => {
                            const student = classroom.students?.find(s => s._id === sub.student);
                            return (
                               <div key={i} className="bg-white border border-gray-100 rounded-[4rem] p-16 shadow-[rgba(17,17,26,0.1)_0px_8px_24px,rgba(17,17,26,0.05)_0px_16px_56px] ring-1 ring-gray-100 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                                  {/* Section Glow */}
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />

                                  <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 pb-16 border-b border-gray-50">
                                     <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center font-black text-white text-3xl shadow-2xl shadow-indigo-200">
                                           {student?.profile?.firstName?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                           <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{student?.profile?.firstName} {student?.profile?.lastName}</h3>
                                           <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 w-fit">
                                              <Calendar size={14} /> Deployed {new Date(sub.submittedAt).toLocaleString()}
                                           </p>
                                        </div>
                                     </div>
                                     <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-5 px-10 py-5 bg-gray-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.25em] hover:bg-indigo-600 hover:shadow-2xl transition-all"><Download size={22} /> Inspect Deliverable</a>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                     <div className="space-y-10">
                                        <div>
                                           <div className="flex items-center gap-4 mb-8">
                                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><FileText size={20} /></div>
                                              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">Submission Payload</h4>
                                           </div>
                                           <div className="p-10 bg-gray-50/50 rounded-[3rem] text-lg font-bold text-gray-800 leading-relaxed border border-gray-100 shadow-inner min-h-[300px]">
                                              {sub.content || 'The student did not provide an executive summary with this deliverable.'}
                                           </div>
                                        </div>
                                     </div>
                                     <div className="space-y-12">
                                        <div className="space-y-6">
                                           <div className="flex items-center justify-between ml-6">
                                              <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Hub Score / {showSubmissionViewer.maxPoints}</label>
                                              {sub.grade && <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full"><ShieldCheck size={14} /> Validated</div>}
                                           </div>
                                           <input 
                                              defaultValue={sub.grade}
                                              onChange={(e) => setGradingData({ ...gradingData, grade: e.target.value })}
                                              className="w-full h-24 bg-white border-2 border-indigo-50 focus:border-indigo-600 focus:bg-white rounded-[2rem] px-10 text-5xl font-black text-gray-900 outline-none transition-all shadow-xl shadow-indigo-100/20"
                                              placeholder="0"
                                           />
                                        </div>
                                        <div className="space-y-6">
                                           <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 ml-6">Faculty Feedback</label>
                                           <textarea 
                                              defaultValue={sub.feedback}
                                              onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                                              className="w-full h-48 bg-white border-2 border-indigo-50 focus:border-indigo-600 focus:bg-white rounded-[2.5rem] p-10 text-lg font-bold text-gray-700 outline-none transition-all resize-none shadow-xl shadow-indigo-100/20"
                                              placeholder="Provide strategic feedback..."
                                           />
                                        </div>
                                        <button 
                                           onClick={() => handleGrade(showSubmissionViewer._id, sub._id)}
                                           className="w-full h-24 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-95 hover:bg-indigo-700"
                                        >
                                           Finalize & Return Hub Grade
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            );
                         })
                      )}
                   </div>
                </div>
             </div>
         </div>
      )}

      {/* ── CREATION MODALS ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowUploadModal(false)} />
           <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-gray-100 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-widest text-gray-900">Upload Material</h3>
                 <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Material Title</label>
                    <input value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all shadow-inner" placeholder="e.g. Lecture 01 - Intro to AI" />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Topic (Optional)</label>
                    <select value={uploadData.topic} onChange={e => setUploadData({...uploadData, topic: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all cursor-pointer">
                       <option value="General">General</option>
                       {classroom.topics?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Instructions / Description</label>
                    <textarea value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} className="w-full h-32 p-6 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all resize-none shadow-inner" placeholder="Provide additional details..." />
                 </div>

                 <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 text-center group hover:border-indigo-500/50 transition-all">
                    {isUploading ? (
                       <div className="flex items-center justify-center gap-3 font-black text-indigo-600 text-xs animate-pulse uppercase tracking-widest"><Zap size={18} /> Processing...</div>
                    ) : (
                       <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors"><Upload size={24} /></div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{uploadData.fileUrl ? 'File ready to save' : 'Attach educational data'}</p>
                       </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'material')} />
                 </div>

                 <button onClick={handleUploadMaterial} disabled={isPosting || isUploading} className={`w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50`}>
                    {isPosting ? 'Broadcasting...' : 'Deploy Material'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowAssignmentModal(false)} />
           <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-gray-100 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-widest text-gray-900">Create Assignment</h3>
                 <button onClick={() => setShowAssignmentModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Assignment Title</label>
                    <input value={assignmentData.title} onChange={e => setAssignmentData({...assignmentData, title: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all shadow-inner" placeholder="e.g. Midterm Project - Research Paper" />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Due Date</label>
                       <input type="date" value={assignmentData.dueDate} onChange={e => setAssignmentData({...assignmentData, dueDate: e.target.value})} className="w-full h-16 px-6 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Max Points</label>
                       <input type="number" value={assignmentData.maxPoints} onChange={e => setAssignmentData({...assignmentData, maxPoints: e.target.value})} className="w-full h-16 px-6 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all shadow-inner" />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Topic</label>
                    <select value={assignmentData.topic} onChange={e => setAssignmentData({...assignmentData, topic: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all">
                       <option value="General">General</option>
                       {classroom.topics?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Instructions</label>
                    <textarea value={assignmentData.description} onChange={e => setAssignmentData({...assignmentData, description: e.target.value})} className="w-full h-32 p-6 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all resize-none shadow-inner" placeholder="Provide instructions for the assignment..." />
                 </div>

                 <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 text-center group hover:border-indigo-500/50 transition-all">
                    {isUploading ? (
                       <div className="flex items-center justify-center gap-3 font-black text-indigo-600 text-xs animate-pulse uppercase tracking-widest"><Zap size={18} /> Processing...</div>
                    ) : (
                       <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors"><Upload size={24} /></div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{assignmentData.fileUrl ? 'File ready' : 'Attach reference doc'}</p>
                       </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'assignment')} />
                 </div>

                 <button onClick={handleCreateAssignment} disabled={isPosting || isUploading} className={`w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50`}>
                    {isPosting ? 'Broadcasting...' : 'Assign to Class'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ── Topic Creation FAB ── */}
      {isFaculty && (
         <button onClick={() => setShowTopicModal(true)} className="fixed bottom-12 right-12 w-20 h-20 bg-gray-900 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group">
            <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute right-full mr-6 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-gray-900 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-xl pointer-events-none">Create Topic</div>
         </button>
      )}

      {showTopicModal && (
         <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowTopicModal(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100">
               <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Add New Topic</h3>
               <input value={topicName} onChange={e => setTopicName(e.target.value)} className="w-full h-16 px-8 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold outline-none transition-all mb-8 shadow-inner" placeholder="e.g. Quizzes, Exams..." />
               <div className="flex gap-4">
                  <button onClick={() => setShowTopicModal(false)} className="flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={handleAddTopic} className="flex-1 h-16 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">Add Topic</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ClassroomHub;
