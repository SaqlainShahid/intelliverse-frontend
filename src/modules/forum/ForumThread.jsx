import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, CheckCircle2, Trash2, Send, Forward, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  getForumPost, upvoteForumPost, postAnswer,
  upvoteAnswer, acceptAnswer, deleteAnswer,
  deleteForumPost, forwardToFaculty,
} from '../../services/forumService';

const CATEGORY_COLORS = {
  Academic: 'bg-indigo-100 text-indigo-700',
  'Campus Life': 'bg-emerald-100 text-emerald-700',
  Finance: 'bg-amber-100 text-amber-700',
  Career: 'bg-violet-100 text-violet-700',
  Events: 'bg-sky-100 text-sky-700',
  Housing: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600',
};

function Avatar({ user, size = 9 }) {
  const initials = `${user?.profile?.firstName?.[0] || ''}${user?.profile?.lastName?.[0] || ''}`.toUpperCase() || '?';
  return (
    <div className={`w-${size} h-${size} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden`}>
      {user?.profile?.avatar
        ? <img src={user.profile.avatar} alt="" className="w-full h-full object-cover" />
        : initials
      }
    </div>
  );
}

function UserLine({ user, date }) {
  const name = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Unknown';
  const role = user?.role;
  const dept = user?.profile?.department;
  const designation = user?.profile?.designation;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-slate-800">{name}</span>
      {designation && <span className="text-xs text-slate-500">{designation}</span>}
      {dept && <span className="text-xs text-slate-400">· {dept}</span>}
      {role && role !== 'student' && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 uppercase">{role}</span>
      )}
      <span className="text-xs text-slate-400">· {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
  );
}

export default function ForumThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fromCrossDept = location.state?.from === 'cross-dept';
  const backTo = fromCrossDept
    ? () => navigate('/cross-dept', { state: { tab: 'forum' } })
    : () => navigate('/forum');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    try {
      const res = await getForumPost(id);
      if (res.success) setPost(res.data);
    } catch {
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpvotePost = async () => {
    try {
      const res = await upvoteForumPost(id);
      if (res.success) setPost(p => ({ ...p, upvoteCount: res.data.upvoteCount, isUpvoted: res.data.isUpvoted }));
    } catch { toast.error('Failed to upvote'); }
  };

  const handleUpvoteAnswer = async (answerId) => {
    try {
      const res = await upvoteAnswer(id, answerId);
      if (res.success) {
        setPost(p => ({
          ...p,
          answers: p.answers.map(a => a._id === answerId ? { ...a, upvoteCount: res.data.upvoteCount, isUpvoted: res.data.isUpvoted } : a),
        }));
      }
    } catch { toast.error('Failed to upvote'); }
  };

  const handleAccept = async (answerId) => {
    setActionId(answerId);
    try {
      const res = await acceptAnswer(id, answerId);
      if (res.success) load();
    } catch { toast.error('Only the question author can accept an answer'); }
    finally { setActionId(null); }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Delete this answer?')) return;
    setActionId(answerId);
    try {
      await deleteAnswer(id, answerId);
      setPost(p => ({ ...p, answers: p.answers.filter(a => a._id !== answerId) }));
      toast.success('Answer deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setActionId(null); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this question and all its answers?')) return;
    try {
      await deleteForumPost(id);
      toast.success('Question deleted');
      backTo();
    } catch { toast.error('Failed to delete'); }
  };

  const handleForward = async () => {
    if (!window.confirm('Forward this question to faculty staff for an official answer?')) return;
    try {
      await forwardToFaculty(id);
      toast.success('Forwarded to faculty');
      setPost(p => ({ ...p, forwardedToFaculty: true, status: 'forwarded' }));
    } catch { toast.error('Failed to forward'); }
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await postAnswer(id, answerBody.trim());
      if (res.success) {
        setAnswerBody('');
        toast.success('Answer posted');
        load();
      }
    } catch { toast.error('Failed to post answer'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );
  if (!post) return <div className="p-8 text-center text-slate-400">Question not found.</div>;

  const isAuthor = post.author?._id === user?._id || post.author?._id?.toString() === user?._id?.toString();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hod';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button onClick={backTo} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to {fromCrossDept ? 'Cross-Dept Hub' : 'Forum'}
      </button>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Category + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Other}`}>
              {post.category}
            </span>
            {post.forwardedToFaculty && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <Forward className="w-3 h-3" /> Forwarded to Faculty
              </span>
            )}
            {post.answers?.some(a => a.isAccepted) && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Answered
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h1>

          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar user={post.author} />
            <UserLine user={post.author} date={post.createdAt} />
          </div>

          {/* Body */}
          <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">{post.body}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
            <button onClick={handleUpvotePost}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                post.isUpvoted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              <ThumbsUp className="w-4 h-4" />
              {post.upvoteCount ?? 0}
            </button>

            <span className="text-xs text-slate-400">{post.views} views</span>

            {!post.forwardedToFaculty && (
              <button onClick={handleForward}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-all">
                <Forward className="w-4 h-4" /> Forward to Faculty
              </button>
            )}

            {(isAuthor || isPrivileged) && (
              <button onClick={handleDeletePost}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 transition-all ${post.forwardedToFaculty ? '' : ''}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          {post.answers?.length || 0} Answer{post.answers?.length !== 1 ? 's' : ''}
        </h2>

        {post.answers?.map(answer => {
          const isAnswerAuthor = answer.author?._id === user?._id || answer.author?._id?.toString() === user?._id?.toString();
          return (
            <div key={answer._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
              answer.isAccepted ? 'border-green-300 ring-1 ring-green-200' : 'border-slate-100'
            }`}>
              {answer.isAccepted && (
                <div className="bg-green-50 border-b border-green-100 px-4 py-1.5 flex items-center gap-1.5 text-green-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Best Answer
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar user={answer.author} size={8} />
                  <UserLine user={answer.author} date={answer.createdAt} />
                </div>
                <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap pl-11">{answer.body}</p>
                <div className="flex items-center gap-3 pl-11 pt-1">
                  <button onClick={() => handleUpvoteAnswer(answer._id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-semibold border transition-all ${
                      answer.isUpvoted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                    }`}>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {answer.upvoteCount ?? answer.upvotes?.length ?? 0}
                  </button>

                  {isAuthor && (
                    <button onClick={() => handleAccept(answer._id)} disabled={actionId === answer._id}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-semibold border transition-all ${
                        answer.isAccepted
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600'
                      }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {answer.isAccepted ? 'Accepted' : 'Accept'}
                    </button>
                  )}

                  {(isAnswerAuthor || isPrivileged) && (
                    <button onClick={() => handleDeleteAnswer(answer._id)} disabled={actionId === answer._id}
                      className="ml-auto flex items-center gap-1 px-2 py-1 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-200">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {post.answers?.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
            No answers yet. Be the first to help!
          </div>
        )}
      </div>

      {/* Answer input — students only */}
      {user?.role === 'student' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Your Answer</h3>
          <form onSubmit={handlePostAnswer} className="space-y-3">
            <textarea
              value={answerBody}
              onChange={e => setAnswerBody(e.target.value)}
              placeholder="Share what you know…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={submitting || !answerBody.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
                {submitting ? 'Posting…' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-center text-sm text-slate-400">
          This forum is for students only. You are viewing in read-only mode.
        </div>
      )}
    </div>
  );
}
