import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

interface Holiday {
  date: string;
  day: string;
  name: string;
  type: string;
}

const holidays2026: Holiday[] = [
  { date: '01 Jan 2026', day: 'Thursday', name: 'New Year Day', type: 'Public Holiday' },
  { date: '14 Jan 2026', day: 'Wednesday', name: 'Pongal / Makar Sankranti', type: 'Public Holiday' },
  { date: '26 Jan 2026', day: 'Monday', name: 'Republic Day', type: 'National Holiday' },
  { date: '01 May 2026', day: 'Friday', name: 'May Day / Labour Day', type: 'Public Holiday' },
  { date: '15 Aug 2026', day: 'Saturday', name: 'Independence Day', type: 'National Holiday' },
  { date: '01 Sep 2026', day: 'Tuesday', name: 'Vinayakar Chathurthi', type: 'Festival Holiday' },
  { date: '04 Sep 2026', day: 'Friday', name: 'Krishna Jayanthi', type: 'Festival Holiday' },
  { date: '01 Oct 2026', day: 'Thursday', name: 'Gandhi Jayanthi', type: 'National Holiday' },
  { date: '20 Oct 2026', day: 'Tuesday', name: 'Ayutha Pooja', type: 'Festival Holiday' },
  { date: '08 Nov 2026', day: 'Sunday', name: 'Deepavali', type: 'Festival Holiday' },
  { date: '25 Dec 2026', day: 'Friday', name: 'Christmas Day', type: 'Public Holiday' },
];

const HolidayCalendar: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-teal-500 rounded-sm transform rotate-45 shrink-0 shadow-sm" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Holiday Calendar 2026</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Holiday Name</th>
                <th className="py-3 px-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {holidays2026.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">{h.date}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{h.day}</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-700">{h.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {h.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendar;
