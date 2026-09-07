import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DailyWorkSummary } from '../types/workPlan';

interface CompletionDonutChartProps {
  summary: DailyWorkSummary;
}

const COLORS = {
  Completed: '#10b981',
  InProgress: '#f59e0b',
  NotCompleted: '#ef4444',
  NotStarted: '#3b82f6',
};

const CompletionDonutChart: React.FC<CompletionDonutChartProps> = ({ summary }) => {
  const data = [
    { name: 'Completed', value: summary.completedCount || 0, color: COLORS.Completed },
    { name: 'In Progress', value: summary.inProgressCount || 0, color: COLORS.InProgress },
    { name: 'Not Completed', value: summary.notCompletedCount || 0, color: COLORS.NotCompleted },
    { name: 'Not Started', value: summary.notStartedCount || 0, color: COLORS.NotStarted },
  ].filter((d) => d.value > 0);

  const total = summary.totalTasks || 0;
  const completionPercent = total > 0 ? Math.round(((summary.completedCount || 0) / total) * 100) : 0;
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
            {completionPercent}%
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mt-0.5">
            Completed
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-900">Completed</span>
          </div>
          <span className="text-xs font-bold text-emerald-700">{summary.completedCount || 0}</span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 border border-amber-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-semibold text-amber-900">In Progress</span>
          </div>
          <span className="text-xs font-bold text-amber-700">{summary.inProgressCount || 0}</span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/70 border border-rose-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-semibold text-rose-900">Not Done</span>
          </div>
          <span className="text-xs font-bold text-rose-700">{summary.notCompletedCount || 0}</span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/70 border border-blue-100/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold text-blue-900">Not Started</span>
          </div>
          <span className="text-xs font-bold text-blue-700">{summary.notStartedCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default CompletionDonutChart;
