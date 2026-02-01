'use client';

import { Users, ArrowRight, Phone } from 'lucide-react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Application } from './InterviewDashboard';

interface ApplicationsTableProps {
  applications: Application[];
  selectedId: string | null;
  onSelectApplication: (id: string) => void;
  isPublished?: boolean;
  onPublishClick?: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ApplicationsTable({ 
  applications, 
  selectedId,
  onSelectApplication,
  isPublished = true,
  onPublishClick,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    // Show different empty state based on whether pre-screening is published
    if (!isPublished && onPublishClick) {
      return (
        <button 
          type="button"
          onClick={onPublishClick}
          className="w-full text-center py-12 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center mx-auto mb-3 transition-colors">
            <Users className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors" />
          </div>
          <p className="text-sm text-gray-500 group-hover:text-green-600 transition-colors">
            Klik hier om de pre-screening te publiceren
          </p>
        </button>
      );
    }
    
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Nog geen kandidaten ontvangen</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Kandidaat</TableHead>
          <TableHead className="px-4 text-center">Score</TableHead>
          <TableHead className="px-4 text-center">Kanaal</TableHead>
          <TableHead className="px-4">Datum</TableHead>
          <TableHead className="px-4">Interactietijd</TableHead>
          <TableHead className="px-4 text-center">Synced</TableHead>
          <TableHead className="text-right pl-4"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => {
          const knockoutAnswers = application.answers.filter(a => a.passed !== undefined);
          const qualifyingAnswers = application.answers.filter(a => a.passed === undefined);
          const knockoutPassed = knockoutAnswers.filter(a => a.passed).length;
          
          return (
            <TableRow
              key={application.id}
              onClick={() => onSelectApplication(application.id)}
              className={`cursor-pointer transition-colors ${
                selectedId === application.id 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : ''
              }`}
            >
            <TableCell>
              <div className="min-w-0">
                <span className="font-medium text-gray-900 block">
                  {application.candidateName}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <ScoreDisplayInline 
                    knockoutPassed={application.knockoutPassed ?? knockoutPassed}
                    knockoutTotal={application.knockoutTotal ?? knockoutAnswers.length}
                    qualifyingAnswered={application.qualificationCount ?? qualifyingAnswers.length}
                    completed={application.completed}
                  />
                  <StatusLabel 
                    completed={application.completed} 
                    qualified={application.qualified} 
                  />
                </div>
              </div>
            </TableCell>
            <TableCell className="px-4 text-center">
              <OverallScoreBadge score={application.overallScore} completed={application.completed} />
            </TableCell>
            <TableCell className="px-4 text-center">
              <ChannelIcon channel={application.channel} />
            </TableCell>
            <TableCell className="px-4 text-gray-500 text-sm">
              {formatDate(application.timestamp)}
            </TableCell>
            <TableCell className="px-4 text-gray-500 text-sm">
              {application.interactionTime}
            </TableCell>
            <TableCell className="px-4 text-center">
              <SyncedStatus synced={application.synced} />
            </TableCell>
            <TableCell className="text-right pl-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectApplication(application.id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  View details
                  <ArrowRight className="w-3 h-3" />
                </button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function StatusLabel({ completed, qualified }: { completed: boolean; qualified: boolean }) {
  if (!completed) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
        Niet afgerond
      </span>
    );
  }
  
  if (qualified) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
        Gekwalificeerd
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
      Niet gekwalificeerd
    </span>
  );
}

function ScoreDisplayInline({ 
  knockoutPassed, 
  knockoutTotal, 
  qualifyingAnswered,
  completed 
}: { 
  knockoutPassed: number; 
  knockoutTotal: number; 
  qualifyingAnswered: number;
  completed: boolean;
}) {
  if (knockoutTotal === 0) {
    return null;
  }

  const allKnockoutPassed = knockoutPassed === knockoutTotal;
  
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-gray-400">Knockout:</span>
        <span className={allKnockoutPassed ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
          {knockoutPassed}/{knockoutTotal}
        </span>
      </div>
      {completed && qualifyingAnswered > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Qualifying:</span>
          <span className="font-medium text-gray-600">{qualifyingAnswered}</span>
        </div>
      )}
    </div>
  );
}

function SyncedStatus({ synced }: { synced?: boolean }) {
  if (!synced) {
    return <span className="text-gray-400">-</span>;
  }
  
  return (
    <span className="inline-flex items-center justify-center">
      <Image 
        src="/salesforc-logo-cloud.png" 
        alt="Salesforce" 
        width={16} 
        height={11}
        className="opacity-70"
      />
    </span>
  );
}

function ChannelIcon({ channel }: { channel: 'voice' | 'whatsapp' }) {
  if (channel === 'whatsapp') {
    return (
      <span title="WhatsApp" className="flex justify-center">
        <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </span>
    );
  }
  
  return (
    <span title="Telefoon" className="flex justify-center">
      <Phone className="w-4 h-4 text-blue-500" />
    </span>
  );
}

function OverallScoreBadge({ score, completed }: { score?: number; completed: boolean }) {
  if (!completed || score === undefined) {
    return <span className="text-gray-400">-</span>;
  }
  
  // Determine color based on score thresholds
  let colorClasses: string;
  if (score >= 80) {
    colorClasses = 'bg-green-100 text-green-700';
  } else if (score >= 60) {
    colorClasses = 'bg-lime-100 text-lime-700';
  } else if (score >= 40) {
    colorClasses = 'bg-amber-100 text-amber-700';
  } else {
    colorClasses = 'bg-red-100 text-red-700';
  }
  
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold ${colorClasses}`}>
      {score}
    </span>
  );
}
