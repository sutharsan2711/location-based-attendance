import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DailyWorkSummary } from '../types/workPlan';

interface PriorityDonutChartProps {
  summary: DailyWorkSummary;
}

const COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
  NotSet: '#94a3b8',
};

const PriorityDonutChart: React.FC<PriorityDonutChartProps> = ({ summary }) => {
  const data = [
    { name: 'High', value: summary.highPriorityCount || 0, color: COLORS.High },
    { name: 'Medium', value: summary.mediumPriorityCount || 0, color: COLORS.Medium },
    { name: 'Low', value: summary.lowPriorityCount || 0, color: COLORS.Low },
    { name: 'Not Set', value: summary.notSetPriorityCount || 0, color: COLORS.NotSet },
  ].filter((d) => d.value > 0);

  const total = summary.totalTasks || 0;
  const chartData = data.length > 0 ? data : [{ name: 'No Tasks', value: 1, color: '#e2e8f0' }];

  return (
    <div className="flex flex-col items-center justify-between h-full">
      <div className="relative w-full h-44 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={data.length > 1 ? 4 : 0}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {data.length > 0 && (
              <Tooltip
                formatter={(value: any, name: any) => [`${value} tasks`, name]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                }}
                itemStyle={{ color: '#fff' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            {total}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            Planned
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-50/70 border border-red-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[11px] font-semibold text-red-900">High</span>
          </div>
          <span className="text-xs font-bold text-red-700">{summary.highPriorityCount || 0}</span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 border border-amber-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-semibold text-amber-900">Medium</span>
          </div>
          <span className="text-xs font-bold text-amber-700">{summary.mediumPriorityCount || 0}</span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-900">Low</span>
          </div>
          <span className="text-xs font-bold text-emerald-700">{summary.lowPriorityCount || 0}</span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[11px] font-semibold text-slate-700">Not Set</span>
          </div>
          <span className="text-xs font-bold text-slate-600">{summary.notSetPriorityCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default PriorityDonutChart;
