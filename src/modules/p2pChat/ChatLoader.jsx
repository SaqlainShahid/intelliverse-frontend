import React from 'react';

export default function ChatLoader() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .shimmer-animation {
          animation: shimmer 2s ease-in-out infinite;
        }
        .float-animation {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>

      <div className="space-y-4 px-4 py-6">
        {/* Animated loading header */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-lg opacity-75 animate-pulse"></div>
            
            {/* Rotating ring */}
            <div className="relative w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin"></div>
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Message skeleton cards */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex items-end gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            {/* Avatar skeleton */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent shimmer-animation"></div>
            </div>

            {/* Message bubble skeleton */}
            <div className={`space-y-2 max-w-[60%] ${i % 2 === 0 ? '' : 'items-end flex flex-col'}`}>
              {/* Main message line */}
              <div className="relative h-10 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse overflow-hidden"
                style={{ width: i % 2 === 0 ? '200px' : '160px' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-animation"></div>
              </div>

              {/* Secondary line (shorter, like timestamps) */}
              <div className="relative h-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse overflow-hidden"
                style={{ width: i % 2 === 0 ? '80px' : '100px', animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-animation"></div>
              </div>
            </div>
          </div>
        ))}

        {/* Floating typing indicators */}
        <div className="flex justify-center gap-1 pt-8 pb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 float-animation" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 float-animation" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-pink-500 to-indigo-500 float-animation" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Shimmer overlay text */}
        <div className="text-center pt-4">
          <div className="inline-block">
            <span className="text-xs font-bold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse">
              Loading messages...
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

