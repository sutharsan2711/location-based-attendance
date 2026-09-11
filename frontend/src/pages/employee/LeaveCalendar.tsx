import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { attendanceService } from '../../services/attendanceService';
import { LeaveRequest, PermissionRequest } from '../../types/request';
import { Attendance } from '../../types/attendance';
import Loading from '../../components/Loading';
import api from '../../utils/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Home,
  Palmtree,
  PartyPopper,
  XCircle,
  Sparkles,
  MapPin,
  Sun,
  X,
  CalendarDays,
  Filter,
} from 'lucide-react';

interface Holiday {
  id: number;
  name: string;
  holidayDate: string; // 'YYYY-MM-DD'
  formattedDate?: string;
  dayOfWeek?: string;
  holidayType: string;
  description?: string;
  isOptional?: boolean;
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

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type CalendarStatusType =
  | 'PRESENT'
  | 'LATE'
  | 'PERMISSION'
  | 'WFH'
  | 'LEAVE'
  | 'HOLIDAY'
  | 'ABSENT'
  | 'WEEK_OFF'
  | 'UPCOMING';

interface DayData {
  day: number;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isSunday: boolean;
  primaryStatus: CalendarStatusType;
  holiday?: Holiday;
  leave?: LeaveRequest;
  permission?: PermissionRequest;
  attendance?: Attendance;
}

const LeaveCalendar: React.FC = () => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Fetch All Calendar Datasets ──
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const [leavesRes, attRes, permRes, holRes] = await Promise.allSettled([
          requestService.getMyLeaves(),
          attendanceService.getHistory(),
          requestService.getMyPermissions(),
          api.get<Holiday[]>('/holidays', { params: { year } }).then((r) => r.data),
        ]);

