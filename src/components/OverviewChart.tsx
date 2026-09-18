import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { chartData } from '../data/mockData';

const filters = ['7 Days', '30 Days', '90 Days'] as const;
type FilterKey = typeof filters[number];

const dataMap: Record<FilterKey, typeof chartData.sevenDays> = {
  '7 Days': chartData.sevenDays,
  '30 Days': chartData.thirtyDays,
  '90 Days': chartData.ninetyDays,
};

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-4 py-3"
        style={{
          background: 'rgba(18,18,18,0.95)',
          border: '1px solid #242424',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: '#8A8A8A' }}>
          {label}
        </p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div
              className="rounded-full"
              style={{ width: '6px', height: '6px', background: entry.color }}
            />
            <span style={{ color: '#8A8A8A' }}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: '#FFFFFF' }}>
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function OverviewChart() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('7 Days');
  const data = dataMap[activeFilter];

  const lines = [
    { key: 'visitors', name: 'Visitors', color: '#D4AF37', fill: 'url(#gradGold)' },
    { key: 'movieViews', name: 'Movie Views', color: '#a78bfa', fill: 'url(#gradPurple)' },
    { key: 'searches', name: 'Searches', color: '#60a5fa', fill: 'url(#gradBlue)' },
  ];

  return (
    <div
      className="card-hover fade-in-up delay-600 rounded-2xl p-5 sm:p-6"
      style={{
        background: '#121212',
        border: '1px solid #242424',
        opacity: 0,
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
            Website Overview
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
            Visitors, movie views &amp; searches
          </p>
        </div>

        {/* Legend + Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-4">
            {lines.map((l) => (
              <div key={l.key} className="flex items-center gap-1.5">
                <div
                  className="rounded-full"
                  style={{ width: '6px', height: '6px', background: l.color }}
                />
                <span className="text-xs" style={{ color: '#8A8A8A' }}>
                  {l.name}
                </span>
              </div>
            ))}
          </div>

          {/* Filter buttons */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid #242424' }}
          >
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-3 py-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: activeFilter === f
                    ? 'rgba(212,175,55,0.15)'
                    : 'transparent',
                  color: activeFilter === f ? '#D4AF37' : '#8A8A8A',
                  borderRight: f !== '90 Days' ? '1px solid #242424' : 'none',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#242424"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#8A8A8A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8A8A8A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            {lines.map((l) => (
              <Area
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={2}
                fill={l.fill}
                dot={false}
                activeDot={{ r: 4, fill: l.color, stroke: '#121212', strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

