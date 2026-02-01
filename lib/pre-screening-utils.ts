import { Application as ComponentApplication } from '@/components/interview';
import { Application as BackendApplication } from '@/lib/types';

/**
 * Format seconds to "Xm Ys" format for displaying interaction time
 */
export function formatInteractionTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

/**
 * Convert backend Application format to the component Application format
 * used by ApplicationsTable and ApplicationDetailPane
 */
export function convertToComponentApplication(app: BackendApplication): ComponentApplication {
  return {
    id: app.id,
    candidateName: app.candidateName,
    interactionTime: formatInteractionTime(app.interactionSeconds),
    interactionSeconds: app.interactionSeconds,
    status: app.status,
    qualified: app.qualified,
    overallScore: app.overallScore,
    knockoutPassed: app.knockoutPassed,
    knockoutTotal: app.knockoutTotal,
    qualificationCount: app.qualificationCount,
    summary: app.summary,
    timestamp: app.startedAt,
    synced: app.synced,
    channel: app.channel,
    interviewSlot: app.interviewSlot,
    isTest: app.isTest,
    answers: app.answers.map(a => ({
      questionId: a.questionId,
      questionText: a.questionText,
      answer: a.answer,
      passed: a.passed ?? undefined,
      score: a.score,
      rating: a.rating,
      motivation: a.motivation,
    })),
  };
}
