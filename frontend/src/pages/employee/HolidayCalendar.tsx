import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  CalendarDays,
  Sparkles,
  Flag,
  PartyPopper,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Building,
  Info
} from 'lucide-react';
import api from '../../utils/api';

interface Holiday {
  id: number;
  name: string;
  holidayDate: string; // 'YYYY-MM-DD'
  formattedDate?: string;
  dayOfWeek?: string;
  holidayType: string;
  description?: string;
  isOptional: boolean;
}

const fallbackHolidays2026: Holiday[] = [
  { id: 1, name: 'New Year Day', holidayDate: '2026-01-01', formattedDate: '01 Jan 2026', dayOfWeek: 'Thursday', holidayType: 'Public Holiday', isOptional: false },
  { id: 2, name: 'Pongal / Makar Sankranti', holidayDate: '2026-01-14', formattedDate: '14 Jan 2026', dayOfWeek: 'Wednesday', holidayType: 'Festival Holiday', isOptional: false },
  { id: 3, name: 'Republic Day', holidayDate: '2026-01-26', formattedDate: '26 Jan 2026', dayOfWeek: 'Monday', holidayType: 'National Holiday', isOptional: false },
  { id: 4, name: 'May Day / Labour Day', holidayDate: '2026-05-01', formattedDate: '01 May 2026', dayOfWeek: 'Friday', holidayType: 'Public Holiday', isOptional: false },
  { id: 5, name: 'Independence Day', holidayDate: '2026-08-15', formattedDate: '15 Aug 2026', dayOfWeek: 'Saturday', holidayType: 'National Holiday', isOptional: false },
  { id: 6, name: 'Vinayakar Chathurthi', holidayDate: '2026-09-01', formattedDate: '01 Sep 2026', dayOfWeek: 'Tuesday', holidayType: 'Festival Holiday', isOptional: false },
  { id: 7, name: 'Krishna Jayanthi', holidayDate: '2026-09-04', formattedDate: '04 Sep 2026', dayOfWeek: 'Friday', holidayType: 'Festival Holiday', isOptional: false },
  { id: 8, name: 'Gandhi Jayanthi', holidayDate: '2026-10-01', formattedDate: '01 Oct 2026', dayOfWeek: 'Thursday', holidayType: 'National Holiday', isOptional: false },
  { id: 9, name: 'Ayutha Pooja', holidayDate: '2026-10-20', formattedDate: '20 Oct 2026', dayOfWeek: 'Tuesday', holidayType: 'Festival Holiday', isOptional: false },
  { id: 10, name: 'Deepavali', holidayDate: '2026-11-08', formattedDate: '08 Nov 2026', dayOfWeek: 'Sunday', holidayType: 'Festival Holiday', isOptional: false },
  { id: 11, name: 'Christmas Day', holidayDate: '2026-12-25', formattedDate: '25 Dec 2026', dayOfWeek: 'Friday', holidayType: 'Public Holiday', isOptional: false },
];

const HolidayCalendar: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());

  const fetchHolidays = async (year: number) => {
    try {
      setLoading(true);
      const res = await api.get<Holiday[]>('/holidays', { params: { year } });
      if (res.data && res.data.length > 0) {
        setHolidays(res.data);
      } else {
        setHolidays(year === 2026 ? fallbackHolidays2026 : []);
      }
    } catch {
      // Fallback
      setHolidays(year === 2026 ? fallbackHolidays2026 : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

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

  const stats = useMemo(() => {
    const total = holidays.length;
    const national = holidays.filter((h) => h.holidayType.toLowerCase().includes('national')).length;
    const festival = holidays.filter((h) => h.holidayType.toLowerCase().includes('festival')).length;
    const publicCount = holidays.filter((h) => h.holidayType.toLowerCase().includes('public')).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = holidays
      .filter((h) => h.holidayDate >= todayStr)
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
    const nextHoliday = upcoming.length > 0 ? upcoming[0] : null;

    return { total, national, festival, publicCount, nextHoliday, upcomingCount: upcoming.length };
  }, [holidays]);

  const getTypeStyle = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('national')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (lower.includes('festival')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (lower.includes('company')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (lower.includes('restricted') || lower.includes('optional')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const monthData = useMemo(() => {
    const firstDay = new Date(selectedYear, calendarMonth, 1);
    const lastDay = new Date(selectedYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIndex = firstDay.getDay();

    const monthName = firstDay.toLocaleString('default', { month: 'long' });

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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-teal-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Official Company Calendar
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Company Holiday Calendar {selectedYear}
            </h1>
            <p className="text-sm text-teal-100 max-w-2xl font-normal">
              View official company holidays, festival days, and national observances configured by management.
            </p>
          </div>

          {/* Year selector */}
          <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1 shrink-0">
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedYear === y
                    ? 'bg-white text-teal-950 shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Holidays</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">days in {selectedYear}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">National & Public</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {stats.national + stats.publicCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">mandated leaves</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Festival Celebrations</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PartyPopper className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.festival}</span>
            <span className="text-xs font-semibold text-slate-400">festivals</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 rounded-2xl border border-teal-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Upcoming Holiday</span>
            <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            {stats.nextHoliday ? (
              <>
                <p className="text-sm font-bold text-slate-800 truncate" title={stats.nextHoliday.name}>
                  {stats.nextHoliday.name}
                </p>
                <p className="text-xs font-semibold text-teal-700 mt-0.5">
                  {stats.nextHoliday.formattedDate} ({stats.nextHoliday.dayOfWeek})
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500 font-medium mt-1">No upcoming holidays scheduled</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search holiday name or month..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Public Holiday">Public Holidays</option>
              <option value="National Holiday">National Holidays</option>
              <option value="Festival Holiday">Festival Holidays</option>
              <option value="Company Holiday">Company Holidays</option>
              <option value="Restricted Holiday">Restricted / Optional</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading holiday calendar...</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Day</th>
                  <th className="py-4 px-6">Holiday Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Description / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No holidays found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800 font-mono">
                        {h.formattedDate || h.holidayDate}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {h.dayOfWeek || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 text-sm">{h.name}</span>
                        {h.isOptional && (
                          <span className="inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${getTypeStyle(
                            h.holidayType
                          )}`}
                        >
                          {h.holidayType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {h.description || <span className="text-slate-300 italic">-</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MONTH / CALENDAR VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
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

            {Array.from({ length: monthData.startDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/40 rounded-2xl border border-dashed border-slate-100" />
            ))}

            {Array.from({ length: monthData.daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const hList = monthData.holidayMap.get(dayNum) || [];
              const isHoliday = hList.length > 0;

              return (
                <div
                  key={dayNum}
                  className={`min-h-[110px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isHoliday
                      ? 'bg-teal-50/40 border-teal-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono h-6 w-6 rounded-lg flex items-center justify-center ${
                        isHoliday
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-700 bg-slate-100'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isHoliday && (
                      <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto">
                    {hList.map((h) => (
                      <div
                        key={h.id}
                        className="p-1.5 bg-white rounded-xl border border-teal-100 shadow-xs text-left"
                      >
                        <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">
                          {h.name}
                        </p>
                        <span className="text-[9px] font-semibold text-teal-600 block mt-0.5">
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
    </div>
  );
};

export default HolidayCalendar;
