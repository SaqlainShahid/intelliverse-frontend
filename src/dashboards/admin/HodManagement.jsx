import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  FaUserTie, FaSearch, FaFilter, FaExclamationTriangle, 
  FaCheckCircle, FaTimes, FaUserPlus, FaUserMinus, FaCopy
} from 'react-icons/fa';

const DEPARTMENT_LIST = [
  'Computer Science', 'Software Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Mathematics', 'Physics', 'Chemistry', 'Other'
];

const HodManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('faculty');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingHodInfo, setExistingHodInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [hodToRemove, setHodToRemove] = useState(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicates, setDuplicates] = useState(null);

  useEffect(() => {
    if (selectedTab === 'faculty') {
      fetchFaculty();
    } else {
      fetchHods();
    }
  }, [selectedTab, search, department, page]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/faculty', {
        params: { search, department, page, limit: 10 }
      });
      setFaculty(response.data.data.faculty);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHods = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/hods', {
        params: { department, page, limit: 10 }
      });
      setHods(response.data.data.hods);
    } catch (error) {
      console.error('Error fetching HODs:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignHod = async (facultyId) => {
    try {
      const response = await api.post(`/admin/assign-hod/${facultyId}`, {});
      setSuccessMessage(`${response.data.data.user.profile.firstName} ${response.data.data.user.profile.lastName} is now the HOD of ${response.data.data.user.profile.department}!`);
      setShowSuccessModal(true);
      fetchFaculty();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.data?.existingHod) {
        setErrorMessage(errorData.message);
        setExistingHodInfo(errorData.data.existingHod);
        setShowErrorModal(true);
      } else {
        setErrorMessage(errorData?.message || 'Failed to assign HOD');
        setShowErrorModal(true);
      }
    }
  };

  const removeHod = async (hodId) => {
    try {
      const response = await api.post(`/admin/remove-hod/${hodId}`, {});
      setShowRemoveModal(false);
      setHodToRemove(null);
      setSuccessMessage(`${response.data.data.user.profile.firstName} ${response.data.data.user.profile.lastName} has been downgraded to Faculty role.`);
      setShowSuccessModal(true);
      fetchHods();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to remove HOD');
      setShowErrorModal(true);
    }
  };

  const checkDuplicates = async () => {
    try {
      const response = await api.get('/admin/check-duplicate-hods');
      const data = response.data.data;
      if (data.hasDuplicates) {
        setDuplicates(data);
        setShowDuplicatesModal(true);
      } else {
        setSuccessMessage('System Audit Complete: No duplicate HODs detected! ✨');
        setShowSuccessModal(true);
      }
    } catch (error) {
      setErrorMessage('Failed to perform system audit');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700">
      <div className="bg-white/80 backdrop-blur-3xl border border-rose-100 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(244,63,94,0.06)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-rose-50 rounded-2xl shrink-0">
                <FaUserTie className="text-rose-600 text-xl" />
             </div>
             <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest leading-none mb-1">Leadership Management</h2>
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest truncate">Appoint and Audit Departmental Personnel</p>
             </div>
          </div>
          <button
            onClick={checkDuplicates}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-100 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <FaCopy /> Audit Registry
          </button>
        </div>

        {/* Tab System */}
        <div className="flex bg-gray-50/80 p-1 rounded-full border border-gray-200 w-full sm:max-w-fit mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'faculty', label: 'Assign Leadership', icon: FaUserPlus },
            { id: 'hods', label: 'Monitor HODs', icon: FaUserMinus },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-2.5 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-rose-600'
              }`}
            >
              <tab.icon size={12} className="shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 group">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search faculty name or email reference..."
              value={search}
              onChange={(e) => {setSearch(e.target.value); setPage(1);}}
              className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-bold uppercase tracking-widest placeholder:text-gray-400"
            />
          </div>
          <div className="relative group min-w-[240px]">
            <FaFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            <select
              value={department}
              onChange={(e) => {setDepartment(e.target.value); setPage(1);}}
              className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white appearance-none transition-all text-xs font-bold uppercase tracking-widest text-gray-700 cursor-pointer"
            >
              <option value="">Global Department View</option>
              {DEPARTMENT_LIST.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white/40">
           {loading ? (
             <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing Registry...</p>
             </div>
           ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member Identity</th>
                    <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Academic Department</th>
                    <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operational Actions</th>
                  </tr>
                </thead>
               <tbody className="divide-y divide-gray-50">
                 {(selectedTab === 'faculty' ? faculty : hods).map((member) => (
                   <tr key={member._id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-500 font-black text-xs shadow-sm border border-white">
                              {member.profile.firstName[0]}{member.profile.lastName[0]}
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                                 {member.profile.firstName} {member.profile.lastName}
                              </p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{member.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className="px-4 py-1.5 rounded-full bg-white border border-gray-100 text-[9px] font-black text-gray-600 uppercase tracking-widest shadow-sm">
                           {member.profile.department}
                        </span>
                     </td>
                     <td className="px-8 py-6 text-right">
                       {selectedTab === 'faculty' ? (
                          <button
                            onClick={() => assignHod(member._id)}
                            className="px-6 py-2.5 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:shadow-rose-200 hover:-translate-y-0.5 transition-all"
                          >
                            Appoint HOD
                          </button>
                       ) : (
                          <button
                            onClick={() => { setHodToRemove(member); setShowRemoveModal(true); }}
                            className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          >
                            Revoke Status
                          </button>
                       )}
                     </td>
                   </tr>
                 ))}
                 {(selectedTab === 'faculty' ? faculty : hods).length === 0 && (
                   <tr>
                     <td colSpan="3" className="px-8 py-20 text-center">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No Records found in this sector</p>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           )}
        </div>
      </div>

      {/* Modals System */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-rose-500 to-red-600 p-10 text-white text-center">
               <FaExclamationTriangle className="text-5xl mx-auto mb-6 animate-bounce" />
               <h3 className="text-xl font-black uppercase tracking-widest">Leadership Conflict</h3>
            </div>
            <div className="p-10 text-center">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">{errorMessage}</p>
               {existingHodInfo && (
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 text-left">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Appointee</p>
                    <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-1">{existingHodInfo.name}</p>
                    <p className="text-[10px] font-bold text-indigo-500">{existingHodInfo.email}</p>
                 </div>
               )}
               <div className="flex gap-4">
                  <button onClick={() => { setShowErrorModal(false); setSelectedTab('hods'); }} className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:-translate-y-1 transition-all">Resolve Registry</button>
                  <button onClick={() => setShowErrorModal(false)} className="flex-1 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Dismiss</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-10 text-white text-center">
                 <FaCheckCircle className="text-5xl mx-auto mb-6" />
                 <h3 className="text-xl font-black uppercase tracking-widest">Registry Updated</h3>
              </div>
              <div className="p-10 text-center">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">{successMessage}</p>
                 <button onClick={() => setShowSuccessModal(false)} className="w-full px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:-translate-y-1 transition-all uppercase">Acknowledge</button>
              </div>
           </div>
        </div>
      )}

      {showRemoveModal && hodToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-10 text-white text-center">
                 <FaUserMinus className="text-5xl mx-auto mb-6" />
                 <h3 className="text-xl font-black uppercase tracking-widest">Revoke Leadership</h3>
              </div>
              <div className="p-10 text-center">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">
                    Initiating roll-back for <strong>{hodToRemove.profile.firstName} {hodToRemove.profile.lastName}</strong>. Access permissions will be reverted to standard Faculty level.
                 </p>
                 <div className="flex gap-4">
                    <button onClick={() => removeHod(hodToRemove._id)} className="flex-1 px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:-translate-y-1 transition-all">Confirm Revoke</button>
                    <button onClick={() => setShowRemoveModal(false)} className="flex-1 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Abort</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showDuplicatesModal && duplicates && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300 flex flex-col">
              <div className="bg-rose-500 p-10 text-white text-center shrink-0">
                 <FaExclamationTriangle className="text-5xl mx-auto mb-4" />
                 <h3 className="text-xl font-black uppercase tracking-widest">Duplicate Registry Warning</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-2">
                    Multiple Leaders detected across {Object.keys(duplicates.duplicates).length} Departments
                 </p>
              </div>
              <div className="p-10 overflow-y-auto custom-scrollbar space-y-6">
                 {Object.entries(duplicates.duplicates).map(([dept, members]) => (
                    <div key={dept} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                       <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                          <span>{dept}</span>
                          <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[9px]">{members.length} CONFLICTS</span>
                       </h4>
                       <div className="space-y-3">
                          {members.map((m, idx) => (
                             <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                <div>
                                   <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{m.name}</p>
                                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{m.email}</p>
                                </div>
                                <button
                                   onClick={() => {
                                      const memberData = { _id: m.id, email: m.email, profile: { firstName: m.name.split(' ')[0], lastName: m.name.split(' ').slice(1).join(' '), department: dept } };
                                      setHodToRemove(memberData); setShowDuplicatesModal(false); setShowRemoveModal(true);
                                   }}
                                   className="px-5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                   Remove
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
                 <button onClick={() => setShowDuplicatesModal(false)} className="w-full px-8 py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all">Return to Registry</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HodManagement;
