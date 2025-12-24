import React from "react";
import LostAndFoundList from "../modules/lostAndFound/LostAndFoundList";

const LostAndFoundPage = () => {
  return (
    <div className="min-h-screen bg-iv-bg text-iv-text relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-12%] left-[-12%] w-[55%] h-[55%] bg-iv-indigo/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-12%] right-[-12%] w-[55%] h-[55%] bg-iv-emerald/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-iv-text via-iv-indigo to-iv-text tracking-tight">
            Lost & Found
          </h1>
          <p className="text-iv-muted mt-2">
            Report lost items or claim found items — keeping campus organized.
          </p>
        </div>

        <LostAndFoundList />
      </main>
    </div>
  );
};

export default LostAndFoundPage;
