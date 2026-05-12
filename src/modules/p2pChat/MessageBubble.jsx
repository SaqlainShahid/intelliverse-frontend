import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, FileDown, Play, Pause, MoreVertical, Reply, Pin, Smile, Edit3, Trash2, Download } from 'lucide-react';

export default function MessageBubble({ message, sender, isOwn, onReply, onReact, onPin, canPin, canModerate, onEdit, onDelete, onVote }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const status = message.status;
  const isSending = status === 'sending';
  const isFailed  = status === 'failed';

  const StatusIcon = () => {
    if (!isOwn) return null;
    if (isFailed)   return <span className="text-red-300 text-[10px] font-bold">✕ Failed</span>;
    if (isSending)  return <span className="text-white/40 text-[10px] animate-pulse">●</span>;
    if (status === 'seen')      return <CheckCheck className="h-3.5 w-3.5 text-cyan-300" />;
    if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-white/70" />;
    return <Check className="h-3.5 w-3.5 text-white/50" />;
  };
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');

  const handleDownload = (e, att) => {
    e.preventDefault();
    e.stopPropagation();

    let dlUrl = att.url;

    // Add fl_attachment so Cloudinary sends Content-Disposition: attachment
    // This forces the browser to download instead of previewing in-tab
    if (dlUrl && dlUrl.includes('cloudinary.com') && dlUrl.includes('/upload/')) {
      const safeName = (att.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      dlUrl = dlUrl.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
    }

    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = att.filename || 'download';
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const ReactionsBar = () => {
    const grouped = (message.reactions || []).reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(grouped);
    if (!entries.length) return null;
    return (
      <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${isOwn ? 'bg-white/20 text-white' : 'bg-iv-indigo/10 text-iv-indigo border border-iv-indigo/20'}`}>
        {entries.map(([emoji, count]) => (
          <span key={emoji}>{emoji} {count}</span>
        ))}
      </div>
    );
  };

  const ReplyPreview = () => {
    if (!message.replyTo) return null;
    const r = message.replyTo;
    const text = r?.content || (r?.attachments && r.attachments[0]?.filename) || 'Attachment';
    return (
      <div className={`mb-1 text-xs rounded-lg px-3 py-1.5 ${isOwn ? 'bg-white/20 text-white border-l-2 border-white/50' : 'bg-iv-indigo/5 text-iv-text border-l-2 border-iv-indigo'}`}>
        <span className="opacity-80 font-medium">Replying to: </span><span className="truncate">{text}</span>
      </div>
    );
  };

  const AudioPlayer = ({ src }) => {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const [speed, setSpeed] = useState(1);
    const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
    const [peaks, setPeaks] = useState([]);
    const barsRef = useRef(null);
    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const ss = Math.floor(s % 60);
      return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };
    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      const onMeta = () => setDuration(a.duration || 0);
      const onTime = () => setCurrent(a.currentTime || 0);
      const onEnded = () => setPlaying(false);
      a.addEventListener('loadedmetadata', onMeta);
      a.addEventListener('timeupdate', onTime);
      a.addEventListener('ended', onEnded);
      return () => {
        a.pause();
        a.removeEventListener('loadedmetadata', onMeta);
        a.removeEventListener('timeupdate', onTime);
        a.removeEventListener('ended', onEnded);
      };
    }, [src]);
    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.playbackRate = speed;
    }, [speed]);
    useEffect(() => {
      let ctx;
      let active = true;
      const run = async () => {
        try {
          const res = await fetch(src, { cache: 'force-cache' });
          const ab = await res.arrayBuffer();
          const AC = window.AudioContext || window.webkitAudioContext;
          ctx = new AC();
          const buf = await ctx.decodeAudioData(ab);
          const data = buf.getChannelData(0);
          const bars = 28;
          const block = Math.floor(data.length / bars) || 1;
          const arr = [];
          for (let i = 0; i < bars; i++) {
            const start = i * block;
            const end = Math.min(start + block, data.length);
            let sum = 0;
            for (let j = start; j < end; j++) sum += Math.abs(data[j]);
            const avg = sum / (end - start || 1);
            arr.push(avg);
          }
          const max = arr.reduce((a, b) => (a > b ? a : b), 0) || 1;
          const norm = arr.map(v => Math.max(0.08, v / max));
          if (active) setPeaks(norm);
          try {
            if (ctx && ctx.state !== 'closed') await ctx.close();
          } catch {}
          ctx = null;
        } catch {
          const fallback = Array.from({ length: 24 }, (_, i) => 0.35 + 0.25 * Math.sin(i * 0.6));
          setPeaks(fallback);
        }
      };
      run();
      return () => {
        active = false;
        if (ctx && ctx.state !== 'closed') {
          try { ctx.close().catch(() => {}); } catch {}
        }
        ctx = null;
      };
    }, [src]);
    const toggle = async () => {
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        try {
          await a.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      }
    };
    const toggleSpeed = () => {
      setSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
    };
    const accentDot = isOwn ? 'bg-green-700' : 'bg-indigo-700';
    const bars = peaks.length ? peaks : Array.from({ length: 24 }, (_, i) => 0.4 + 0.2 * Math.sin(i * 0.7));
    return (
      <div className="bg-white rounded-full px-3 py-2 flex items-center gap-3 text-gray-900">
        <button onClick={toggle} className="h-8 w-8 rounded-full flex items-center justify-center border border-gray-300">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div ref={barsRef} className="relative flex-1 h-10 flex items-end gap-[2px]">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded bg-gray-400"
              style={{ height: `${Math.round(6 + h * 18)}px` }}
            />
          ))}
          <div
            className={`absolute top-2 ${accentDot} rounded-full h-2 w-2`}
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div className={`text-xs ${isOwn ? 'text-gray-700' : 'text-gray-700'} font-semibold min-w-[40px] text-right`}>
          {fmt(duration || 0)}
        </div>
        <button onClick={toggleSpeed} className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
          {`${speed}x`}
        </button>
        <button className="h-8 w-8 rounded-full flex items-center justify-center">
          <MoreVertical className={`h-4 w-4 ${isOwn ? 'text-gray-800' : 'text-gray-800'}`} />
        </button>
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      </div>
    );
  };

  const PollView = ({ poll }) => {
    if (!poll || !Array.isArray(poll.options)) return null;
    const disabled = message?.poll?.closed || (message?.poll?.deadline && new Date(message.poll.deadline).getTime() < Date.now());
    return (
      <div className="space-y-2">
        {message.poll?.question && <div className="font-semibold">{message.poll.question}</div>}
        <div className="space-y-1">
          {poll.options.map((opt, idx) => (
            <button
              key={`opt-${idx}`}
              disabled={disabled}
              onClick={() => onVote && onVote(idx)}
              className={`w-full text-left px-3 py-2 rounded-md border ${isOwn ? 'border-green-300' : 'border-gray-300'} hover:bg-gray-50`}
            >
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <span className="text-xs opacity-70">{typeof opt.count === 'number' ? opt.count : 0}</span>
              </div>
            </button>
          ))}
        </div>
        {message.poll?.deadline && (
          <div className="text-[11px] opacity-70">Ends {new Date(message.poll.deadline).toLocaleString()}</div>
        )}
      </div>
    );
  };

  return (
    <div id={`message-${message._id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-2 group/msg`}
      style={{ animation: 'msgIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      <style>{`@keyframes msgIn { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
      <div className={`relative max-w-[85%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name for Groups */}
        {!isOwn && (sender?.profile?.firstName) && (
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">{sender.profile.firstName}</span>
        )}

        <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isOwn && (
            <div className="flex-shrink-0 mb-1 transform transition-transform group-hover/msg:scale-110">
              {sender?.profile?.avatar ? (
                <div className="p-0.5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                  <img src={sender.profile.avatar} alt="Avatar" className="w-8 h-8 rounded-[0.6rem] object-cover bg-gray-50 cursor-pointer" onClick={() => sender?._id && (window.location.href = `/profile/${sender._id}`)} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm border border-indigo-100 cursor-pointer" onClick={() => sender?._id && (window.location.href = `/profile/${sender._id}`)}>
                  {(sender?.profile?.firstName || sender?.profile?.lastName || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

        <div className={`relative px-4 py-3 transition-all duration-200 group-hover/msg:scale-[1.01] ${
          isOwn
            ? 'rounded-[20px] rounded-tr-[6px]'
            : 'rounded-[20px] rounded-tl-[6px]'
        }`}
          style={isOwn ? {
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 60%, #8b5cf6 100%)',
            boxShadow: '0 2px 8px rgba(124,58,237,0.25), 0 8px 24px rgba(99,102,241,0.2), 0 0 0 1px rgba(139,92,246,0.15)',
          } : {
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(167,139,250,0.18)',
            boxShadow: '0 2px 8px rgba(139,92,246,0.06), 0 8px 24px rgba(99,102,241,0.08)',
          }}
        >
          <ReplyPreview />
          
          {message.isDeleted ? (
            <div className="text-sm opacity-60 italic font-medium flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" /> This message was deleted
            </div>
          ) : (
          <div className="space-y-2">
            {!!(message.attachments && message.attachments.length) && (
              <div className="space-y-2 mb-2">
                {message.attachments.map((att) => (
                  <div key={att.publicId} className="rounded-2xl overflow-hidden shadow-sm relative group/att inline-block w-full">
                    {att.kind === 'image' ? (
                      <div className="relative">
                        <a href={att.url} target="_blank" rel="noreferrer" className="block hover:opacity-95 transition-opacity">
                          <img src={att.url} alt={att.filename} className="max-h-80 max-w-full w-auto object-cover" />
                        </a>
                        <button 
                          onClick={(e) => handleDownload(e, att)}
                          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/att:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer z-10"
                          title="Download Image"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ) : att.kind === 'video' ? (
                      <div className="relative">
                        <video src={att.url} className="w-full max-w-md bg-black" controls controlsList="nodownload" />
                        <button 
                          onClick={(e) => handleDownload(e, att)}
                          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/att:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer z-10"
                          title="Download Video"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ) : att.kind === 'audio' ? (
                      <AudioPlayer src={att.url} />
                    ) : (
                      <button 
                        onClick={(e) => handleDownload(e, att)} 
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${isOwn ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700 shadow-sm hover:shadow'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOwn ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                          <FileDown className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate">{att.filename}</p>
                          <p className="text-[10px] opacity-70 uppercase font-bold tracking-tighter mt-0.5">Click to Download</p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                          <Download size={14} className={isOwn ? "text-white" : "text-indigo-600"} />
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {message.type === 'poll' ? (
              <div className="py-1">
                <PollView poll={(message.poll && message.poll.options) ? { options: message.poll.options.map(o => ({ text: o.text, count: (o.votes || []).length })) } : null} />
              </div>
            ) : editing ? (
              <div className="min-w-[200px] space-y-3 p-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditing(false); setEditText(message.content); }} className="text-[10px] font-black uppercase text-white/70 hover:text-white px-2 py-1">Cancel</button>
                  <button onClick={() => { onEdit?.(editText); setEditing(false); }} className="text-[10px] font-black uppercase bg-white text-indigo-600 px-4 py-1.5 rounded-lg shadow-lg">Save</button>
                </div>
              </div>
            ) : (!!message.content && (
              <div className={`text-[15px] font-medium leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                {message.content}
              </div>
            ))}
          </div>
          )}

          {/* Quick Info & Status */}
          <div className={`mt-2 flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start opacity-70'}`}>
            <span className={`text-[10px] font-bold tracking-tight ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>{time}</span>
            {!!message.editedAt && !message.isDeleted && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-white/10 rounded-md">Edited</span>}
            {isOwn && <StatusIcon />}
          </div>
        </div>
      </div>

        {/* Action Bar - Hover Visible */}
        <div className={`flex items-center gap-3 mt-1.5 transition-all duration-300 opacity-0 transform translate-y-[-10px] group-hover/msg:opacity-100 group-hover/msg:translate-y-0 ${isOwn ? 'justify-end pr-2' : 'justify-start pl-11'}`}>
          <button onClick={onReply} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-90" title="Reply">
            <Reply size={14} className="transform -scale-x-100" />
          </button>
          <button onClick={() => onReact?.('👍')} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-90" title="React">
            <Smile size={14} />
          </button>
          {canPin && (
            <button onClick={onPin} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-90" title="Pin">
              <Pin size={14} />
            </button>
          )}
          {(isOwn || canModerate) && !message.isDeleted && (
            <div className="flex gap-2">
              {message.type !== 'poll' && (
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-90">
                  <Edit3 size={14} />
                </button>
              )}
              <button onClick={() => { if(window.confirm('Delete message?')) onDelete?.(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all active:scale-90">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className={`${isOwn ? '' : 'ml-11'}`}>
          <ReactionsBar />
        </div>
      </div>
    </div>
  );
}
