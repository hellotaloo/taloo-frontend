'use client';

import Link from 'next/link';
import { Phone, MessageSquare, Settings, Users } from 'lucide-react';
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
}

function AdminCard({ title, description, href, icon: Icon }: AdminCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:bg-gray-50 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#015AD9]" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}

export default function AdminPage() {
  return (
    <PageLayout>
      <PageLayoutHeader
        title="Admin"
        description="Beheer instellingen en configuraties"
      />
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
              />
              <AdminCard
                title="WhatsApp instellingen"
                description="Configureer WhatsApp agent instellingen"
                href="/admin/whatsapp-settings"
                icon={MessageSquare}
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
              />
              <AdminCard
                title="Team Members"
                description="Manage team access and permissions"
                href="/admin"
                icon={Users}
              />
            </div>
          </section>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
