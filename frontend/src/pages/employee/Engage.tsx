import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  FileEdit,
  Search,
  ChevronDown,
  ChevronUp,
  Smile,
  MessageSquare,
  ThumbsUp,
  Award,
  Sparkles,
  PartyPopper,
} from 'lucide-react';

const Engage: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.name ? user.name.split(' ')[0] : 'Sutharsan';
  const initial = user?.name ? user.name.charAt(0) : 'S';

  const [filterActivity, setFilterActivity] = useState<'all' | 'posts'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasReacted, setHasReacted] = useState(true);
  const [reactionCount, setReactionCount] = useState(1);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleReact = () => {
    if (hasReacted) {
      setHasReacted(false);
      setReactionCount((prev) => Math.max(0, prev - 1));
    } else {
      setHasReacted(true);
      setReactionCount((prev) => prev + 1);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [...prev, newComment.trim()]);
    setNewComment('');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* ── Top Header Banner: "Hey Sutharsan, Ready to dive in ?" + "Create Posts" ── */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-purple-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            {initial}V
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Hey {displayName},</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Ready to dive in ?</p>
          </div>
        </div>

        {/* Create Posts button card */}
        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="h-16 w-20 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/60 flex flex-col items-center justify-center gap-1 text-purple-700 transition-all shadow-sm"
        >
          <FileEdit className="h-4 w-4" />
          <span className="text-[10px] font-bold">Create Posts</span>
        </button>
      </div>

      {/* ── Main 2-Column Content (Left Filters + Right Feed) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        
        {/* ════════ LEFT FILTERS COLUMN (4 cols) ════════ */}
        <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3">Filters</h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Activities</p>
            
            {/* Activities options */}
            <div className="space-y-1.5">
              <label
                onClick={() => setFilterActivity('all')}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  filterActivity === 'all'
                    ? 'bg-blue-50/90 text-blue-700 font-bold border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="activity"
                  checked={filterActivity === 'all'}
                  onChange={() => setFilterActivity('all')}
                  className="accent-blue-600 h-3.5 w-3.5"
                />
                <span className="text-xs">All Activities</span>
              </label>

              <label
                onClick={() => setFilterActivity('posts')}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  filterActivity === 'posts'
                    ? 'bg-blue-50/90 text-blue-700 font-bold border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="activity"
                  checked={filterActivity === 'posts'}
                  onChange={() => setFilterActivity('posts')}
                  className="accent-blue-600 h-3.5 w-3.5"
                />
                <span className="text-xs">Posts</span>
              </label>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3.5 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Collapsible Category Filters */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between text-slate-700 font-semibold cursor-pointer hover:text-blue-600">
              <span>Groups</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-center justify-between text-slate-700 font-semibold cursor-pointer hover:text-blue-600">
              <span>Location</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-center justify-between text-slate-700 font-semibold cursor-pointer hover:text-blue-600">
              <span>Department</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* ════════ RIGHT FEED COLUMN (8 cols) ════════ */}
        <div className="md:col-span-8 space-y-4">
          
          {/* Feed Header */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-800">All Activities - All Groups</h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 cursor-pointer hover:text-slate-800">
              <span>Sort:</span>
              <span className="text-slate-700 font-bold">Newest first</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>

          {/* Activity Post Card (greytHR Celebration Card from Screenshot 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-slide">
            
            {/* Header: Logo & Group details */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-700 flex flex-col items-center justify-center text-white font-extrabold text-[10px] leading-none shrink-0">
                  <span>EC</span>
                  <span className="text-[6px] tracking-wider uppercase mt-0.5">Learnix</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Group: Events</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400">a day ago</span>
            </div>

            {/* Post Content: Anniversary celebration */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center text-center sm:text-left">
                {/* Illustration avatar */}
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 border-2 border-dashed border-blue-300 flex items-center justify-center relative shrink-0">
                  <Award className="h-12 w-12 text-blue-600" />
                  <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Our congratulations to <span className="font-bold text-slate-800">Sriram R</span> on completing 1 successful year(s).
                  </p>
                  <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
                    <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                      S
                    </div>
                    <span className="text-xs font-bold text-slate-800">Congratulations, Sriram R!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reaction Bar & Comments */}
            <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100">
              {/* Who reacted tag */}
              {reactionCount > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pb-2.5">
                  <span className="h-4 w-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[8px] font-bold">
                    👏
                  </span>
                  <span>{displayName} V {reactionCount > 1 ? `and ${reactionCount - 1} other` : ''} reacted</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-6 pt-1 text-xs border-t border-slate-200/50">
                <button
                  onClick={handleReact}
                  className={`flex items-center gap-1.5 font-semibold transition-colors ${
                    hasReacted ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Reaction</span>
                </button>

                <button
                  onClick={() => setShowCommentBox(!showCommentBox)}
                  className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Comment</span>
                </button>
              </div>

              {/* Comments Section */}
              {showCommentBox && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                  {comments.map((comment, index) => (
                    <div key={index} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-800">{displayName}: </span>
                      {comment}
                    </div>
                  ))}

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      Post
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Engage;
