'use client';

import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  HeadphonesIcon,
  FileCheck,
  ShieldCheck,
  CalendarOff,
  Receipt,
  UsersRound,
  ClipboardList,
  BookOpen,
  Radio,
  FileText,
  SearchX,
  Bell,
  MailOpen,
  Crosshair,
  Plus,
} from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';

interface Agent {
  name: string;
  description: string;
  icon: React.ElementType;
  active?: boolean;
  href?: string;
}

interface AgentCategory {
  title: string;
  agents: Agent[];
}

const agentCategories: AgentCategory[] = [
  {
    title: 'Communiceren',
    agents: [
      {
        name: 'Job Board Agent',
        description: 'Kandidaten vinden via conversationele vacatureplatforms',
        icon: MessageSquare,
      },
      {
        name: 'Pre-screening Agent',
        description: 'Automatische pre-screening gesprekken en planning',
        icon: Phone,
        active: true,
        href: '/pre-screening',
      },
      {
        name: 'Support Desk Agent',
        description: 'Directe antwoorden op vragen van kandidaten en klanten',
        icon: HeadphonesIcon,
      },
      {
        name: 'Onboarding Agent',
        description: 'Automatische onboarding en documenten verzamelen',
        icon: FileCheck,
      },
    ],
  },
  {
    title: 'Automatiseren',
    agents: [
      {
        name: 'Background Check Agent',
        description: 'Geautomatiseerde referentie- en achtergrondcontroles',
        icon: ShieldCheck,
      },
      {
        name: 'Absence Agent',
        description: 'Automatisch afwezigheden verwerken en shifts dekken',
        icon: CalendarOff,
      },
      {
        name: 'Payroll Agent',
        description: 'Verloning monitoren en afwijkingen detecteren',
        icon: Receipt,
      },
      {
        name: 'Talent Pool Agent',
        description: 'Talentpools beheren en GDPR-compliance waarborgen',
        icon: UsersRound,
      },
    ],
  },
  {
    title: 'Begeleiden',
    agents: [
      {
        name: 'Client Intake Agent',
        description: 'Klantaanvragen analyseren en actieplannen opstellen',
        icon: ClipboardList,
      },
      {
        name: 'Interview Prep Agent',
        description: 'Interview voorbereiding en kandidaat briefings',
        icon: BookOpen,
      },
      {
        name: 'Real-time Assist Agent',
        description: 'Live ondersteuning tijdens gesprekken en interviews',
        icon: Radio,
      },
      {
        name: 'Notes & Summary Agent',
        description: 'Automatische notities en samenvattingen van gesprekken',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Opvolgen',
    agents: [
      {
        name: 'Bottleneck Agent',
        description: 'Knelpunten in processen detecteren en melden',
        icon: SearchX,
      },
      {
        name: 'Nudge & Reminder Agent',
        description: 'Slimme herinneringen en actiepunten voor recruiters',
        icon: Bell,
      },
      {
        name: 'Reply Draft Agent',
        description: 'Automatisch antwoorden opstellen voor e-mails',
        icon: MailOpen,
      },
      {
        name: 'Next Action Agent',
        description: 'Optimale vervolgacties suggereren per vacature',
        icon: Crosshair,
      },
    ],
  },
];

function AgentCard({
  agent,
  animationDelay = 0,
}: {
  agent: Agent;
  animationDelay?: number;
}) {
  const Icon = agent.icon;

  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${agent.active ? 'bg-green-500' : 'bg-brand-dark-blue'}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {agent.active ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Actief
          </span>
        ) : (
          <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{agent.name}</h3>
      <p className="text-sm text-gray-500">{agent.description}</p>
    </>
  );

  const className = `block rounded-xl border p-5 transition-all ${
    agent.active
      ? 'bg-white border-green-200 hover:border-green-300 hover:shadow-sm'
      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
  }`;

  if (agent.href) {
    return (
      <Link
        href={agent.href}
        className={className}
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

  return (
    <div
      className={className}
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

export default function AgentsPage() {
  let globalIndex = 0;

  return (
    <PageLayout>
      <PageLayoutHeader />
      <PageLayoutContent>
        <div className="space-y-8">
          {agentCategories.map((category) => (
            <section key={category.title} className="space-y-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{category.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.agents.map((agent) => {
                  const delay = ++globalIndex * 50;
                  return (
                    <AgentCard
                      key={agent.name}
                      agent={agent}
                      animationDelay={delay}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
