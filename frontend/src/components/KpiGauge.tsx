import React from 'react';

interface KpiGaugeProps {
  score: number; // 0 - 100
  label?: string;
  size?: number;
}

export const getKpiTier = (score: number) => {
  if (score >= 90) return { label: 'Excellent', color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (score >= 80) return { label: 'Very Good', color: '#10b981', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
  if (score >= 70) return { label: 'Good', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  if (score >= 60) return { label: 'Needs Attention', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  return { label: 'At Risk', color: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
};

const KpiGauge: React.FC<KpiGaugeProps> = ({ score = 75, label, size = 220 }) => {
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const clampedScore = Math.max(0, Math.min(100, Math.round(safeScore)));
  const tier = getKpiTier(clampedScore);
  const displayLabel = label || tier.label;


  const radius = 72;
  const strokeWidth = 12;
  const cx = size / 2;
  const cy = 105;

  const currentAngle = Math.PI + (clampedScore / 100) * Math.PI;
  const needleLength = radius - 10;
  const needleX = cx + needleLength * Math.cos(currentAngle);
  const needleY = cy + needleLength * Math.sin(currentAngle);

  // Generates SVG arc path on the upper semicircle (180deg to 360deg).
  // For any sub-arc on a 180-degree semicircle, the angular span is <= 180deg,
  // so largeArcFlag MUST always be 0.
  const createArc = (startNorm: number, endNorm: number) => {
    if (startNorm >= endNorm) return '';
    const a1 = Math.PI + startNorm * Math.PI;
    const a2 = Math.PI + endNorm * Math.PI;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: 130 }}>
        <svg
          viewBox={`0 0 ${size} 130`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Track Segments */}
          <path d={createArc(0, 0.59)} fill="none" stroke="#fee2e2" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={createArc(0.60, 0.69)} fill="none" stroke="#fef3c7" strokeWidth={strokeWidth} />
          <path d={createArc(0.70, 0.89)} fill="none" stroke="#dcfce7" strokeWidth={strokeWidth} />
          <path d={createArc(0.90, 1.0)} fill="none" stroke="#d1fae5" strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Active Colored Arc */}
          {clampedScore > 0 && (
            <path
              d={createArc(0, clampedScore / 100)}
              fill="none"
              stroke="url(#gaugeActiveGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Needle Base Ring */}
          <circle cx={cx} cy={cy} r="8" fill="#1e293b" />
          <circle cx={cx} cy={cy} r="4" fill="#f8fafc" />

          {/* Needle Indicator */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#gaugeShadow)"
          />

          {/* Scale Labels */}
          <text x={cx - radius - 2} y={cy + 16} fontSize="10" fill="#94a3b8" fontWeight="600" textAnchor="middle">0%</text>
          <text x={cx + radius + 2} y={cy + 16} fontSize="10" fill="#94a3b8" fontWeight="600" textAnchor="middle">100%</text>
        </svg>

        {/* Center Score & Badge Overlay */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-slate-800 tracking-tight leading-none drop-shadow-xs">
            {clampedScore}%
          </span>
          <span
            className={`mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${tier.bg} ${tier.text} ${tier.border}`}
          >
            {displayLabel}
          </span>
        </div>
      </div>

      {/* 5-Tier Color Scale Legend */}
      <div className="w-full mt-3 pt-3 border-t border-slate-100 grid grid-cols-5 gap-1 text-[10px] text-center font-medium">
        <div className="p-1 rounded bg-rose-50 border border-rose-100 text-rose-700">
          <span className="block font-bold">&lt;60%</span>
          <span className="text-[9px] text-rose-600/80">At Risk</span>
        </div>
        <div className="p-1 rounded bg-amber-50 border border-amber-100 text-amber-700">
          <span className="block font-bold">60-69%</span>
          <span className="text-[9px] text-amber-600/80">Needs Attn</span>
        </div>
        <div className="p-1 rounded bg-green-50 border border-green-100 text-green-700">
          <span className="block font-bold">70-79%</span>
          <span className="text-[9px] text-green-600/80">Good</span>
        </div>
        <div className="p-1 rounded bg-teal-50 border border-teal-100 text-teal-700">
          <span className="block font-bold">80-89%</span>
          <span className="text-[9px] text-teal-600/80">V. Good</span>
        </div>
        <div className="p-1 rounded bg-emerald-50 border border-emerald-100 text-emerald-800">
          <span className="block font-bold">90-100%</span>
          <span className="text-[9px] text-emerald-700/80">Excellent</span>
        </div>
      </div>
    </div>
  );
};

export default KpiGauge;
