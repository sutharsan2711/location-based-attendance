import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Pin,
  Calendar,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  Bell,
  X,
} from 'lucide-react';
import { announcementService, Announcement } from '../../services/announcementService';
import { formatDate } from '../../utils/dateUtils';

const EmployeeAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await announcementService.getActive();
        setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [announcements, searchQuery, priorityFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Megaphone className="h-3.5 w-3.5 text-indigo-400" />
              Company Communications
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Announcements & Notices
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-normal">
              Stay updated with company-wide news, holiday circulars, office policy updates, and team broadcasts.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices and circulars..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-400">Filter:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Announcements</option>
            <option value="URGENT">🔴 Urgent Notices</option>
            <option value="HIGH">🟠 High Priority</option>
            <option value="MEDIUM">🟡 Normal Updates</option>
            <option value="LOW">🔵 General Info</option>
          </select>
        </div>
      </div>

      {/* ── Announcements Grid / List ── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading company announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800">No Announcements At This Time</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You're all caught up! New company notices and broadcast updates will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => setSelectedAnnouncement(ann)}
              className={`bg-white rounded-3xl border transition-all p-6 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                ann.isPinned
                  ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/40 to-white'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {ann.isPinned && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Pin className="h-3 w-3 fill-current" /> Pinned
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getPriorityBadge(
                      ann.priority
                    )}`}
                  >
                    {ann.priority}
                  </span>
                  {ann.targetDepartment && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      Dept: {ann.targetDepartment}
                    </span>
                  )}
                </div>

                {/* Title & Preview */}
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">{ann.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
                  {ann.content}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {formatDate(ann.createdAt)}
                </span>
                <span className="text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                  Read full <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FULL DETAILS MODAL ── */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 animate-scale-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Announcement Details</h3>
                  <p className="text-xs text-slate-400">Published on {formatDate(selectedAnnouncement.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAnnouncement.isPinned && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase">
                    📌 Pinned
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${getPriorityBadge(
                    selectedAnnouncement.priority
                  )}`}
                >
                  {selectedAnnouncement.priority} Priority
                </span>
              </div>

              <h2 className="text-lg font-black text-slate-900 leading-snug">
                {selectedAnnouncement.title}
              </h2>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed font-medium whitespace-pre-line text-xs">
                {selectedAnnouncement.content}
              </div>

              {selectedAnnouncement.expiresAt && (
                <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Valid until: {formatDate(selectedAnnouncement.expiresAt)}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-3 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAnnouncements;
