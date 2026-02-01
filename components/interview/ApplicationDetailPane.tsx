'use client';

import { X, CheckCircle, XCircle, Clock, MessageSquare, Award, UserX, ExternalLink, TrendingUp, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Application } from './InterviewDashboard';

interface ApplicationDetailPaneProps {
  application: Application | null;
  onClose: () => void;
}

export function ApplicationDetailPane({ application, onClose }: ApplicationDetailPaneProps) {
  if (!application) return null;

  const knockoutAnswers = application.answers.filter(a => a.questionType === 'knockout');
  const qualifyingAnswers = application.answers.filter(a => a.questionType === 'qualification');
  const failedKnockout = knockoutAnswers.find(a => a.passed === false);

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {application.candidateName}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(application.timestamp).toLocaleDateString('nl-BE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            View in ATS
            <ExternalLink className="w-3 h-3" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Executive Summary - only show when completed */}
        {application.summary && application.status === 'completed' && (
          <div className="bg-blue-600 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <FileText className="w-2.5 h-2.5 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-white uppercase tracking-wide">
                Executive Summary
              </p>
            </div>
            <p className="text-sm text-white leading-relaxed">
              {application.summary}
            </p>
          </div>
        )}

        {/* Status Summary */}
        <div className="space-y-2">
          {/* Primary stats row */}
          <div className="grid grid-cols-3 gap-2">
            <CompactStatusCard
              label="Status"
              value={application.status === 'completed' ? 'Afgerond' : application.status === 'processing' ? 'Verwerken...' : 'Bezig'}
              icon={application.status === 'completed' ? CheckCircle : Clock}
              variant={application.status === 'completed' ? 'success' : 'info'}
            />
            <CompactStatusCard
              label="Kwalificatie"
              value={application.status === 'completed' ? (application.qualified ? 'Gekwalificeerd' : 'Niet gekwalificeerd') : '-'}
              icon={application.status === 'completed' ? (application.qualified ? Award : UserX) : Award}
              variant={application.status === 'completed' ? (application.qualified ? 'success' : 'error') : 'neutral'}
            />
            {application.overallScore !== undefined && (
              <CompactScoreCard score={application.overallScore} pending={application.status !== 'completed'} />
            )}
          </div>
          {/* Secondary stats row */}
          <div className="flex items-center gap-4 px-1 pt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {application.interactionTime}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {application.answers.length} vragen
            </span>
          </div>
        </div>

        {/* Failed Knockout Reason */}
        {failedKnockout && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Knock-out vraag niet gehaald</p>
                <p className="text-xs text-red-600 mt-1">{failedKnockout.questionText}</p>
                <p className="text-xs text-red-500 mt-1 italic">"{failedKnockout.answer}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Knockout Questions */}
        {knockoutAnswers.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Knock-out vragen
            </h3>
            <div className="space-y-3">
              {knockoutAnswers.map((answer, index) => (
                <AnswerCard 
                  key={index} 
                  answer={answer} 
                  showStatus 
                />
              ))}
            </div>
          </div>
        )}

        {/* Qualifying Questions */}
        {qualifyingAnswers.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Kwalificerende vragen
            </h3>
            <div className="space-y-3">
              {qualifyingAnswers.map((answer, index) => (
                <AnswerCard 
                  key={index} 
                  answer={answer} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CompactStatusCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'success' | 'error' | 'neutral' | 'info';
}

function CompactStatusCard({ label, value, icon: Icon, variant }: CompactStatusCardProps) {
  const variantStyles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-gray-50 border-gray-200 text-gray-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    neutral: 'text-gray-400',
    info: 'text-blue-500',
  };

  return (
    <div className={`border rounded-lg px-2.5 py-2 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`w-3 h-3 ${iconStyles[variant]}`} />
        <span className="text-[10px] font-medium opacity-75">{label}</span>
      </div>
      <p className="text-xs font-semibold truncate">{value}</p>
    </div>
  );
}

function CompactScoreCard({ score, pending = false }: { score: number; pending?: boolean }) {
  // When pending, show greyed out state
  if (pending) {
    return (
      <div className="border rounded-lg px-2.5 py-2 bg-gray-50 border-gray-200 text-gray-700">
        <div className="flex items-center gap-1.5 mb-0.5">
          <TrendingUp className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-medium opacity-75">Score</span>
        </div>
        <p className="text-xs font-semibold">-</p>
      </div>
    );
  }

  let colorClasses: { bg: string; border: string; text: string; icon: string };
  if (score >= 80) {
    colorClasses = { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' };
  } else if (score >= 60) {
    colorClasses = { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', icon: 'text-lime-500' };
  } else if (score >= 40) {
    colorClasses = { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' };
  } else {
    colorClasses = { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' };
  }

  return (
    <div className={`border rounded-lg px-2.5 py-2 ${colorClasses.bg} ${colorClasses.border} ${colorClasses.text}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <TrendingUp className={`w-3 h-3 ${colorClasses.icon}`} />
        <span className="text-[10px] font-medium opacity-75">Score</span>
      </div>
      <p className="text-xs font-semibold">{score}/100</p>
    </div>
  );
}

type AnswerRating = 'excellent' | 'good' | 'average' | 'poor';

interface AnswerCardProps {
  answer: {
    questionText: string;
    questionType?: 'knockout' | 'qualification';
    answer: string;
    passed?: boolean;
    score?: number;
    rating?: AnswerRating;
    motivation?: string;
  };
  showStatus?: boolean;
}

function getRatingLabel(rating: AnswerRating): string {
  switch (rating) {
    case 'excellent': return 'Uitstekend';
    case 'good': return 'Goed';
    case 'average': return 'Gemiddeld';
    case 'poor': return 'Onvoldoende';
  }
}

function getRatingColor(rating: AnswerRating): string {
  switch (rating) {
    case 'excellent': return 'bg-green-100 text-green-700';
    case 'good': return 'bg-lime-100 text-lime-700';
    case 'average': return 'bg-amber-100 text-amber-700';
    case 'poor': return 'bg-red-100 text-red-700';
  }
}

function AnswerCard({ answer, showStatus = false }: AnswerCardProps) {
  const isKnockout = answer.questionType === 'knockout';
  const hasScore = answer.score !== undefined && answer.score !== null;
  const hasRating = !!answer.rating;
  const hasMotivation = !!answer.motivation;

  const hasAnswer = answer.answer && answer.answer.trim() !== '';

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-sm text-gray-700 font-medium">{answer.questionText}</p>
      {hasAnswer ? (
        <p className="text-sm text-gray-600 mt-2 italic">"{answer.answer}"</p>
      ) : (
        <p className="text-sm text-gray-400 mt-2 italic">Waiting for answer</p>
      )}
      
      {/* Status and score row */}
      {(showStatus || hasScore || hasRating) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Show passed/failed badge for knockout questions */}
          {showStatus && answer.passed !== undefined && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              answer.passed 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {answer.passed ? 'Passed' : 'Not passed'}
            </span>
          )}
          
          {/* Show score for qualifying questions only */}
          {hasScore && !isKnockout && (
            <span className="text-xs text-gray-500">Score: <span className="font-medium text-gray-700">{answer.score}</span></span>
          )}
          
          {/* Show rating badge for qualification questions only (not for knockout) */}
          {hasRating && !isKnockout && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getRatingColor(answer.rating!)}`}>
              {getRatingLabel(answer.rating!)}
            </span>
          )}
          
          {/* Show motivation tooltip for all questions that have it */}
          {hasMotivation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p>{answer.motivation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
}
