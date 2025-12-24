import React, { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Mic, Square, Reply } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="sticky bottom-0 left-0 right-0 z-10 p-4 border-t border-iv-border bg-iv-glass/90 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {replyTo && (
          <div className="absolute bottom-full left-0 right-0 mb-0 px-4 py-2 bg-iv-glass backdrop-blur-md border-t border-iv-border flex justify-between items-center animate-fade-in-up">
            <div className="flex items-center gap-2 text-sm text-iv-indigo font-medium overflow-hidden">
              <Reply className="h-4 w-4 shrink-0" />
              <span className="truncate">
                Replying to: {(replyTo.content || (replyTo.attachments && replyTo.attachments[0]?.filename) || 'Attachment')}
              </span>
            </div>
            <button type="button" onClick={clearReply} className="text-iv-muted hover:text-iv-text p-1 rounded-full hover:bg-black/5 transition-colors">
               <span className="sr-only">Close</span>
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <label className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-all duration-200 ${disabled ? 'border-iv-border opacity-60 cursor-not-allowed' : 'border-iv-border bg-white/50 hover:bg-iv-indigo/10 hover:border-iv-indigo/30 cursor-pointer text-iv-muted hover:text-iv-indigo'}`}>
          <Paperclip className="h-5 w-5" />
          <input
            type="file"
            accept="image/*,video/*,audio/*,application/pdf"
            className="hidden"
            onChange={async (e) => {
              if (disabled) {
                e.target.value = '';
                toast.error('Sending is disabled in this chat');
                return;
              }
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const res = await uploadMedia(file);
                if (res?.success && res.data) {
                  const att = res.data;
                  const evt = new CustomEvent('chat:send-attachment', { detail: att });
                  window.dispatchEvent(evt);
                }
              } catch {}
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => (recording ? stopRecording() : startRecording())}
          disabled={disabled}
          className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-all duration-200 ${disabled ? 'border-iv-border opacity-60 cursor-not-allowed' : recording ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-iv-border bg-white/50 hover:bg-iv-indigo/10 hover:border-iv-indigo/30 text-iv-muted hover:text-iv-indigo'}`}
          title={recording ? 'Stop recording' : 'Record voice'}
        >
          {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
        </button>
        {recording && (
          <div className="text-sm text-red-600 font-bold font-mono px-2 animate-pulse">
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
          </div>
        )}
        <input
          className="flex-1 bg-white/50 border border-iv-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-iv-indigo/50 text-iv-text placeholder:text-iv-muted transition-all duration-200"
          placeholder="Type a message..."
          value={text}
          onChange={handleChange}
          disabled={recording || disabled}
        />
        <button
          type="submit"
          disabled={disabledSend}
          className={`h-11 px-6 rounded-xl inline-flex items-center gap-2 font-medium transition-all duration-200 shadow-lg shadow-iv-indigo/20 ${disabledSend ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-iv-indigo text-white hover:bg-iv-indigo/90 hover:scale-105 active:scale-95'}`}
        >
          <Send className="h-4 w-4" />
          <span>Send</span>
        </button>
      </div>
    </form>
  );
}
