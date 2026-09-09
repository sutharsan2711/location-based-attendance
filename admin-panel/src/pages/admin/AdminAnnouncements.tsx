import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Pin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  Bell,
  Clock,
  Users,
  Building,
  Sparkles,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { announcementService, Announcement, AnnouncementCreatePayload } from '../../services/announcementService';
import { formatDate } from '../../utils/dateUtils';
import { employeeService } from '../../services/employeeService';

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [departments, setDepartments] = useState<string[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<AnnouncementCreatePayload>({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targetAudience: 'ALL',
    targetDepartment: '',
    isPinned: false,
    isActive: true,
    expiresAt: '',
  });

  // Fetch Announcements & Employees (to get departments)
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, emps] = await Promise.all([
        announcementService.getAll(),
        employeeService.getAll().catch(() => []),
      ]);
      setAnnouncements(data);

      const depts = new Set<string>();
      emps.forEach((e) => {
        if (e.department) depts.add(e.department);
      });
      setDepartments(Array.from(depts));
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.targetDepartment && item.targetDepartment.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [announcements, searchQuery, priorityFilter]);

  // Handle Form Open
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      priority: 'MEDIUM',
      targetAudience: 'ALL',
      targetDepartment: '',
      isPinned: false,
      isActive: true,
      expiresAt: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setModalMode('edit');
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      targetAudience: ann.targetAudience,
      targetDepartment: ann.targetDepartment || '',
      isPinned: ann.isPinned,
      isActive: ann.isActive,
      expiresAt: ann.expiresAt ? new Date(ann.expiresAt).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: AnnouncementCreatePayload = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      if (modalMode === 'create') {
        await announcementService.create(payload);
      } else if (editingId) {
        await announcementService.update(editingId, payload);
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to save announcement:', err);
      alert(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This cannot be undone.')) {
      return;
    }
    try {
      await announcementService.delete(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  // Quick Toggle Pin
  const handleTogglePin = async (ann: Announcement) => {
    try {
      await announcementService.update(ann.id, { isPinned: !ann.isPinned });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, isPinned: !a.isPinned } : a))
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Priority Badges Helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = announcements.length;
    const active = announcements.filter((a) => a.isActive).length;
    const pinned = announcements.filter((a) => a.isPinned).length;
    const urgent = announcements.filter((a) => a.priority === 'URGENT' || a.priority === 'HIGH').length;
    return { total, active, pinned, urgent };
  }, [announcements]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Megaphone className="h-3.5 w-3.5 text-indigo-400" />
              Company Broadcast & Alert System
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Announcements Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-normal">
              Broadcast company news, policy updates, urgent notices, and holiday announcements across employee dashboards and notifications.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            + New Announcement
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Broadcasts</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">recorded</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Broadcasts</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900">{stats.active}</span>
            <span className="text-xs font-semibold text-emerald-600">visible to users</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pinned to Top</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Pin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900">{stats.pinned}</span>
            <span className="text-xs font-semibold text-amber-600">highlighted</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Urgent Alerts</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-900">{stats.urgent}</span>
            <span className="text-xs font-semibold text-rose-600">high priority</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title or content..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">🔵 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🟠 High</option>
              <option value="URGENT">🔴 Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Announcements List ── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading company announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800">No Announcements Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "+ New Announcement" above to broadcast an update to company employees.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-3xl border transition-all p-6 shadow-sm hover:shadow-md relative overflow-hidden ${
                ann.isPinned
                  ? 'border-indigo-300 bg-gradient-to-r from-indigo-50/30 to-white'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {ann.isPinned && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Pin className="h-3 w-3 fill-current" /> Pinned
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getPriorityBadge(
                        ann.priority
                      )}`}
                    >
                      {ann.priority} Priority
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {ann.targetAudience === 'ALL'
                        ? 'Everyone'
                        : ann.targetDepartment
                        ? `Dept: ${ann.targetDepartment}`
                        : 'Specific Roles'}
                    </span>
                    {!ann.isActive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        Draft / Inactive
                      </span>
                    )}
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium max-w-4xl">
                    {ann.content}
                  </p>

                  {/* Metadata Footer */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Published: {formatDate(ann.createdAt)}
                    </span>
                    {ann.author && (
                      <span>By: <strong className="text-slate-700">{ann.author.name}</strong></span>
                    )}
                    {ann.expiresAt && (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Expires: {formatDate(ann.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 md:self-start">
                  <button
                    onClick={() => handleTogglePin(ann)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      ann.isPinned
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                    title={ann.isPinned ? 'Unpin Announcement' : 'Pin to Top'}
                  >
                    <Pin className={`h-4 w-4 ${ann.isPinned ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                    title="Edit Announcement"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Delete Announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT ANNOUNCEMENT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 animate-scale-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalMode === 'create' ? 'Broadcast New Announcement' : 'Edit Announcement'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure broadcast content and targeted audience</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Office Closure Notice - Festival Holidays"
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Priority & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">🔵 Low (General Info)</option>
                    <option value="MEDIUM">🟡 Medium (Normal)</option>
                    <option value="HIGH">🟠 High (Important Notice)</option>
                    <option value="URGENT">🔴 Urgent (Immediate Attention)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Employees</option>
                    <option value="DEPARTMENT">Specific Department</option>
                  </select>
                </div>
              </div>

              {/* Department Selector if targetAudience === 'DEPARTMENT' */}
              {formData.targetAudience === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={formData.targetDepartment || ''}
                    onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Announcement Content *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Type the announcement details, policy notes, or instructions here..."
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt || ''}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">📌 Pin to Top</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">🟢 Active / Published</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Publish Announcement' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