        if (leavesRes.status === 'fulfilled') {
          setLeaves(leavesRes.value || []);
        }
        if (attRes.status === 'fulfilled') {
          setAttendanceList(attRes.value || []);
        }
        if (permRes.status === 'fulfilled') {
          setPermissions(permRes.value || []);
        }
        if (holRes.status === 'fulfilled' && holRes.value && holRes.value.length > 0) {
          setHolidays(holRes.value);
        } else {
          setHolidays(year === 2026 ? fallbackHolidays2026 : []);
        }
      } catch (err) {
        console.error('Failed to load calendar data:', err);
        setHolidays(year === 2026 ? fallbackHolidays2026 : []);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [year]);

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ── Map days with all status indicators ──
  const daysDataList: (DayData | null)[] = useMemo(() => {
    const list: (DayData | null)[] = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      list.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayObj = new Date(year, month, d);
      const isSunday = dayObj.getDay() === 0;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;

      // 1. Holiday Match
      const holiday = holidays.find((h) => {
        const hDate = h.holidayDate?.slice(0, 10);
        return hDate === dateStr;
      });

      // 2. Leave Match (approved or pending)
      const leave = leaves.find((l) => {
        const from = l.fromDate?.slice(0, 10);
        const to = l.toDate?.slice(0, 10);
        return dateStr >= from && dateStr <= to;
      });

      // 3. Permission Match
      const permission = permissions.find((p) => {
        const pDate = p.permissionDate?.slice(0, 10);
        return pDate === dateStr;
      });

      // 4. Attendance Match
      const attendance = attendanceList.find((a) => {
        const aDate = a.attendanceDate?.slice(0, 10);
        return aDate === dateStr;
      });

      // Compute Primary Status
      let primaryStatus: CalendarStatusType = 'UPCOMING';

      if (holiday) {
        primaryStatus = 'HOLIDAY';
      } else if (
        attendance?.status === 'WORK_FROM_HOME' ||
        attendance?.isWfhApproved ||
        leave?.leaveType === 'WORK_FROM_HOME'
      ) {
        primaryStatus = 'WFH';
      } else if (leave && leave.status === 'APPROVED') {
        primaryStatus = 'LEAVE';
      } else if (attendance) {
        if (attendance.timingStatus === 'LATE') {
          primaryStatus = 'LATE';
        } else if (attendance.timingStatus === 'PERMISSION') {
          primaryStatus = 'PERMISSION';
        } else if (
          attendance.status === 'LOGGED_IN' ||
          attendance.status === 'COMPLETED' ||
          attendance.timingStatus === 'PRESENT' ||
          Boolean(attendance.loginTime)
        ) {
          primaryStatus = 'PRESENT';
        }
      } else if (permission && permission.status === 'APPROVED') {
        primaryStatus = 'PERMISSION';
      } else if (leave && leave.status === 'PENDING') {
        primaryStatus = 'LEAVE';
      } else if (isSunday) {
        primaryStatus = 'WEEK_OFF';
      } else if (isPast) {
        primaryStatus = 'ABSENT';
      } else if (isToday) {
        primaryStatus = 'UPCOMING';
      }

      list.push({
        day: d,
        dateStr,
        isToday,
        isPast,
        isFuture,
        isSunday,
        primaryStatus,
        holiday,
        leave,
        permission,
        attendance,
      });
    }

    return list;
  }, [firstDayIndex, daysInMonth, year, month, todayStr, holidays, leaves, permissions, attendanceList]);

  // ── Month Metrics Summary ──
  const summary = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let wfhCount = 0;
    let leaveCount = 0;
    let holidayCount = 0;
    let absentCount = 0;
    let weekOffCount = 0;

    daysDataList.forEach((item) => {
      if (!item) return;
      if (item.primaryStatus === 'PRESENT') presentCount++;
      else if (item.primaryStatus === 'LATE') lateCount++;
      else if (item.primaryStatus === 'WFH') wfhCount++;
      else if (item.primaryStatus === 'LEAVE') leaveCount++;
      else if (item.primaryStatus === 'HOLIDAY') holidayCount++;
      else if (item.primaryStatus === 'ABSENT') absentCount++;
      else if (item.primaryStatus === 'WEEK_OFF') weekOffCount++;
    });

    return {
      presentCount,
      lateCount,
      wfhCount,
      leaveCount,
      holidayCount,
      absentCount,
      weekOffCount,
      totalPunched: presentCount + lateCount + wfhCount,
    };
  }, [daysDataList]);

  // Format Time Helper
  const formatPunchTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return <Loading message="Loading calendar..." />;
  }

  return (
    <div className="max-w-7xl mx-auto font-sans select-none flex flex-col space-y-3">
      {/* ── Top Bar: Title, Interactive Filter Pills & Actions (All in One Compact Row) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Navigation */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </h1>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-2 py-0.5 ml-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 block -mt-0.5">
              {summary.totalPunched} Attended • {daysInMonth} Days
            </span>
          </div>
        </div>

        {/* Interactive Metrics Filter Chips (Clicking any pill filters the calendar) */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto py-0.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>

          {/* Present */}
          <button
            onClick={() => setFilterType((prev) => (prev === 'PRESENT' ? 'ALL' : 'PRESENT'))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'PRESENT'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Present: <strong className="font-mono">{summary.presentCount}</strong></span>
          </button>

          {/* Late */}
          <button
            onClick={() => setFilterType((prev) => (prev === 'LATE' ? 'ALL' : 'LATE'))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'LATE'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Late: <strong className="font-mono">{summary.lateCount}</strong></span>
          </button>

          {/* WFH */}
          <button
            onClick={() => setFilterType((prev) => (prev === 'WFH' ? 'ALL' : 'WFH'))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'WFH'
                ? 'bg-purple-600 text-white shadow-xs font-black'
                : 'bg-purple-50 text-purple-800 border border-purple-200/60 hover:bg-purple-100'
            }`}
          >
            <Home className="h-3 w-3" />
            <span>WFH: <strong className="font-mono">{summary.wfhCount}</strong></span>
          </button>

          {/* Leave */}
          <button
            onClick={() => setFilterType((prev) => (prev === 'LEAVE' ? 'ALL' : 'LEAVE'))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'LEAVE'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60 hover:bg-indigo-100'
            }`}
          >
            <Palmtree className="h-3 w-3" />
            <span>Leaves: <strong className="font-mono">{summary.leaveCount}</strong></span>
          </button>

          {/* Holidays */}
          <button
            onClick={() => setFilterType((prev) => (prev === 'HOLIDAY' ? 'ALL' : 'HOLIDAY'))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'HOLIDAY'
                ? 'bg-teal-600 text-white shadow-xs font-black'
                : 'bg-teal-50 text-teal-800 border border-teal-200/60 hover:bg-teal-100'
            }`}
          >
            <PartyPopper className="h-3 w-3" />
            <span>Holidays: <strong className="font-mono">{summary.holidayCount}</strong></span>
          </button>

          {/* Absent */}
          <button
            onClick={() => setFilterType((prev) => (prev === 'ABSENT' ? 'ALL' : 'ABSENT'))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'ABSENT'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            <XCircle className="h-3 w-3" />
            <span>Absent: <strong className="font-mono">{summary.absentCount}</strong></span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/employee/leaves/holidays')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <PartyPopper className="h-3.5 w-3.5 text-teal-600" /> Holidays
          </button>
          <button
            onClick={() => navigate('/employee/leaves')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Apply
          </button>
        </div>
      </div>

      {/* ── Main Single-Page Calendar Grid Card ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 md:p-4 shadow-xs flex flex-col justify-between">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[10px] font-black uppercase tracking-wider">
          <div className="text-rose-500 py-0.5 bg-rose-50/50 rounded-lg">Sun</div>
          <div className="text-slate-500 py-0.5">Mon</div>
          <div className="text-slate-500 py-0.5">Tue</div>
          <div className="text-slate-500 py-0.5">Wed</div>
          <div className="text-slate-500 py-0.5">Thu</div>
          <div className="text-slate-500 py-0.5">Fri</div>
          <div className="text-slate-500 py-0.5">Sat</div>
        </div>

        {/* 7-Column Grid (Sleek Compact Cells) */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysDataList.map((item, idx) => {
            if (!item) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-[64px] sm:h-[70px] lg:h-[74px] rounded-xl bg-slate-50/40 border border-dashed border-slate-100"
                />
              );
            }

            const { day, isToday, primaryStatus, holiday, leave, permission, attendance, isSunday } = item;

            const matchesFilter =
              filterType === 'ALL' ||
              (filterType === 'PRESENT' && primaryStatus === 'PRESENT') ||
              (filterType === 'LATE' && primaryStatus === 'LATE') ||
              (filterType === 'WFH' && primaryStatus === 'WFH') ||
              (filterType === 'LEAVE' && primaryStatus === 'LEAVE') ||
              (filterType === 'HOLIDAY' && primaryStatus === 'HOLIDAY') ||
              (filterType === 'ABSENT' && primaryStatus === 'ABSENT');

            const isDimmed = !matchesFilter;

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDayDetail(item)}
                className={`h-[64px] sm:h-[70px] lg:h-[74px] rounded-xl border p-1.5 flex flex-col justify-between transition-all cursor-pointer select-none group relative ${
                  isDimmed ? 'opacity-20 scale-95' : 'hover:shadow-sm hover:border-slate-400'
                } ${
                  isToday
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                    : holiday
                    ? 'border-teal-200 bg-teal-50/40'
                    : primaryStatus === 'WFH'
                    ? 'border-purple-200 bg-purple-50/30'
                    : primaryStatus === 'LEAVE'
                    ? 'border-indigo-200 bg-indigo-50/30'
                    : primaryStatus === 'LATE'
                    ? 'border-amber-200 bg-amber-50/30'
                    : primaryStatus === 'PRESENT'
                    ? 'border-emerald-200 bg-emerald-50/25'
                    : primaryStatus === 'ABSENT'
                    ? 'border-rose-200 bg-rose-50/30'
                    : isSunday
                    ? 'border-slate-200/80 bg-slate-50/60'
                    : 'border-slate-200/70 bg-white'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-black transition-all ${
                      isToday
                        ? 'h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-xs'
                        : isSunday
                        ? 'text-rose-500'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>

                  {/* Micro Indicators */}
                  {isToday && (
                    <span className="text-[8px] font-extrabold uppercase text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Day Badge */}
                <div className="my-auto">
                  {/* 1. Holiday */}
                  {holiday && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-teal-500 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title={`Holiday: ${holiday.name}`}
                    >
                      <PartyPopper className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{holiday.name}</span>
                    </div>
                  )}

                  {/* 2. Leave */}
                  {leave && !holiday && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title={`Leave: ${leave.leaveType.replace('_', ' ')}`}
                    >
                      <Palmtree className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{leave.leaveType.replace('_', ' ')}</span>
                    </div>
                  )}

                  {/* 3. WFH */}
                  {primaryStatus === 'WFH' && !holiday && !leave && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title="Work From Home"
                    >
                      <Home className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">WFH</span>
                    </div>
                  )}

                  {/* 4. Present (On Time) */}
                  {primaryStatus === 'PRESENT' && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title={`Present (In: ${formatPunchTime(attendance?.loginTime)})`}
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">Present</span>
                    </div>
                  )}

                  {/* 5. Late */}
                  {primaryStatus === 'LATE' && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title={`Late (${formatPunchTime(attendance?.loginTime)})`}
                    >
                      <Clock className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">Late {formatPunchTime(attendance?.loginTime)}</span>
                    </div>
                  )}

                  {/* 6. Permission */}
                  {primaryStatus === 'PERMISSION' && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-cyan-600 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title="Permission"
                    >
                      <Sparkles className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">Permission</span>
                    </div>
                  )}

                  {/* 7. Absent */}
                  {primaryStatus === 'ABSENT' && (
                    <div
                      className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-extrabold truncate leading-tight shadow-2xs flex items-center gap-1"
                      title="Absent"
                    >
                      <XCircle className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">Absent</span>
                    </div>
                  )}

                  {/* 8. Sunday / Week Off */}
                  {primaryStatus === 'WEEK_OFF' && (
                    <div
                      className="px-1 py-0.5 rounded bg-slate-200 text-slate-600 text-[9px] font-bold truncate leading-tight flex items-center gap-1"
                      title="Week Off (Sunday)"
                    >
                      <Sun className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                      <span className="truncate">Week Off</span>
                    </div>
                  )}
                </div>

                {/* Sub-text: Punch In Time */}
                {attendance?.loginTime && (
                  <div className="text-[8px] font-semibold text-slate-500 truncate flex items-center justify-between mt-auto">
                    <span className="font-mono text-slate-400">In:</span>
                    <span className="font-mono font-bold text-slate-700">{formatPunchTime(attendance.loginTime)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Compact Bottom Legend Strip ── */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500 font-semibold">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
            Legend:
          </span>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Late</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> WFH</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Leave</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-500" /> Holiday</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Absent</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Week Off</span>
          </div>
        </div>
      </div>

      {/* ── Day Details Popup Modal ── */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Date Details
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {new Date(selectedDayDetail.dateStr).toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Pill in Modal */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-600">Primary Status</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${
                  selectedDayDetail.primaryStatus === 'PRESENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedDayDetail.primaryStatus === 'LATE'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedDayDetail.primaryStatus === 'WFH'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedDayDetail.primaryStatus === 'LEAVE'
                    ? 'bg-indigo-100 text-indigo-800'
                    : selectedDayDetail.primaryStatus === 'HOLIDAY'
                    ? 'bg-teal-100 text-teal-800'
                    : selectedDayDetail.primaryStatus === 'ABSENT'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedDayDetail.primaryStatus === 'WEEK_OFF'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {selectedDayDetail.primaryStatus}
              </span>
            </div>

            {/* Details Content */}
            <div className="space-y-2 text-xs text-slate-700">
              {/* Attendance Log Info */}
              {selectedDayDetail.attendance && (
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Attendance Punch Record
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Check-In</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatPunchTime(selectedDayDetail.attendance.loginTime) || '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Check-Out</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatPunchTime(selectedDayDetail.attendance.logoutTime) || '--:--'}
                      </span>
                    </div>
                  </div>
                  {selectedDayDetail.attendance.loginDistance !== undefined && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>Distance: {selectedDayDetail.attendance.loginDistance}m from office</span>
                    </div>
                  )}
                </div>
              )}

              {/* Holiday Info */}
              {selectedDayDetail.holiday && (
                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 space-y-1">
                  <div className="font-extrabold text-teal-900 flex items-center gap-1 text-[11px]">
                    <PartyPopper className="h-3.5 w-3.5 text-teal-600" /> {selectedDayDetail.holiday.name}
                  </div>
                  <p className="text-slate-600 text-[10px]">
                    Type: <span className="font-semibold">{selectedDayDetail.holiday.holidayType}</span>
                  </p>
                  {selectedDayDetail.holiday.description && (
                    <p className="text-slate-500 italic text-[10px]">
                      {selectedDayDetail.holiday.description}
                    </p>
                  )}
                </div>
              )}

              {/* Leave Info */}
              {selectedDayDetail.leave && (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <div className="font-extrabold text-indigo-900 flex items-center gap-1 text-[11px]">
                    <Palmtree className="h-3.5 w-3.5 text-indigo-600" /> Leave Application
                  </div>
                  <p className="text-slate-600 text-[10px]">
                    Type: <span className="font-semibold">{selectedDayDetail.leave.leaveType.replace('_', ' ')}</span> • Status: <span className="font-bold text-indigo-700">{selectedDayDetail.leave.status}</span>
                  </p>
                  {selectedDayDetail.leave.reason && (
                    <p className="text-slate-500 text-[10px]">
                      Reason: "{selectedDayDetail.leave.reason}"
                    </p>
                  )}
                </div>
              )}

              {/* Permission Info */}
              {selectedDayDetail.permission && (
                <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100 space-y-1">
                  <div className="font-extrabold text-cyan-900 flex items-center gap-1 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-600" /> Permission Request
                  </div>
                  <p className="text-slate-600 text-[10px]">
                    Status: <span className="font-bold text-cyan-700">{selectedDayDetail.permission.status}</span>
                  </p>
                  {selectedDayDetail.permission.reason && (
                    <p className="text-slate-500 text-[10px]">
                      Reason: "{selectedDayDetail.permission.reason}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedDayDetail(null);
                  navigate('/employee/leaves');
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all text-center cursor-pointer shadow-xs"
              >
                Apply Leave
              </button>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
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

export default LeaveCalendar;
