import React from "react";
import LostAndFoundList from "../modules/lostAndFound/LostAndFoundList";

const LostAndFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-b-[2.5rem] p-8 sm:p-12 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.5)] overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner self-start sm:self-center">
             <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 21V14C10 13.4477 10.4477 13 11 13H13C13.5523 13 14 13.4477 14 14V21M12 3L21 11H18V21H14V14C14 13.4477 13.5523 13 13 13H11C10.4477 13 10 13.4477 10 14V21H6V11H3L12 3Z" />
             </svg>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight drop-shadow-md text-white">Lost & Found</h1>
            <p className="mt-2 text-indigo-100 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
              Report lost items or claim found items — keeping the campus organized and supportive.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
        <LostAndFoundList />
      </main>
    </div>
  );
};

export default LostAndFoundPage;
