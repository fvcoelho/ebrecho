'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface SimpleLineChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
  valuePrefix?: string;
}

export function SimpleLineChart({ data, height = 200, valuePrefix = '' }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[200px] text-gray-500">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            y1={height * (1 - ratio)}
            x2="100%"
            y2={height * (1 - ratio)}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
          />
        ))}

        {/* Data line */}
        <polyline
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth="2"
          points={data
            .map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = height - ((d.value - minValue) / range) * height;
              return `${x}%,${y}`;
            })
            .join(' ')}
        />

        {/* Area under line */}
        <polygon
          fill="url(#gradient)"
          points={`0,${height} ${data
            .map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = height - ((d.value - minValue) / range) * height;
              return `${x}%,${y}`;
            })
            .join(' ')} 100%,${height}`}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = height - ((d.value - minValue) / range) * height;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={y}
              r="3"
              fill="rgb(99, 102, 241)"
              className="hover:r-4 transition-all"
            >
              <title>{`${d.date}: ${valuePrefix}${d.value.toLocaleString()}`}</title>
            </circle>
          );
        })}
      </svg>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 -ml-12 h-full flex flex-col justify-between text-xs text-gray-600">
        <span>{valuePrefix}{maxValue.toLocaleString()}</span>
        <span>{valuePrefix}{Math.round((maxValue + minValue) / 2).toLocaleString()}</span>
        <span>{valuePrefix}{minValue.toLocaleString()}</span>
      </div>
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  valuePrefix?: string;
}

export function SimpleBarChart({ data, height = 200, valuePrefix = '' }: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[200px] text-gray-500">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="relative" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full relative group">
                <div
                  className="bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-t"
                  style={{ height: `${heightPercent}%` }}
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {valuePrefix}{item.value.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}