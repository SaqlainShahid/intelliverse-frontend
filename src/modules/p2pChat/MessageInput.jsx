import React, { useEffect, useRef, useState } from 'react';
import { Send, Plus, X, Mic, Square, Reply, Image, FileText, Music } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadMedia } from '../../services/chatService';

export default function MessageInput({ onSend, onTyping, replyTo, clearReply, disabled = false }) {
  const [text, setText] = useState('');
  const typingRef = useRef(false);
  const [recorder, setRecorder] = useState(null);
  const recorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const startTsRef = useRef(0);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const attachMenuRef = useRef(null);

  // Close attach menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setAttachMenuOpen(false);
      }
    };
    if (attachMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [attachMenuOpen]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (disabled) { toast.error('Sending is disabled in this chat'); return; }
    try {
      const res = await uploadMedia(file);
      if (res?.success && res.data) {
        window.dispatchEvent(new CustomEvent('chat:send-attachment', { detail: res.data }));
      }
    } catch {
      toast.error('Failed to upload file');
    }
    setAttachMenuOpen(false);
  };

  const pickMimeType = () => {
    if (window.MediaRecorder) {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/ogg')) return 'audio/ogg';
    }
    return 'audio/webm';
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    const nowTyping = v.length > 0;
    if (nowTyping !== typingRef.current) {
      typingRef.current = nowTyping;
      onTyping?.(nowTyping);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    const v = text.trim();
    if (!v) return;
    onSend(v);
    setText('');
    typingRef.current = false;
    onTyping?.(false);
    clearReply?.();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const r = recorderRef.current;
      if (r && r.state !== 'inactive') {
        try { r.stop(); } catch {}
      }
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(t => t.stop()); } catch {}
        streamRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (disabled) {
        toast.error('Sending is disabled in this chat');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onerror = (e) => {
        console.error('MediaRecorder error:', e?.error || e);
        toast.error('Recording error. Please try again.');
      };
      rec.onstop = async () => {
        if (!chunksRef.current.length) {
          toast.error('No audio captured. Please try again.');
          setSeconds(0);
          if (streamRef.current) {
            try { streamRef.current.getTracks().forEach(t => t.stop()); } catch {}
            streamRef.current = null;
          }
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mime });
        try {
          const res = await uploadMedia(file);
          if (res?.success && res.data) {
            const att = res.data;
            const evt = new CustomEvent('chat:send-attachment', { detail: att });
            window.dispatchEvent(evt);
          }
        } catch {
          toast.error('Failed to upload voice note');
        }
        setSeconds(0);
        if (streamRef.current) {
          try { streamRef.current.getTracks().forEach(t => t.stop()); } catch {}
          streamRef.current = null;
        }
      };
      rec.start();
      setRecorder(rec);
      recorderRef.current = rec;
      setRecording(true);
      setText('');
      typingRef.current = false;
      onTyping?.(false);
      setSeconds(0);
      startTsRef.current = Date.now();
      timerRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startTsRef.current) / 1000)), 500);
    } catch (err) {
      toast.error('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.requestData(); } catch {}
        recorder.stop();
      }
    } catch {}
    setRecording(false);
    setRecorder(null);
    recorderRef.current = null;
  };

  const disabledSend = disabled || !text.trim();
  return (
    <form onSubmit={handleSubmit} className="relative z-50"
      style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid rgba(0,0,0,0.06)' }}
    >
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-5 py-3 bg-violet-50/80 border-b border-violet-100 flex items-center gap-3">
          <div className="w-1 self-stretch bg-violet-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase text-violet-600 mb-0.5">Replying</p>
            <p className="text-sm text-gray-700 truncate">{replyTo.content || 'Attachment'}</p>
          </div>
          <button type="button" onClick={clearReply} className="p-1.5 rounded-lg hover:bg-white text-gray-400"><X size={14} /></button>
        </div>
      )}

      <div className="px-4 py-3 flex items-center gap-3">
        {/* + Attach */}
        <div className="relative" ref={attachMenuRef}>
          <input id="attach-image" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { handleFileUpload(e.target.files?.[0]); e.target.value = ''; }} />
          <input id="attach-doc" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" className="hidden" onChange={(e) => { handleFileUpload(e.target.files?.[0]); e.target.value = ''; }} />
          <input id="attach-audio" type="file" accept="audio/*" className="hidden" onChange={(e) => { handleFileUpload(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" disabled={disabled}
            onClick={() => !disabled && setAttachMenuOpen(!attachMenuOpen)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${attachMenuOpen ? 'bg-violet-600 text-white rotate-45' : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600'}`}>
            <Plus size={20} />
          </button>
          {attachMenuOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50">
              {[
                { id: 'attach-image', icon: Image, label: 'Image/Video', color: 'text-emerald-500' },
                { id: 'attach-doc', icon: FileText, label: 'Document', color: 'text-blue-500' },
                { id: 'attach-audio', icon: Music, label: 'Audio', color: 'text-violet-500' },
              ].map((item) => (
                <label key={item.id} htmlFor={item.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <item.icon size={16} className={item.color} />
                  <span className="text-[13px] font-medium text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Input with inline icons */}
        <div className="flex-1 flex items-center rounded-full border border-gray-100 bg-gray-50 px-4 py-2.5 gap-2 focus-within:border-violet-200 focus-within:bg-white transition-colors">
          <textarea rows={1} value={text} onChange={handleChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder={disabled ? "Sending disabled..." : "Type a message..."}
            disabled={recording || disabled}
            className="flex-1 bg-transparent outline-none text-[14px] text-gray-800 placeholder:text-gray-400 font-medium resize-none max-h-32 py-1"
            style={{ minHeight: '24px' }}
          />
          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-colors" title="Emoji">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            <label htmlFor="attach-image" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-colors cursor-pointer" title="Attach">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </label>
            {!text.trim() && (
              <button type="button" onClick={() => (recording ? stopRecording() : startRecording())} disabled={disabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${recording ? 'bg-rose-500 text-white animate-pulse' : 'text-gray-400 hover:text-violet-500 hover:bg-violet-50'}`}>
                {recording ? <Square size={14} className="fill-current" /> : <Mic size={18} />}
              </button>
            )}
          </div>
        </div>

        {recording && <span className="text-[11px] font-mono font-bold text-rose-500 animate-pulse">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>}

        {/* Round purple send */}
        <button onClick={handleSubmit} disabled={disabled || (!text.trim() && !recording)}
          className={`h-11 w-11 rounded-full flex items-center justify-center transition-all shrink-0 ${disabledSend ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white hover:scale-105 active:scale-95'}`}
          style={disabledSend ? {} : { background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
          <Send size={18} />
        </button>
      </div>

      <div className="text-center pb-2 pt-0">
        <span className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Your messages are end-to-end encrypted
        </span>
      </div>
    </form>
  );
}
