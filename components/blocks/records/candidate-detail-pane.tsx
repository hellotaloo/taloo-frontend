'use client';

import {
  X,
  Mail,
  Phone,
  Star,
  Briefcase,
  Loader2,
  MessageSquare,
  PhoneCall,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  APICandidateDetail,
  APICandidateStatus,
  APIAvailabilityStatus,
  APICandidateApplicationSummary,
} from '@/lib/types';

export interface CandidateDetailPaneProps {
  candidate: APICandidateDetail | null;
  isLoading?: boolean;
  onClose: () => void;
}

// Status badge styles
const statusStyles: Record<APICandidateStatus, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Nieuw' },
  qualified: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Gekwalificeerd' },
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actief' },
  placed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Geplaatst' },
  inactive: { bg: 'bg-gray-50 border border-gray-200', text: 'text-gray-500', label: 'Inactief' },
};

// Availability labels
const availabilityLabels: Record<APIAvailabilityStatus, string> = {
  available: 'Beschikbaar',
  unavailable: 'Niet beschikbaar',
  unknown: 'Onbekend',
};

// Application status styles
const applicationStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Actief' },
  processing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Verwerken' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Afgerond' },
  abandoned: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Verlaten' },
};

// Channel icons
const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  voice: PhoneCall,
  cv: FileText,
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: APICandidateStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function RatingDisplay({ rating }: { rating: number | undefined }) {
  if (rating === undefined || rating === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-700">
      <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
      {rating.toFixed(1)}
    </span>
  );
}

function ApplicationCard({ application }: { application: APICandidateApplicationSummary }) {
  const statusStyle = applicationStatusStyles[application.status] || applicationStatusStyles.active;
  const ChannelIcon = channelIcons[application.channel] || FileText;

  return (
    <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-sm font-medium text-gray-900 truncate">{application.vacancy_title}</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 ml-6">{application.vacancy_company}</p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2 ml-6">
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <ChannelIcon className="w-3 h-3" />
          {application.channel === 'whatsapp' ? 'WhatsApp' : application.channel === 'voice' ? 'Voice' : 'CV'}
        </span>
        {/* Show "Bezig" for active/processing applications */}
        {(application.status === 'active' || application.status === 'processing') && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
            <Clock className="w-3 h-3" />
            Bezig
          </span>
        )}
        {/* Only show qualified/not qualified for completed applications */}
        {application.status === 'completed' && application.qualified !== undefined && (
          <span className={`inline-flex items-center gap-1 text-xs ${application.qualified ? 'text-green-600' : 'text-red-500'}`}>
            {application.qualified ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Gekwalificeerd
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Niet gekwalificeerd
              </>
            )}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDateTime(application.started_at)}
        </span>
      </div>
    </div>
  );
}

export function CandidateDetailPane({ candidate, isLoading, onClose }: CandidateDetailPaneProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  // Separate skills and certificates
  const skills = candidate.skills.filter(s => s.skill_category !== 'certificates');
  const certificates = candidate.skills.filter(s => s.skill_category === 'certificates');

  // Sort applications by date (newest first)
  const sortedApplications = [...candidate.applications].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{candidate.full_name}</h2>
              <StatusBadge status={candidate.status} />
              <RatingDisplay rating={candidate.rating} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {candidate.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {candidate.phone}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {/* Rating */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Beoordeling
            </p>
            {candidate.rating !== undefined && candidate.rating !== null ? (
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                {candidate.rating.toFixed(1)}
              </p>
            ) : (
              <p className="text-sm text-gray-400">-</p>
            )}
          </div>

          {/* Availability */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Beschikbaarheid
            </p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {candidate.available_from
                ? `Vanaf ${formatDate(candidate.available_from)}`
                : availabilityLabels[candidate.availability]}
            </p>
          </div>

          {/* Applications Count */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Sollicitaties
            </p>
            <p className="text-sm font-medium text-gray-900">
              {candidate.applications.length} totaal
            </p>
          </div>
        </div>

        {/* Skills & Certificates */}
        {(skills.length > 0 || certificates.length > 0) && (
          <div className="mt-4">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
              Vaardigheden & Certificaten
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                >
                  {skill.skill_name.charAt(0).toUpperCase() + skill.skill_name.slice(1)}
                </span>
              ))}
              {certificates.map((cert) => (
                <span
                  key={cert.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700"
                >
                  {cert.skill_name.charAt(0).toUpperCase() + cert.skill_name.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Applications */}
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sollicitaties ({candidate.applications.length})
          </h3>
          {sortedApplications.length > 0 ? (
            <div className="space-y-2">
              {sortedApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              Nog geen sollicitaties
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
