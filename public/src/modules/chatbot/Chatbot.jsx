import React, { useState } from 'react';
import useChatbot from './useChatbot';

export default function Chatbot({ header = true, compact = false }) {
  const { messages, typing, send } = useChatbot();
  const [input, setInput] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  };

  return (
    <div className={`w-full ${compact ? 'h-full' : 'max-w-md mx-auto'} bg-white border border-green-200 rounded-2xl shadow-sm flex flex-col`}>
      {header && (
        <div className="px-4 py-3 bg-green-600 rounded-t-2xl">
          <h2 className="text-white font-semibold">AI HelpDesk Assistant</h2>
        </div>
      )}
      <div className={`p-4 space-y-3 ${compact ? 'flex-1 overflow-y-auto' : 'max-h-96 overflow-y-auto'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`${m.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-xl max-w-[80%]`}>{m.content}</div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-xl">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse"></span>
              </span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="p-4 border-t border-green-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-lg border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Send</button>
      </form>
    </div>
  );
}
