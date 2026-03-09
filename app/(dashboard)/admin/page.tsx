'use client';

import Link from 'next/link';
import { Settings, Users, Network, Plug } from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';

interface AdminCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  animationDelay?: number;
  testId?: string;
  comingSoon?: boolean;
}

function AdminCard({
  title,
  description,
  href,
  icon: Icon,
  animationDelay = 0,
  testId,
  comingSoon,
}: AdminCardProps) {
  const content = (
    <>
      {comingSoon && (
        <span className="absolute top-3 right-3 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">coming soon</span>
      )}
      <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </>
  );

  if (comingSoon) {
    return (
      <div
        data-testid={testId}
        className="relative block rounded-xl border border-gray-200 bg-white p-5 opacity-60 cursor-not-allowed"
        style={
          animationDelay > 0
            ? { animation: `fade-in-up 0.3s ease-out ${animationDelay}ms backwards` }
            : undefined
        }
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      data-testid={testId}
      className="relative block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-all"
      style={
        animationDelay > 0
          ? { animation: `fade-in-up 0.3s ease-out ${animationDelay}ms backwards` }
          : undefined
      }
    >
      {content}
    </Link>
  );
}

export default function AdminPage() {
  return (
    <PageLayout>
      <PageLayoutHeader />
      <PageLayoutContent>
        <div className="max-w-4xl">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminCard
                title="Ontology"
                description="Beheer functies, documenten en vereisten"
                href="/admin/ontology"
                icon={Network}
                animationDelay={150}
                testId="admin-card-ontology"
              />
            </div>
          </section>

          <section className="space-y-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-900">System</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminCard
                title="General Settings"
                description="Configure general application settings"
                href="/admin"
                icon={Settings}
                animationDelay={250}
                testId="admin-card-settings"
                comingSoon
              />
              <AdminCard
                title="Workspace Members"
                description="Manage workspace access and permissions"
                href="/admin"
                icon={Users}
                animationDelay={300}
                testId="admin-card-team"
                comingSoon
              />
            </div>
          </section>

          <section className="space-y-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminCard
                title="External Integrations"
                description="Beheer koppelingen met externe systemen zoals ATS, Teams en meer"
                href="/admin/integrations"
                icon={Plug}
                animationDelay={350}
                testId="admin-card-integrations"
                comingSoon
              />
            </div>
          </section>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
