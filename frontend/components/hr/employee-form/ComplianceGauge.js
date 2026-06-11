import React from 'react';

export default function ComplianceGauge({ percentage, size = 72 }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = (pct) => {
        if (pct >= 90) return '#10b981';
        if (pct >= 70) return '#3b82f6';
        if (pct >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const color = getColor(percentage);

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth="5" fill="none" />
                <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="5" fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold leading-none" style={{ color }}>{percentage}%</span>
                <span className="text-[8px] text-gray-400 mt-0.5">التزام</span>
            </div>
        </div>
    );
}
