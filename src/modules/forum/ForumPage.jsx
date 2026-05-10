import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ThumbsUp, MessageSquare, CheckCircle2, Forward, Eye, Loader2, Flame, Clock, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { getForumPosts, upvoteForumPost } from '../../services/forumService';
import AskQuestionModal from './AskQuestionModal';
import { getSocket } from '../../services/socket';

const CATEGORIES = ['All', 'Academic', 'Campus Life', 'Finance', 'Career', 'Events', 'Housing', 'Other'];

const CATEGORY_COLORS = {
  Academic: 'bg-indigo-100 text-indigo-700',
  'Campus Life': 'bg-emerald-100 text-emerald-700',
  Finance: 'bg-amber-100 text-amber-700',
  Career: 'bg-violet-100 text-violet-700',
  Events: 'bg-sky-100 text-sky-700',
  Housing: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600',
};

const SORTS = [
  { v: 'newest', label: 'Newest', Icon: Clock },
  { v: 'active', label: 'Active', Icon: Flame },
  { v: 'upvotes', label: 'Top', Icon: ThumbsUp },
  { v: 'unanswered', label: 'Unanswered', Icon: MessageSquare },
];

function PostCard({ post, onUpvote, onClick }) {
  const [optimisticUpvote, setOptimisticUpvote] = useState(null);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    const next = !post.isUpvoted;
    setOptimisticUpvote({ count: post.upvoteCount + (next ? 1 : -1), isUpvoted: next });
    try {
      await onUpvote(post._id);
    } finally {
      setOptimisticUpvote(null);
    }
  };

  const upvoteCount = optimisticUpvote?.count ?? post.upvoteCount ?? 0;
  const isUpvoted = optimisticUpvote?.isUpvoted ?? post.isUpvoted ?? false;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Left stats column */}
        <div className="flex flex-col items-center gap-3 min-w-[48px]">
          <button
            onClick={handleUpvote}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border transition-all ${
              isUpvoted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{upvoteCount}</span>
          </button>
          <div className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border ${
            post.hasAcceptedAnswer ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-100 text-slate-400'
          }`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{post.answerCount ?? 0}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Other}`}>
              {post.category}
            </span>
            {post.hasAcceptedAnswer && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Answered
              </span>
            )}
            {post.forwardedToFaculty && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <Forward className="w-3 h-3" /> Faculty
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="font-medium text-slate-500">
              {post.author?.profile?.firstName} {post.author?.profile?.lastName}
            </span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForumPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const LIMIT = 15;

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = {
        sort,
        page: reset ? 1 : page,
        limit: LIMIT,
      };
      if (category !== 'All') params.category = category;
      if (search) params.search = search;

      const res = await getForumPosts(params);
      if (res.success) {
        setPosts(prev => reset ? res.data : [...prev, ...res.data]);
        setTotal(res.total);
        if (reset) setPage(1);
      }
    } catch {
      // interceptor in api.js already shows the error toast
    } finally {
      setLoading(false);
    }
  }, [category, sort, search, page]);

  useEffect(() => { load(true); }, [category, sort, search]);

  // Real-time: prepend new posts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = ({ post }) => setPosts(prev =>
      prev.some(p => p._id === post._id) ? prev : [post, ...prev]
    );
    socket.on('forum:post:new', handler);
    return () => socket.off('forum:post:new', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleUpvote = async (postId) => {
    const { upvoteForumPost: upvote } = await import('../../services/forumService');
    const res = await upvote(postId);
    if (res.success) {
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, upvoteCount: res.data.upvoteCount, isUpvoted: res.data.isUpvoted }
        : p
      ));
    }
  };

  const hasMore = posts.length < total;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">University Forum</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ask anything — anyone in the university can answer</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Ask Question
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search questions…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              category === cat
                ? cat === 'All'
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : `${CATEGORY_COLORS[cat]} border-current`
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-1.5 bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
        {SORTS.map(({ v, label, Icon }) => (
          <button
            key={v}
            onClick={() => setSort(v)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sort === v ? 'bg-white shadow-sm text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <p className="text-xs text-slate-400">{total} question{total !== 1 ? 's' : ''}</p>

      {/* Post list */}
      <div className="space-y-3">
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onUpvote={handleUpvote}
            onClick={() => navigate(`/forum/${post._id}`)}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No questions found</p>
            <p className="text-slate-400 text-sm mt-1">Be the first to ask!</p>
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => { setPage(p => p + 1); load(); }}
            className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            Load more
          </button>
        )}
      </div>

      {showModal && (
        <AskQuestionModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
