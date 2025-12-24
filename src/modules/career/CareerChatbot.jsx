import React, { useState, useEffect } from 'react';
import useCareerChatbot from './useCareerChatbot';
import { getInternships } from '../api/careerApi';

export default function CareerChatbot({ header = true, compact = false }) {
  const { messages, typing, send, clear, preferredSkills, setPreferredSkills, intent, setIntent, cancel } = useCareerChatbot();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  };

  const onQuick = async (v) => {
    const skills = String(preferredSkills || '').trim();
    let text = '';
    if (v === 'roles') text = skills ? `Find roles matching my skills: ${skills}` : 'Find roles matching my skills';
    if (v === 'opportunities') text = skills ? `Top opportunities that fit my skills: ${skills}` : 'Top opportunities that fit me';
    if (v === 'roadmap') text = skills ? `Create a skill roadmap for: ${skills}` : 'Create a skill roadmap for me';
    if (v === 'resume') text = skills ? `Resume tips based on: ${skills}` : 'Resume tips for my profile';
    if (v === 'interview') text = skills ? `Interview prep for: ${skills}` : 'Interview prep tips for me';
    if (!text) return;
    await send(text, v);
  };

  const loadSuggested = async (intentToUse) => {
    if (!preferredSkills || !['roles', 'opportunities'].includes(intentToUse)) {
      setSuggested([]);
      return;
    }
    setSuggestLoading(true);
    try {
      const { items } = await getInternships({ skills: preferredSkills });
      setSuggested(Array.isArray(items) ? items.slice(0, 3) : []);
    } catch {
      setSuggested([]);
    } finally {
      setSuggestLoading(false);
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastIntent = lastAssistant?.meta?.intent || null;

  useEffect(() => {
    if (lastIntent) {
      loadSuggested(lastIntent);
    }
  }, [lastIntent, preferredSkills]);

  return (
    <div className={`w-full ${compact ? 'h-[360px]' : 'max-w-md mx-auto'} bg-white border border-indigo-200 rounded-2xl shadow-sm flex flex-col`}>
      {header && (
        <div className="px-3 py-2 bg-indigo-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">AI Career Guidance</h2>
            <button onClick={clear} className="text-white/90 hover:text-white text-xs underline">Clear</button>
          </div>
        </div>
      )}
      <div className="px-3 pt-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-2 py-2 text-xs"
            title="Focus the assistant response"
          >
            <option value="roles">Matching Roles</option>
            <option value="opportunities">Top Opportunities</option>
            <option value="roadmap">Skill Roadmap</option>
            <option value="resume">Resume Tips</option>
            <option value="interview">Interview Prep</option>
          </select>
          <input
            value={preferredSkills}
            onChange={(e) => setPreferredSkills(e.target.value)}
            placeholder="Skills, e.g., React, Node.js"
            className="w-full rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onQuick('roles')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Roles</button>
          <button onClick={() => onQuick('opportunities')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Opportunities</button>
          <button onClick={() => onQuick('roadmap')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Roadmap</button>
          <button onClick={() => onQuick('resume')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Resume</button>
          <button onClick={() => onQuick('interview')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Interview</button>
        </div>
        {lastIntent && (
          <div className="flex flex-wrap gap-2">
            {['roles', 'opportunities'].includes(lastIntent) && (
              <>
                <button onClick={() => onQuick('roadmap')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Make Roadmap</button>
                <button onClick={() => loadSuggested(lastIntent)} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Attach Internships</button>
                <button onClick={() => onQuick('resume')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Resume Bullets</button>
              </>
            )}
            {lastIntent === 'resume' && (
              <>
                <button onClick={() => onQuick('roles')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Find Roles</button>
                <button onClick={() => onQuick('interview')} className="px-2 py-1 rounded-full border border-indigo-200 text-xs hover:bg-indigo-50">Interview Prep</button>
              </>
            )}
          </div>
        )}
      </div>
      <div className={`p-3 space-y-2 ${compact ? 'flex-1 overflow-y-auto' : 'max-h-96 overflow-y-auto'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-1.5 rounded-xl max-w-[80%] whitespace-pre-wrap text-[12px] leading-relaxed ${m.role !== 'user' ? 'relative pr-8 group' : ''}`}>
              {m.role !== 'user' && m.meta?.confidence && (
                <span className="absolute -top-2 left-2 bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full">
                  {m.meta.confidence}
                </span>
              )}
              {m.content}
              {m.role !== 'user' && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(m.content);
                    setCopiedId(m.id);
                    setTimeout(() => setCopiedId(null), 1200);
                  }}
                  className="absolute top-1 right-2 text-[10px] text-gray-500 hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition"
                  title={copiedId === m.id ? 'Copied' : 'Copy'}
                >
                  {copiedId === m.id ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-xl">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse"></span>
              </span>
            </div>
            <button onClick={cancel} className="ml-2 text-xs text-red-600 underline">Cancel</button>
          </div>
        )}
        {lastIntent && ['roles', 'opportunities'].includes(lastIntent) && (
          <div className="mt-2">
            <div className="text-xs text-gray-600 mb-1">Suggested Internships</div>
            {suggestLoading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : suggested.length === 0 ? (
              <div className="text-xs text-gray-500">No suggestions found.</div>
            ) : (
              <div className="space-y-1">
                {suggested.map((it) => (
                  <div key={it._id || `${it.company}-${it.title}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1">
                    <div className="text-[12px] text-gray-800">
                      {it.title} • <span className="text-gray-600">{it.company}</span>
                    </div>
                    <button
                      onClick={() => window.location.assign('/career/internships')}
                      className="text-[11px] text-indigo-600 underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="p-3 border-t border-indigo-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about roles, internships, resume tips..."
          className="flex-1 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 text-sm"
        />
        <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Send</button>
      </form>
    </div>
  );
}
