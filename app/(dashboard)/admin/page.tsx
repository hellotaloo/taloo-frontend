'use client';

import Link from 'next/link';
import { Phone, MessageSquare, Settings, Users, Network, Activity } from 'lucide-react';
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
}

function AdminCard({
  title,
  description,
  href,
  icon: Icon,
  animationDelay = 0,
  testId,
}: AdminCardProps) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
      style={
        animationDelay > 0
          ? { animation: `fade-in-up 0.3s ease-out ${animationDelay}ms backwards` }
          : undefined
      }
    >
      <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Agent Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminCard
                title="Voice instellingen"
                description="Configureer voice agent instellingen"
                href="/admin/voice-settings"
                icon={Phone}
                animationDelay={50}
                testId="admin-card-voice"
              />
              <AdminCard
                title="WhatsApp instellingen"
                description="Configureer WhatsApp agent instellingen"
                href="/admin/whatsapp-settings"
                icon={MessageSquare}
                animationDelay={100}
                testId="admin-card-whatsapp"
              />
            </div>
          </section>

          <section className="space-y-4 mt-8">
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
                title="Monitor"
                description="Bekijk alle systeem events"
                href="/admin/monitor"
                icon={Activity}
                animationDelay={200}
                testId="admin-card-monitor"
              />
              <AdminCard
                title="General Settings"
                description="Configure general application settings"
                href="/admin"
                icon={Settings}
                animationDelay={250}
                testId="admin-card-settings"
              />
              <AdminCard
                title="Team Members"
                description="Manage team access and permissions"
                href="/admin"
                icon={Users}
                animationDelay={300}
                testId="admin-card-team"
              />
            </div>
          </section>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
