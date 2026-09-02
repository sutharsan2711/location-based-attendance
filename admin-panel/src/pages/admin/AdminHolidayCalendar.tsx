import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CalendarDays,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building,
  Flag,
  PartyPopper,
  Info,
  CalendarRange
} from 'lucide-react';
import { holidayService, Holiday, HolidayPayload } from '../../services/holidayService';

const HOLIDAY_TYPES = [
  { label: 'Public Holiday', value: 'Public Holiday', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'National Holiday', value: 'National Holiday', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Festival Holiday', value: 'Festival Holiday', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Company Holiday', value: 'Company Holiday', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Restricted / Optional', value: 'Restricted Holiday', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const AdminHolidayCalendar: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formType, setFormType] = useState<string>('Public Holiday');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIsOptional, setFormIsOptional] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Month navigation for Calendar View
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());

  const fetchHolidays = async (year: number) => {
    try {
      setLoading(true);
      const data = await holidayService.getHolidays(year);
      setHolidays(data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormName('');
    setFormDate(`${selectedYear}-01-01`);
    setFormType('Public Holiday');
    setFormDescription('');
    setFormIsOptional(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormName(holiday.name);
    setFormDate(holiday.holidayDate);
    setFormType(holiday.holidayType);
    setFormDescription(holiday.description || '');
    setFormIsOptional(holiday.isOptional || false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter holiday title');
      return;
    }
    if (!formDate) {
      setFormError('Please select a valid date');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const payload: HolidayPayload = {
        name: formName.trim(),
        holidayDate: formDate,
        holidayType: formType,
        description: formDescription.trim(),
        isOptional: formIsOptional,
      };

      if (editingHoliday) {
        await holidayService.updateHoliday(editingHoliday.id, payload);
        showNotification('success', `Holiday "${formName}" updated successfully!`);
      } else {
        await holidayService.createHoliday(payload);
        showNotification('success', `Holiday "${formName}" added successfully!`);
      }

      setIsModalOpen(false);
      fetchHolidays(selectedYear);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deleteConfirmId) return;
    try {
      await holidayService.deleteHoliday(deleteConfirmId);
      showNotification('success', 'Holiday deleted successfully');
      setDeleteConfirmId(null);
      fetchHolidays(selectedYear);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.dayOfWeek && h.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.formattedDate && h.formattedDate.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === 'ALL' ||
        h.holidayType.toLowerCase() === selectedType.toLowerCase() ||
        (selectedType === 'OPTIONAL' && h.isOptional);

      return matchesSearch && matchesType;
    });
  }, [holidays, searchQuery, selectedType]);

  // Statistics
  const stats = useMemo(() => {
    const total = holidays.length;
    const national = holidays.filter((h) => h.holidayType.toLowerCase().includes('national')).length;
    const festival = holidays.filter((h) => h.holidayType.toLowerCase().includes('festival')).length;
    const publicHolidays = holidays.filter((h) => h.holidayType.toLowerCase().includes('public')).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = holidays
      .filter((h) => h.holidayDate >= todayStr)
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
    const nextHoliday = upcoming.length > 0 ? upcoming[0] : null;

    return { total, national, festival, publicHolidays, nextHoliday, upcomingCount: upcoming.length };
  }, [holidays]);

  const getTypeStyle = (type: string) => {
    const match = HOLIDAY_TYPES.find((t) => t.value.toLowerCase() === type.toLowerCase());
    return match ? match.color : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Calendar matrix generator for month view
  const monthData = useMemo(() => {
    const firstDay = new Date(selectedYear, calendarMonth, 1);
    const lastDay = new Date(selectedYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIndex = firstDay.getDay(); // 0 = Sun, 1 = Mon ...

    const monthName = firstDay.toLocaleString('default', { month: 'long' });

    // Map day to holidays in this month
    const holidayMap = new Map<number, Holiday[]>();
    holidays.forEach((h) => {
      const [y, m, d] = h.holidayDate.split('-').map(Number);
      if (y === selectedYear && m === calendarMonth + 1) {
        const list = holidayMap.get(d) || [];
        list.push(h);
        holidayMap.set(d, list);
      }
    });

    return { monthName, daysInMonth, startDayIndex, holidayMap };
  }, [selectedYear, calendarMonth, holidays]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/95 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Company Calendar & Schedule Control
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Holiday Calendar Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-normal">
              Create, configure, and maintain company holidays and festival observances. Schedules are synchronized across employee dashboards and attendance logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Year Selector */}
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1">
              {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    selectedYear === y
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Add Holiday Button */}
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Holiday
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Holidays</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">in {selectedYear}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">National & Public</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {stats.national + stats.publicHolidays}
            </span>
            <span className="text-xs font-semibold text-slate-400">mandated days</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Festivals & Celebrations</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PartyPopper className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.festival}</span>
            <span className="text-xs font-semibold text-slate-400">cultural events</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border border-indigo-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Next Upcoming</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            {stats.nextHoliday ? (
              <>
                <p className="text-sm font-bold text-slate-800 truncate" title={stats.nextHoliday.name}>
                  {stats.nextHoliday.name}
                </p>
                <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                  {stats.nextHoliday.formattedDate} ({stats.nextHoliday.dayOfWeek})
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500 font-medium mt-1">No upcoming holidays scheduled</p>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar (Search, Type Filters, View Mode) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search holiday name, month, day..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter & View switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Categories</option>
              <option value="Public Holiday">Public Holidays</option>
              <option value="National Holiday">National Holidays</option>
              <option value="Festival Holiday">Festival Holidays</option>
              <option value="Company Holiday">Company Holidays</option>
              <option value="Restricted Holiday">Restricted / Optional</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading holiday schedule for {selectedYear}...</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Holiday Date</th>
                  <th className="py-4 px-6">Day</th>
                  <th className="py-4 px-6">Holiday Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Description / Notes</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No holidays found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery || selectedType !== 'ALL'
                          ? 'Try clearing the search or category filters'
                          : `No holidays configured for ${selectedYear}`}
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
                      >
                        + Add Holiday for {selectedYear}
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 flex flex-col items-center justify-center font-mono font-black text-slate-800 shrink-0 text-[11px] leading-tight">
                            <span>{holiday.holidayDate ? holiday.holidayDate.split('-')[2] : '--'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block font-mono">
                              {holiday.formattedDate || holiday.holidayDate}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {holiday.holidayDate}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-600">{holiday.dayOfWeek || '-'}</span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{holiday.name}</div>
                        {holiday.isOptional && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                            Optional / Restricted
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${getTypeStyle(
                            holiday.holidayType
                          )}`}
                        >
                          {holiday.holidayType}
                        </span>
                      </td>

                      <td className="py-4 px-6 max-w-xs truncate text-slate-500 font-medium">
                        {holiday.description || <span className="text-slate-300 italic">No notes</span>}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(holiday)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            title="Edit Holiday"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(holiday.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Delete Holiday"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CALENDAR / MONTH VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          {/* Month Header Controller */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {monthData.monthName} {selectedYear}
                </h2>
                <p className="text-xs text-slate-400">Monthly schedule overview</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarMonth((prev) => (prev === 0 ? 11 : prev - 1))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {new Date(selectedYear, idx, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCalendarMonth((prev) => (prev === 11 ? 0 : prev + 1))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div
                key={d}
                className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                  i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}

            {/* Empty prefix boxes */}
            {Array.from({ length: monthData.startDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/40 rounded-2xl border border-dashed border-slate-100" />
            ))}

            {/* Day Boxes */}
            {Array.from({ length: monthData.daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const hList = monthData.holidayMap.get(dayNum) || [];
              const isHoliday = hList.length > 0;

              return (
                <div
                  key={dayNum}
                  className={`min-h-[110px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isHoliday
                      ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono h-6 w-6 rounded-lg flex items-center justify-center ${
                        isHoliday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 bg-slate-100'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isHoliday && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto">
                    {hList.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleOpenEditModal(h)}
                        className="p-1.5 bg-white rounded-xl border border-indigo-100 shadow-xs cursor-pointer hover:border-indigo-300 transition-all text-left"
                      >
                        <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">
                          {h.name}
                        </p>
                        <span className="text-[9px] font-semibold text-indigo-600 block mt-0.5">
                          {h.holidayType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingHoliday ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingHoliday ? 'Edit Company Holiday' : 'Add New Holiday'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingHoliday
                      ? 'Update schedule parameters for this date'
                      : `Define a new official holiday for ${selectedYear}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveHoliday} className="mt-5 space-y-4">
              {/* Holiday Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Holiday Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Pongal, Independence Day, Deepavali..."
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Holiday Date *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Holiday Type / Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HOLIDAY_TYPES.map((t) => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setFormType(t.value)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border text-left transition-all ${
                        formType === t.value
                          ? `${t.color} ring-2 ring-indigo-500/30 font-extrabold shadow-xs`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional context or notes for staff..."
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Optional Checkbox */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="formIsOptional"
                  checked={formIsOptional}
                  onChange={(e) => setFormIsOptional(e.target.checked)}
                  className="h-4 w-4 rounded-lg text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="formIsOptional" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Restricted / Optional Holiday
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  {editingHoliday ? 'Save Changes' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center animate-scale-up">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Holiday?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove this holiday from the company calendar? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHoliday}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHolidayCalendar;
