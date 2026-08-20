import React from 'react';

// Clipboard with paper and pencil illustration (Review Card)
export const ReviewIllustration: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shadow */}
    <ellipse cx="80" cy="142" rx="45" ry="6" fill="#f1f5f9" />
    
    {/* Clipboard base */}
    <rect x="42" y="32" width="76" height="102" rx="10" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
    
    {/* Clipboard clip */}
    <rect x="62" y="24" width="36" height="16" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2" />
    <circle cx="80" cy="32" r="3" fill="#cbd5e1" />
    
    {/* Sheet of paper */}
    <rect x="50" y="44" width="60" height="82" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Check items */}
    <line x1="58" y1="58" x2="64" y2="64" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
    <line x1="64" y1="64" x2="74" y2="54" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
    <line x1="80" y1="60" x2="100" y2="60" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
    
    <line x1="58" y1="74" x2="64" y2="80" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
    <line x1="64" y1="80" x2="74" y2="70" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
    <line x1="80" y1="76" x2="96" y2="76" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
    
    <line x1="58" y1="90" x2="64" y2="96" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
    <line x1="64" y1="96" x2="74" y2="86" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
    <line x1="80" y1="92" x2="102" y2="92" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Decorative pencil */}
    <g transform="rotate(25 110 95)">
      <rect x="110" y="55" width="10" height="50" rx="2" fill="#fb923c" stroke="#334155" strokeWidth="1.5" />
      <polygon points="110,105 120,105 115,116" fill="#fde047" stroke="#334155" strokeWidth="1.5" />
      <polygon points="113,112 117,112 115,116" fill="#1e293b" />
      <rect x="110" y="50" width="10" height="6" rx="1" fill="#f43f5e" stroke="#334155" strokeWidth="1" />
    </g>
  </svg>
);

// Calculator and Magnifying Glass illustration (Payslip Card)
export const PayslipIllustration: React.FC<{ className?: string }> = ({ className = "w-28 h-28" }) => (
  <svg viewBox="0 0 180 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shadow */}
    <ellipse cx="90" cy="144" rx="55" ry="7" fill="#f1f5f9" />
    
    {/* Calculator Body */}
    <rect x="75" y="30" width="60" height="85" rx="8" fill="#ffffff" stroke="#334155" strokeWidth="2.5" />
    <rect x="83" y="38" width="44" height="18" rx="3" fill="#2dd4bf" stroke="#334155" strokeWidth="1.5" />
    <line x1="90" y1="47" x2="118" y2="47" stroke="#134e4a" strokeWidth="2" strokeLinecap="round" />
    
    {/* Buttons */}
    <circle cx="90" cy="68" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="105" cy="68" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="120" cy="68" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="90" cy="82" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="105" cy="82" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="120" cy="82" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="90" cy="96" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="105" cy="96" r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
    <circle cx="120" cy="96" r="4" fill="#fb7185" stroke="#334155" strokeWidth="1" />
    
    {/* Magnifying Glass */}
    <g transform="rotate(-15 70 85)">
      {/* Lens outer */}
      <circle cx="62" cy="72" r="26" fill="#f87171" fillOpacity="0.85" stroke="#334155" strokeWidth="2.5" />
      {/* Glare */}
      <path d="M 48 60 A 18 18 0 0 1 70 54" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Handle */}
      <rect x="58" y="98" width="8" height="34" rx="3" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
      <line x1="62" y1="104" x2="62" y2="126" stroke="#64748b" strokeWidth="1.5" />
    </g>
    
    {/* Rupee Symbol Badge */}
    <circle cx="145" cy="90" r="14" fill="#ffffff" stroke="#334155" strokeWidth="2" />
    <text x="145" y="96" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155" fontFamily="sans-serif">₹</text>
  </svg>
);

// Person with Telescope / Pointer illustration (Track Card)
export const TrackIllustration: React.FC<{ className?: string }> = ({ className = "w-28 h-28" }) => (
  <svg viewBox="0 0 180 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Floating target dots */}
    <circle cx="45" cy="75" r="9" fill="#fca5a5" stroke="#334155" strokeWidth="2" />
    <circle cx="45" cy="75" r="3" fill="#ef4444" />
    
    <circle cx="68" cy="75" r="9" fill="#fca5a5" stroke="#334155" strokeWidth="2" />
    <circle cx="68" cy="75" r="3" fill="#ef4444" />
    
    {/* Telescope / Pointer Line */}
    <line x1="54" y1="75" x2="115" y2="75" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
    <line x1="85" y1="75" x2="115" y2="75" stroke="#334155" strokeWidth="2.5" />
    
    {/* Cartoon Person */}
    {/* Head */}
    <circle cx="128" cy="48" r="8" fill="#fde047" stroke="#334155" strokeWidth="2" />
    {/* Body */}
    <path d="M 124 57 L 120 85 L 132 85 L 130 57 Z" fill="#ffffff" stroke="#334155" strokeWidth="2" />
    <path d="M 124 60 L 115 76 L 122 77" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
    <path d="M 127 60 L 138 72" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
    {/* Legs / Pants */}
    <path d="M 120 85 L 114 116 L 122 116 L 125 93 L 128 116 L 136 116 L 132 85 Z" fill="#3b82f6" stroke="#334155" strokeWidth="2" />
    
    {/* Doodles around */}
    <path d="M 75 45 Q 85 40 95 45" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M 70 108 Q 80 112 90 108" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

// IT Declaration Folder icon
export const ITFolderIcon: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 8 14 C 8 12.895 8.895 12 10 12 L 18 12 L 22 16 L 38 16 C 39.105 16 40 16.895 40 18 L 40 36 C 40 37.105 39.105 38 38 38 L 10 38 C 8.895 38 8 37.105 8 36 Z" fill="#0284c7" />
    <path d="M 12 18 L 36 18 C 37 18 37.5 18.5 37.5 19.5 L 36 34 C 36 35 35 35.5 34 35.5 L 14 35.5 C 13 35.5 12 35 12 34 Z" fill="#38bdf8" />
    <line x1="16" y1="24" x2="28" y2="24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="28" x2="32" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Proof of Investment (POI) Icon
export const POIIcon: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="8" width="28" height="34" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
    <line x1="16" y1="16" x2="26" y2="16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="22" x2="32" y2="22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="28" x2="24" y2="28" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    
    {/* Pencil */}
    <g transform="rotate(35 32 30)">
      <rect x="28" y="16" width="6" height="20" rx="1" fill="#f43f5e" />
      <polygon points="28,36 34,36 31,41" fill="#fde047" />
      <polygon points="30,39 32,39 31,41" fill="#0f172a" />
    </g>
  </svg>
);
