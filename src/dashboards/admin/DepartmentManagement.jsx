import React, { useState, useEffect } from 'react';
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUserShield, FaKey, FaUsers, FaChalkboardTeacher, FaUserTie, FaEye, FaEnvelope, FaComment, FaUserGraduate } from 'react-icons/fa';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// Department list - same as signup
const DEPARTMENT_LIST = [
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

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [deptStats, setDeptStats] = useState({});
  const [deptDetails, setDeptDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentMembers, setDepartmentMembers] = useState({ hods: [], faculty: [], students: [] });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '', recipients: [] });
  const [messageForm, setMessageForm] = useState({ to: '', message: '', recipients: [] });
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    keywords: ''
  });

  useEffect(() => {
    fetchAllDepartmentData();
  }, []);

  const fetchAllDepartmentData = async () => {
    setLoading(true);
    try {
      // Fetch both stats and details
      const [statsRes, detailsRes] = await Promise.all([
        api.get('/admin/department-stats'),
        api.get('/ai/departments').catch(() => ({ data: { data: [] } }))
      ]);

      // Set base departments from DEPARTMENT_LIST
      setDepartments(DEPARTMENT_LIST);

      // Create stats map
      const statsMap = {};
      statsRes.data.data.forEach(stat => {
        statsMap[stat.name] = stat;
      });
      setDeptStats(statsMap);

      // Create details map from backend departments
      const detailsMap = {};
      (detailsRes.data.data || []).forEach(dept => {
        detailsMap[dept.name] = dept;
      });
      setDeptDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching department data:', error);
      // Still show the base departments even if backend fetch fails
      setDepartments(DEPARTMENT_LIST);
      toast.error('Failed to load some department information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDepartment = async () => {
    try {
      const payload = {
        name: formData.name,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      };

      await api.post('/ai/departments/manage', payload);
      toast.success(`Department ${editingDept ? 'updated' : 'created'} successfully!`);
      setShowAddModal(false);
      setEditingDept(null);
      setFormData({ name: '', keywords: '' });
      fetchAllDepartmentData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      keywords: dept.keywords?.join(', ') || ''
    });
    setShowAddModal(true);
  };

  const fetchDepartmentMembers = async (deptName) => {
    try {
      const response = await api.get(`/admin/department/${deptName}/members`);
      const data = response.data.data || response.data;
      setDepartmentMembers({
        hods: data.hods || [],
        faculty: data.faculty || [],
        students: data.students || []
      });
      setSelectedDepartment(deptName);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching department members:', error);
      toast.error('Failed to load department members');
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipients.length) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!emailForm.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!emailForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await api.post('/admin/send-bulk-email', {
        recipients: emailForm.recipients,
        subject: emailForm.subject,
        message: emailForm.message,
        department: selectedDepartment
      });
      toast.success(`Email sent to ${emailForm.recipients.length} recipient(s)`);
      setShowEmailModal(false);
      setEmailForm({ to: '', subject: '', message: '', recipients: [] });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.recipients.length) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!messageForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await api.post('/admin/send-bulk-message', {
        recipients: messageForm.recipients,
        message: messageForm.message,
        department: selectedDepartment
      });
      toast.success(`Message sent to ${messageForm.recipients.length} recipient(s)`);
      setShowMessageModal(false);
      setMessageForm({ to: '', message: '', recipients: [] });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const departmentTypes = [
    'IT', 'Finance', 'Exams', 'Admissions', 'Hostel', 'Library', 'Career', 'Other'
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-50 rounded-2xl">
              <FaBuilding className="text-indigo-600 text-xl" />
           </div>
           <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest leading-none mb-1">Architecture & Sectors</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Department Oversight & Command</p>
           </div>
        </div>
        <button
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: '', keywords: '', admins: [] });
            setShowAddModal(true);
          }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-1 transition-all flex items-center gap-2"
        >
          <FaPlus /> Initialize Sector
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
           <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing Infrastructure...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {departments.map((deptName) => {
            const details = deptDetails[deptName] || {};
            const stats = deptStats[deptName] || {};
            return (
            <div key={deptName} className="group bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)]">
              <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-800 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                   <FaBuilding size={80} />
                </div>
                <div className="relative z-10 flex items-center justify-between mb-8">
                   <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest">Active Sector</div>
                   <div className="flex gap-2">
                       <button onClick={() => fetchDepartmentMembers(deptName)} className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl transition-all shadow-sm"><FaEye size={14} /></button>
                       <button onClick={() => handleEdit(details)} className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl transition-all shadow-sm"><FaEdit size={14} /></button>
                   </div>
                </div>
                <h3 className="relative z-10 text-2xl font-black tracking-tight mb-6 uppercase">{deptName}</h3>
                
                <div className="relative z-10 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Faculty', val: stats.facultyCount || 0, icon: FaChalkboardTeacher },
                    { label: 'Students', val: stats.studentCount || 0, icon: FaUserGraduate },
                    { label: 'Leaders', val: stats.hodCount || 0, icon: FaUserTie },
                  ].map(s => (
                    <div key={s.label} className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                       <p className="text-[10px] font-black text-white/70 uppercase tracking-tighter leading-none mb-1">{s.label}</p>
                       <p className="text-lg font-black">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* HOD Intelligence */}
                {stats.hod ? (
                  <div className="flex items-center gap-4 p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 group/hod transition-all hover:bg-indigo-50">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100"><FaUserTie /></div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Head of Department</p>
                      <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{stats.hod.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-5 bg-amber-50/50 rounded-3xl border border-amber-100">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100"><FaUserTie /></div>
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-tight">No Leadership<br/>Designated</p>
                  </div>
                )}

                {/* Tag Cluster */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Metadata Focus</p>
                  <div className="flex flex-wrap gap-2">
                    {details.keywords?.length > 0 ? (
                      details.keywords.slice(0, 4).map((kw, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white border border-gray-100 text-[9px] font-black text-gray-500 uppercase tracking-widest rounded-full shadow-sm hover:border-indigo-200 transition-colors cursor-default">
                          {kw}
                        </span>
                      ))
                    ) : <span className="text-[10px] font-bold text-gray-300 uppercase italic">No Sector Tokens</span>}
                    {details.keywords?.length > 4 && <span className="px-3 py-1.5 bg-gray-50 text-[9px] font-black text-gray-400 uppercase rounded-full">+{details.keywords.length - 4}</span>}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modals - Simplified for Token Limit */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl max-w-xl w-full mx-4 overflow-hidden border border-white/50">
            <div className="bg-indigo-600 p-10 text-white text-center">
               <h3 className="text-xl font-black uppercase tracking-widest">{editingDept ? 'Modify Infrastructure' : 'Initialize Sector'}</h3>
            </div>
            <div className="p-10 space-y-6">
               <select value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest">
                  <option value="">Select Designation</option>
                  {departmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
               <textarea value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest min-h-[100px]" placeholder="Keywords..."/>
               <div className="flex gap-4">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase">Cancel</button>
                  <button onClick={handleSaveDepartment} className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase">Sync</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedDepartment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl max-w-4xl w-full mx-4 overflow-hidden border border-white/50 flex flex-col max-h-[85vh]">
              <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-widest">{selectedDepartment}</h3>
                 <button onClick={() => setShowDetailModal(false)} className="p-2 bg-white/20 rounded-xl"><FaTimes/></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8">
                 <div className="flex gap-4">
                    <button onClick={() => setShowEmailModal(true)} className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100">Broadcast Email</button>
                    <button onClick={() => setShowMessageModal(true)} className="flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">Internal Message</button>
                 </div>
                 {['hods', 'faculty', 'students'].map(key => departmentMembers[key]?.length > 0 && (
                   <div key={key}>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{key} ({departmentMembers[key].length})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {departmentMembers[key].slice(0, 10).map(m => (
                            <div key={m._id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center">
                               <div>
                                  <p className="text-[10px] font-black text-gray-800 uppercase">{m.profile?.firstName} {m.profile?.lastName}</p>
                                  <p className="text-[9px] text-gray-400">{m.email}</p>
                               </div>
                               <a href={`mailto:${m.email}`} className="text-indigo-400"><FaEnvelope size={12}/></a>
                            </div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Simplified Communication Modals */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 p-8 border border-white/50">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6">Dispatch Broadcast</h3>
              <div className="space-y-4">
                 <input type="text" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} placeholder="Subject" className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black uppercase"/>
                 <textarea value={emailForm.message} onChange={e => setEmailForm({...emailForm, message: e.target.value})} placeholder="Content..." className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black min-h-[150px]"/>
                 <div className="flex gap-4">
                    <button onClick={() => setShowEmailModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase">Abort</button>
                    <button onClick={handleSendEmail} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Send</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 p-8 border border-white/50">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6">Internal Pulse</h3>
              <div className="space-y-4">
                 <textarea value={messageForm.message} onChange={e => setMessageForm({...messageForm, message: e.target.value})} placeholder="Message..." className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black min-h-[150px]"/>
                 <div className="flex gap-4">
                    <button onClick={() => setShowMessageModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase">Abort</button>
                    <button onClick={handleSendMessage} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Send</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
