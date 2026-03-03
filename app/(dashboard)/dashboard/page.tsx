'use client';

import {
  Phone,
  CheckCircle2,
  Boxes,
  Clock,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { MetricCard } from '@/components/kit/metric-card';
import { StatusBadge } from '@/components/kit/status-badge';
import { formatRelativeDate } from '@/lib/utils';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';

// --- Mock data ---

const activityChartData = [
  { date: '19 feb', prescreening: 12, onboarding: 4 },
  { date: '20 feb', prescreening: 18, onboarding: 6 },
  { date: '21 feb', prescreening: 15, onboarding: 8 },
  { date: '22 feb', prescreening: 22, onboarding: 5 },
  { date: '23 feb', prescreening: 28, onboarding: 9 },
  { date: '24 feb', prescreening: 14, onboarding: 7 },
  { date: '25 feb', prescreening: 10, onboarding: 3 },
  { date: '26 feb', prescreening: 24, onboarding: 11 },
  { date: '27 feb', prescreening: 30, onboarding: 8 },
  { date: '28 feb', prescreening: 26, onboarding: 10 },
  { date: '1 mrt', prescreening: 32, onboarding: 12 },
  { date: '2 mrt', prescreening: 28, onboarding: 9 },
  { date: '3 mrt', prescreening: 35, onboarding: 14 },
];

const sparklineTrend = activityChartData.map(d => ({ value: d.prescreening + d.onboarding }));

const recentActivities = [
  { id: 1, agent: 'Pre-screening', candidate: 'Anna de Vries', vacancy: 'Frontend Developer', status: 'completed' as const, time: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: 2, agent: 'Pre-screening', candidate: 'Bram Jansen', vacancy: 'UX Designer', status: 'active' as const, time: new Date(Date.now() - 1000 * 60 * 34).toISOString() },
  { id: 3, agent: 'Pre-onboarding', candidate: 'Claudia Bakker', vacancy: 'Product Manager', status: 'completed' as const, time: new Date(Date.now() - 1000 * 60 * 58).toISOString() },
  { id: 4, agent: 'Pre-screening', candidate: 'Dennis Smit', vacancy: 'Backend Developer', status: 'stuck' as const, time: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 5, agent: 'Pre-screening', candidate: 'Eva Mulder', vacancy: 'Data Engineer', status: 'completed' as const, time: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: 6, agent: 'Pre-onboarding', candidate: 'Floris de Boer', vacancy: 'DevOps Engineer', status: 'active' as const, time: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
];

const agents = [
  { id: 1, name: 'Pre-screening Voice', type: 'Pre-screening', status: 'online' as const, activeTasks: 3, completedToday: 24 },
  { id: 2, name: 'Pre-screening WhatsApp', type: 'Pre-screening', status: 'online' as const, activeTasks: 1, completedToday: 18 },
  { id: 3, name: 'Pre-onboarding', type: 'Onboarding', status: 'online' as const, activeTasks: 2, completedToday: 12 },
  { id: 4, name: 'Document Collector', type: 'Onboarding', status: 'offline' as const, activeTasks: 0, completedToday: 0 },
];

const activityStatusMap = {
  completed: { label: 'Afgerond', variant: 'green' as const },
  active: { label: 'Bezig', variant: 'blue' as const },
  stuck: { label: 'Vastgelopen', variant: 'orange' as const },
};

const agentStatusMap = {
  online: { label: 'Online', variant: 'green' as const, animate: true },
  offline: { label: 'Offline', variant: 'gray' as const, animate: false },
};

// --- Components ---

function ActivityChart() {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5"
      style={{ animation: 'fade-in-up 0.3s ease-out 200ms backwards' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Agent activiteiten</h2>
          <p className="text-xs text-gray-500 mt-0.5">Overzicht van alle agent interacties</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Pre-screening
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-dark-blue" />
            Onboarding
          </span>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradPrescreening" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOnboarding" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#022641" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#022641" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Area
              type="monotone"
              dataKey="prescreening"
              name="Pre-screening"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#gradPrescreening)"
            />
            <Area
              type="monotone"
              dataKey="onboarding"
              name="Onboarding"
              stroke="#022641"
              strokeWidth={2}
              fill="url(#gradOnboarding)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecentActivities() {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5"
      style={{ animation: 'fade-in-up 0.3s ease-out 300ms backwards' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Recente activiteiten</h2>
        <a
          href="/activities"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Bekijk alles
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <div className="divide-y divide-gray-100">
        {recentActivities.map((activity) => {
          const statusConfig = activityStatusMap[activity.status];
          return (
            <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
                {activity.agent === 'Pre-screening' ? (
                  <Phone className="w-3.5 h-3.5 text-white" />
                ) : (
                  <FileCheck className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.candidate}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {activity.vacancy}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge label={statusConfig.label} variant={statusConfig.variant} />
                <span className="text-xs text-gray-400 w-16 text-right">
                  {formatRelativeDate(activity.time)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentsOverview() {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5"
      style={{ animation: 'fade-in-up 0.3s ease-out 400ms backwards' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Agents overzicht</h2>
        <a
          href="/agents"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Beheer
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <div className="space-y-3">
        {agents.map((agent) => {
          const statusConfig = agentStatusMap[agent.status];
          return (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {agent.name}
                  </p>
                  <StatusBadge
                    label={statusConfig.label}
                    variant={statusConfig.variant}
                    animate={statusConfig.animate}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {agent.activeTasks > 0
                    ? `${agent.activeTasks} actief \u00b7 ${agent.completedToday} afgerond vandaag`
                    : 'Geen actieve taken'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-semibold text-gray-900">{agent.completedToday}</p>
                <p className="text-xs text-gray-500">vandaag</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Page ---

export default function DashboardPage() {
  const totalToday = agents.reduce((sum, a) => sum + a.completedToday, 0);
  const activeAgents = agents.filter(a => a.status === 'online').length;

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-brand-dark-blue text-white">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-gray-500">Overzicht van agent activiteiten en prestaties</p>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent>
        <div className="space-y-8 opacity-40 pointer-events-none select-none">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Totaal activiteiten"
              value={totalToday}
              label="Vandaag"
              icon={Phone}
              variant="blue"
              sparklineData={sparklineTrend}
            />
            <MetricCard
              title="Voltooiingspercentage"
              value="87%"
              label="Gem"
              icon={CheckCircle2}
              variant="dark"
              progress={87}
            />
            <MetricCard
              title="Actieve agents"
              value={`${activeAgents}/${agents.length}`}
              label="Online"
              icon={Boxes}
              variant="lime"
            />
            <MetricCard
              title="Gem. doorlooptijd"
              value="4m12s"
              label="Per gesprek"
              icon={Clock}
              variant="purple"
              sparklineData={[
                { value: 5.2 }, { value: 4.8 }, { value: 5.1 }, { value: 4.5 },
                { value: 4.3 }, { value: 4.0 }, { value: 4.2 },
              ]}
            />
          </div>

          {/* Full-width Line Graph */}
          <ActivityChart />

          {/* Recent Activities & Agents Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentActivities />
            <AgentsOverview />
          </div>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
