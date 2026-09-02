import * as XLSX from 'xlsx';
import { MonthlyAttendanceData } from '../types/attendance';

export const exportMonthlyRegisterToExcel = (
  monthlyData: MonthlyAttendanceData,
  year: number,
  month: number
) => {
  if (!monthlyData || !monthlyData.employees) return;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const monthAbbr = monthNames[month - 1] || 'Mon';
  const fullMonthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  // Generate Date list and Days of Week list
  const daysInMonth = monthlyData.daysInMonth;
  const dayNames: string[] = [];
  const dateLabels: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    const dayOfWeek = dt.toLocaleString('en-US', { weekday: 'short' });
    dayNames.push(dayOfWeek);
    dateLabels.push(`${d}-${monthAbbr}`);
  }

  // Row 1: Day of Week Header
  const row1 = [
    'Login Time',
    'Employee Code',
    'Employee Name',
    ...dayNames,
    'No .of Working days',
    'No. Of Days Present',
    'No of days Leave',
    'Attendance %'
  ];

  // Row 2: Date Header
  const row2 = [
    'Login Time',
    'Emp ID',
    'Employee Name',
    ...dateLabels,
    'Working days',
    'Present',
    'Leave',
    '%'
  ];

  // Employee Data Rows
  const dataRows = monthlyData.employees.map((emp: any) => {
    const daysCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNum = i + 1;
      const dayDetail = emp.days[String(dayNum)];
      if (!dayDetail) return '--';

      const dt = new Date(year, month - 1, dayNum);
      const isSunday = dt.getDay() === 0;

      if (dayDetail.isHoliday || dayDetail.code === 'HD') return 'HD';
      if (dayDetail.status === 'Week Off' || isSunday) return 'WO';
      if (dayDetail.code === 'CL') return 'CL';
      if (dayDetail.code === 'SL') return 'SL';
      if (dayDetail.code === 'WFH') return 'WFH';
      if (dayDetail.code === 'Spl Leave') return 'Spl Leave';
      if (dayDetail.code === 'CO') return 'CO';
      if (dayDetail.status === 'Leave' || dayDetail.code === 'LV') return 'Leave';
      if (dayDetail.code === 'P' || dayDetail.status === 'Present') return 'P';
      if (dayDetail.code === 'AB' || dayDetail.status === 'Absent') return 'AB';
      if (dayDetail.status === 'Late') return 'P';
      if (dayDetail.status === 'Permission') return 'P';
      if (dayDetail.code === '--') return '--';
      return dayDetail.code || 'P';
    });

    const workingDays = emp.workingDays || (monthlyData as any).workingDays || 25;
    const presentDays = emp.presentDays !== undefined ? emp.presentDays : emp.totalPresent;
    const leaveDays = emp.leaveDays !== undefined ? emp.leaveDays : emp.totalLeave;
    const attPercentage = emp.attendancePercentage !== undefined ? `${emp.attendancePercentage}%` : `${Math.round((presentDays / workingDays) * 100)}%`;
    const loginTime = emp.loginTime || '8.45';

    return [
      loginTime,
      emp.employeeCode,
      emp.employeeName,
      ...daysCells,
      workingDays,
      presentDays,
      leaveDays,
      attPercentage
    ];
  });

  const wsData = [row1, row2, ...dataRows];

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = [
    { wch: 12 }, // Login Time
    { wch: 12 }, // Emp Code
    { wch: 22 }, // Emp Name
    ...Array.from({ length: daysInMonth }).map(() => ({ wch: 7 })),
    { wch: 18 }, // No. of Working days
    { wch: 18 }, // No. of Days Present
    { wch: 16 }, // No. of days Leave
    { wch: 14 }  // Attendance %
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${monthAbbr}_${year}_Register`);

  // Trigger download
  XLSX.writeFile(wb, `Attendance_Register_${fullMonthName}_${year}.xlsx`);
};

export interface ExactLeaveReportRow {
  sNo: number;
  employeeId: string;
  employeeName: string;
  type: 'Employee' | 'Trainee' | 'Intern';
  joinedMonth: string;
  totalLeave: number;
  leaveTaken: number;
  balance: number;
  highlightRedTotal?: boolean;
  highlightYellowTaken?: boolean;
}

export const exportLeaveBalanceReportToExcel = (
  data: ExactLeaveReportRow[],
  fileName: string = 'Employee_Leave_Balance_Report.xlsx'
) => {
  const headers = [
    'S.No',
    'Employee ID',
    'Employee Name',
    'Type',
    'Joined Month',
    'Total Leave',
    'Leave Taken',
    'Balance'
  ];

  const rows = data.map((item, idx) => [
    item.sNo || idx + 1,
    item.employeeId,
    item.employeeName,
    item.type,
    item.joinedMonth,
    item.totalLeave,
    item.leaveTaken,
    item.balance
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths matching table layout
  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 16 }, // Employee ID
    { wch: 24 }, // Employee Name
    { wch: 14 }, // Type
    { wch: 14 }, // Joined Month
    { wch: 14 }, // Total Leave
    { wch: 14 }, // Leave Taken
    { wch: 12 }  // Balance
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leave_Balance_Report');
  XLSX.writeFile(wb, fileName);
};

