'use client';

import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// -- Dummy data: 28 days of daily pre-screening metrics --

interface DailyMetric {
  date: string;
  label: string;
  completionRate: number;
  qualificationRate: number;
  conversations: number;
}

function generateDummyData(): DailyMetric[] {
  const data: DailyMetric[] = [];
  const now = new Date();

  for (let i = 27; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayLabel = date.toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'short',
    });

    // Generate realistic fluctuating data
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base values with weekly patterns
    const baseConversations = isWeekend ? 1 : 5 + Math.floor(Math.random() * 6);
    const baseCompletion = 65 + Math.floor(Math.random() * 20);
    const baseQualification = 30 + Math.floor(Math.random() * 25);

    // Add a slight upward trend over the 4 weeks
    const trendBoost = Math.floor((27 - i) * 0.3);

    data.push({
      date: date.toISOString().split('T')[0],
      label: dayLabel,
      completionRate: Math.min(100, baseCompletion + trendBoost),
      qualificationRate: Math.min(100, baseQualification + Math.floor(trendBoost * 0.5)),
      conversations: baseConversations,
    });
  }

  return data;
}

const DUMMY_TREND_DATA = generateDummyData();

// -- Custom tooltip --

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const labelMap: Record<string, string> = {
    completionRate: 'Voltooiingsgraad',
    qualificationRate: 'Kwalificatiegraad',
    conversations: 'Gesprekken',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2.5 min-w-[160px]">
      <p className="text-xs font-medium text-gray-900 mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[11px] text-gray-600">
                {labelMap[entry.dataKey]}
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-900">
              {entry.dataKey === 'conversations'
                ? entry.value
                : `${entry.value}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main component --

export function PreScreeningInsights() {
  // Show fewer x-axis labels to avoid crowding (every ~4 days)
  const tickIndices = [0, 4, 8, 12, 16, 20, 24, 27];

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Screening Inzichten
          </h2>
          <p className="text-xs text-gray-500">
            Prestaties over de afgelopen 4 weken
          </p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DUMMY_TREND_DATA}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                ticks={tickIndices.map((i) => DUMMY_TREND_DATA[i]?.label)}
              />
              <YAxis
                yAxisId="percentage"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={35}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<TrendTooltip />} />

              {/* Completion rate */}
              <Line
                yAxisId="percentage"
                type="monotone"
                dataKey="completionRate"
                stroke="#022641"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  fill: '#022641',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 5,
                }}
              />

              {/* Qualification rate */}
              <Line
                yAxisId="percentage"
                type="monotone"
                dataKey="qualificationRate"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  fill: '#22c55e',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 5,
                }}
              />

              {/* Conversation count */}
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="conversations"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{
                  fill: '#9ca3af',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 4,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] rounded-full bg-[#022641]" />
            <span className="text-xs text-gray-600">Voltooiingsgraad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Kwalificatiegraad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-[2px] rounded-full bg-gray-400"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #9ca3af 0px, #9ca3af 3px, transparent 3px, transparent 5px)',
                backgroundColor: 'transparent',
              }}
            />
            <span className="text-xs text-gray-600">Gesprekken</span>
          </div>
        </div>
      </div>
    </div>
  );
}
