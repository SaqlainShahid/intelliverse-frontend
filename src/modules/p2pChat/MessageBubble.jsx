import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, FileDown, Play, Pause, MoreVertical, Reply, Pin, Smile, Edit3, Trash2 } from 'lucide-react';

export default function MessageBubble({ message, sender, isOwn, onReply, onReact, onPin, canPin, canModerate, onEdit, onDelete, onVote }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const status = message.status;
  const StatusIcon = () => {
    if (!isOwn) return null;
    if (status === 'seen') return <CheckCheck className="h-3.5 w-3.5 text-cyan-300" />;
    if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-white/70" />;
    return <Check className="h-3.5 w-3.5 text-white/50" />;
  };
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');

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
    <div id={`message-${message._id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-2 gap-3`}>
      {!isOwn && (
        <div className="flex-shrink-0 self-end mb-1">
          {sender?.profile?.avatar ? (
            <img src={sender.profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-200 cursor-pointer" onClick={() => sender?._id && (window.location.href = `/profile/${sender._id}`)} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm border border-gray-200 cursor-pointer" onClick={() => sender?._id && (window.location.href = `/profile/${sender._id}`)}>
              {(sender?.profile?.firstName || 'U').charAt(0)}
            </div>
          )}
        </div>
      )}
      <div className={`group max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-all ${isOwn ? 'bg-gradient-to-r from-iv-indigo to-purple-600 text-white rounded-tr-sm' : 'bg-white/80 backdrop-blur-sm border border-iv-border text-iv-text rounded-tl-sm'}`}>
        <ReplyPreview />
        {message.isDeleted ? (
          <div className="text-sm opacity-80 italic">Message deleted</div>
        ) : (
        <>
        {!!(message.attachments && message.attachments.length) && (
          <div className="space-y-2">
            {message.attachments.map((att) => (
              <div key={att.publicId} className="rounded-lg overflow-hidden">
                {att.kind === 'image' ? (
                  <a href={att.url} target="_blank" rel="noreferrer">
                    <img src={att.url} alt={att.filename} className="max-h-64 max-w-full h-auto rounded-md" />
                  </a>
                ) : att.kind === 'video' ? (
                  <video src={att.url} className="rounded-md max-w-full" controls />
                ) : att.kind === 'audio' ? (
                  <AudioPlayer src={att.url} />
                ) : (
                  <a href={att.url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 text-sm ${isOwn ? 'text-white' : 'text-indigo-600'}`}>
                    <FileDown className="h-4 w-4" />
                    <span className="truncate max-w-[12rem] break-all">{att.filename}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {message.type === 'poll' ? (
          <PollView poll={(message.poll && message.poll.options) ? { options: message.poll.options.map(o => ({ text: o.text, count: (o.votes || []).length })) } : null} />
        ) : editing ? (
          <div className="flex items-center gap-2">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 bg-white/80 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
            />
            <button
              onClick={() => { onEdit && onEdit(editText); setEditing(false); }}
              className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
            >Save</button>
            <button
              onClick={() => { setEditText(message.content || ''); setEditing(false); }}
              className="text-xs px-2 py-1 rounded border border-gray-300"
            >Cancel</button>
          </div>
        ) : (!!message.content && (
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ))}
        </>
        )}
        <ReactionsBar />
        <div className={`mt-2 flex items-center gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <button onClick={onReply} className={`text-[11px] inline-flex items-center gap-1 transition-colors ${isOwn ? 'text-white/70 hover:text-white' : 'text-iv-muted hover:text-iv-text'}`} title="Reply">
            <Reply className="h-3.5 w-3.5" /> Reply
          </button>
          <button onClick={() => onReact && onReact('👍')} className={`text-[11px] inline-flex items-center gap-1 transition-colors ${isOwn ? 'text-white/70 hover:text-white' : 'text-iv-muted hover:text-iv-text'}`} title="React">
            <Smile className="h-3.5 w-3.5" /> React
          </button>
          {canPin && (
            <button onClick={onPin} className={`text-[11px] inline-flex items-center gap-1 transition-colors ${isOwn ? 'text-white/70 hover:text-white' : 'text-iv-muted hover:text-iv-text'}`} title="Pin/Unpin">
              <Pin className="h-3.5 w-3.5" /> Pin
            </button>
          )}
          {(isOwn || canModerate) && !message.isDeleted && message.type !== 'poll' && (
            <>
              <button type="button" onClick={() => setEditing(true)} className={`text-[11px] inline-flex items-center gap-1 transition-colors ${isOwn ? 'text-white/70 hover:text-white' : 'text-iv-muted hover:text-iv-text'}`} title="Edit">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button type="button" onClick={() => onDelete && onDelete()} className={`text-[11px] inline-flex items-center gap-1 transition-colors ${isOwn ? 'text-white/70 hover:text-white' : 'text-iv-muted hover:text-iv-text'}`} title="Delete">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>
        <div className={`mt-1 flex items-center gap-1 ${isOwn ? 'justify-end text-white/80' : 'justify-end text-iv-muted'}`}>
          <span className="text-[10px] font-medium">{time}</span>
          {!!message.editedAt && !message.isDeleted && <span className="text-[10px] opacity-70">edited</span>}
          <StatusIcon />
        </div>
      </div>
    </div>
  );
}
