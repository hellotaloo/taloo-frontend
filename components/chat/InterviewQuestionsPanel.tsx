'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, GripVertical, MessagesSquare, Pencil, Plus, Trash2, UserX } from 'lucide-react';
import { BoltIcon } from '@heroicons/react/24/solid';
import { GeneratedQuestion } from './QuestionListMessage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InterviewQuestionsPanelProps {
  questions: GeneratedQuestion[];
  isGenerating?: boolean;
  highlightedIds?: string[];
  onQuestionClick?: (question: GeneratedQuestion, index: number) => void;
  onReorder?: (questions: GeneratedQuestion[]) => void;
  onAddQuestion?: (text: string, type: 'knockout' | 'qualifying', idealAnswer?: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  readOnly?: boolean;
}

export function InterviewQuestionsPanel({ questions, isGenerating = false, highlightedIds = [], onQuestionClick, onReorder, onAddQuestion, onDeleteQuestion, readOnly = false }: InterviewQuestionsPanelProps) {
  const knockoutQuestions = questions.filter(q => q.type === 'knockout');
  const qualifyingQuestions = questions.filter(q => q.type === 'qualifying');
  const hasQuestions = questions.length > 0;
  
  // If component mounts with questions already ready, show them immediately
  const [showQuestions, setShowQuestions] = useState(hasQuestions && !isGenerating);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const prevHasQuestionsRef = useRef(hasQuestions);
  const prevIsGeneratingRef = useRef(isGenerating);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for knockout questions
  const handleKnockoutDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = knockoutQuestions.findIndex(q => (q._stableKey || q.id) === active.id);
      const newIndex = knockoutQuestions.findIndex(q => (q._stableKey || q.id) === over.id);
      
      const reorderedKnockout = arrayMove(knockoutQuestions, oldIndex, newIndex);
      const newQuestions = [...reorderedKnockout, ...qualifyingQuestions];
      
      onReorder?.(newQuestions);
    }
  };

  // Handle drag end for qualifying questions
  const handleQualifyingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = qualifyingQuestions.findIndex(q => (q._stableKey || q.id) === active.id);
      const newIndex = qualifyingQuestions.findIndex(q => (q._stableKey || q.id) === over.id);
      
      const reorderedQualifying = arrayMove(qualifyingQuestions, oldIndex, newIndex);
      const newQuestions = [...knockoutQuestions, ...reorderedQualifying];
      
      onReorder?.(newQuestions);
    }
  };

  useEffect(() => {
    const wasGenerating = prevIsGeneratingRef.current;
    const hadQuestions = prevHasQuestionsRef.current;
    
    // Update refs
    prevHasQuestionsRef.current = hasQuestions;
    prevIsGeneratingRef.current = isGenerating;
    
    // Transition from generating to having questions
    if (hasQuestions && !isGenerating && (wasGenerating || !hadQuestions)) {
      // Start fade out of empty state
      setIsFadingOut(true);
      
      // After fade out (400ms) + wait (300ms), show questions
      const timer = setTimeout(() => {
        setShowQuestions(true);
        setIsFadingOut(false);
      }, 700);
      
      return () => clearTimeout(timer);
    }
    
    // Reset when going back to generating
    if (isGenerating && !wasGenerating) {
      setShowQuestions(false);
      setIsFadingOut(false);
    }
  }, [hasQuestions, isGenerating]);

  // Show empty state while generating or during transition
  if (!showQuestions || !hasQuestions || isGenerating) {
    return (
      <div 
        className={`transition-opacity ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        style={{ transitionDuration: '400ms' }}
      >
        <EmptyState isGenerating={isGenerating} />
      </div>
    );
  }

  // Calculate animation delays for the entire flow
  // Base delay for each section, questions get their own cascade within sections
  const triggerDelay = 0;
  const introDelay = 80;
  const knockoutHeaderDelay = 160;
  const knockoutQuestionsBaseDelay = 220;
  const branchDelay = knockoutQuestionsBaseDelay + knockoutQuestions.length * 80 + 80;
  const qualifyingHeaderDelay = branchDelay + 80;
  const qualifyingQuestionsBaseDelay = qualifyingHeaderDelay + 60;
  const outcomeDelay = qualifyingQuestionsBaseDelay + qualifyingQuestions.length * 80 + 80;
  const updateRecordsDelay = outcomeDelay + 80;

  // Show the questions
  return (
    <div className="relative pl-6">
      {/* Continuous timeline line */}
      <div 
        className="absolute left-[7px] top-3 bottom-3 w-px border-l-2 border-dashed border-gray-300"
        style={{ animation: `fade-in 0.8s ease-out backwards` }}
      />

      {/* Trigger */}
      <TimelineItem animationDelay={triggerDelay}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-lime-green">
          <BoltIcon className="w-3.5 h-3.5 text-black" />
          <span className="text-xs font-medium text-black">Nieuwe sollicitatie</span>
        </div>
      </TimelineItem>

      {/* Intro */}
      <TimelineItem animationDelay={introDelay}>
        <div className="bg-brand-dark-blue rounded-lg p-3">
          <p className="text-xs font-medium text-slate-400 mb-1">Intro</p>
          <p className="text-sm text-white">Begroet kandidaat en vraag of hij/zij nu wil starten met het interview. Geef aan hoelang het duurt.</p>
        </div>
      </TimelineItem>

      {/* Knockout Questions */}
      <TimelineItem animationDelay={knockoutHeaderDelay} alignDot="top">
        <h4 className="text-xs font-normal text-black uppercase tracking-wide mb-2">
          Knock-out vragen
        </h4>
        <DndContext
          sensors={readOnly ? [] : sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleKnockoutDragEnd}
        >
          <SortableContext
            items={knockoutQuestions.map(q => q._stableKey || q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {knockoutQuestions.map((question, index) => (
                <SortableQuestionItem 
                  key={question._stableKey || question.id} 
                  question={question} 
                  index={index + 1}
                  variant="knockout"
                  isHighlighted={highlightedIds.includes(question.id)}
                  animationDelay={knockoutQuestionsBaseDelay + index * 80}
                  onClick={readOnly ? undefined : onQuestionClick}
                  onDelete={readOnly ? undefined : onDeleteQuestion}
                  readOnly={readOnly}
                />
              ))}
              {!readOnly && (
                <AddQuestionInput 
                  type="knockout" 
                  onAdd={onAddQuestion}
                  placeholder="Voeg knock-out vraag toe..."
                />
              )}
            </div>
          </SortableContext>
        </DndContext>
      </TimelineItem>

      {/* Branch: Not passed */}
      <TimelineBranch 
        condition="Niet geslaagd"
        outcome="Interesse in andere matches?"
        icon={UserX}
        animationDelay={branchDelay}
      />

      {/* Geslaagd label on timeline */}
      <div 
        className="relative py-2 flex items-center"
        style={{ animation: `fade-in-up 0.6s ease-out ${branchDelay + 40}ms backwards` }}
      >
        <div className="absolute left-[-24px] w-4 h-4 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-green-600 font-medium">Geslaagd</span>
      </div>

      {/* Qualifying Questions */}
      <TimelineItem animationDelay={qualifyingHeaderDelay} alignDot="top">
        <h4 className="text-xs font-normal text-black uppercase tracking-wide mb-2">
          Kwalificerende vragen
        </h4>
        <DndContext
          sensors={readOnly ? [] : sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleQualifyingDragEnd}
        >
          <SortableContext
            items={qualifyingQuestions.map(q => q._stableKey || q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {qualifyingQuestions.map((question, index) => (
                <SortableQuestionItem 
                  key={question._stableKey || question.id} 
                  question={question} 
                  index={index + 1}
                  variant="qualifying"
                  isHighlighted={highlightedIds.includes(question.id)}
                  animationDelay={qualifyingQuestionsBaseDelay + index * 80}
                  onClick={readOnly ? undefined : onQuestionClick}
                  onDelete={readOnly ? undefined : onDeleteQuestion}
                  readOnly={readOnly}
                />
              ))}
              {!readOnly && (
                <AddQuestionInput 
                  type="qualifying" 
                  onAdd={onAddQuestion}
                  placeholder="Voeg kwalificerende vraag toe..."
                />
              )}
            </div>
          </SortableContext>
        </DndContext>
      </TimelineItem>

      {/* Outcome */}
      <TimelineItem animationDelay={outcomeDelay}>
        <div className="bg-brand-dark-blue rounded-lg p-3 flex items-center gap-2">
          <div className="w-5 h-5 bg-white rounded flex items-center justify-center shrink-0">
            <Image src="/outlook.png" alt="Outlook" width={14} height={14} className="object-contain" />
          </div>
          <p className="text-sm text-white">Plan interview met recruiter</p>
        </div>
      </TimelineItem>

      {/* Update records */}
      <TimelineItem animationDelay={updateRecordsDelay} isLast>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full bg-white">
          <Image src="/salesforc-logo-cloud.png" alt="Salesforce" width={14} height={14} className="object-contain" />
          <span className="text-xs font-medium text-gray-600">Update ATS</span>
        </div>
      </TimelineItem>
    </div>
  );
}

function TimelineItem({ 
  children, 
  animationDelay = 0,
  isLast = false,
  alignDot = 'center'
}: { 
  children: React.ReactNode; 
  animationDelay?: number;
  isLast?: boolean;
  alignDot?: 'top' | 'center';
}) {
  const dotPosition = alignDot === 'top' 
    ? 'top-3' 
    : 'top-1/2 -translate-y-1/2';
  
  return (
    <div 
      className="relative py-3"
      style={{ animation: `fade-in-up 0.6s ease-out ${animationDelay}ms backwards` }}
    >
      {/* Timeline dot */}
      <div className={`absolute left-[-24px] ${dotPosition} w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center`}>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

function TimelineBranch({ 
  condition, 
  outcome,
  icon: Icon,
  animationDelay = 0
}: { 
  condition: string; 
  outcome: string;
  icon: React.ComponentType<{ className?: string }>;
  animationDelay?: number;
}) {
  return (
    <div 
      className="relative py-2 flex items-start ml-8"
      style={{ animation: `fade-in-up 0.6s ease-out ${animationDelay}ms backwards` }}
    >
      {/* T-shaped branch connector */}
      <div className="absolute left-[-56px] top-1/2 -translate-y-1/2 flex items-center z-0">
        <div className="w-4 h-4 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        </div>
        <div className="w-10 border-t-2 border-dashed border-orange-300" />
      </div>
      <div className="relative z-10 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
        <Icon className="w-3.5 h-3.5 text-orange-500" />
        <div>
          <span className="text-xs text-orange-600 font-medium">{condition}: </span>
          <span className="text-xs text-orange-600">{outcome}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ isGenerating = false }: { isGenerating?: boolean }) {
  return (
    <div className="relative pl-6">
      {/* Timeline line skeleton */}
      <div className="absolute left-[7px] top-3 bottom-3 w-px border-l-2 border-dashed border-gray-200" />

      {/* Trigger / Generating indicator */}
      <SkeletonTimelineItem isAnimating={isGenerating} spinnerDot={isGenerating}>
        {isGenerating ? (
          <span className="text-sm text-gray-500">Vragen genereren op basis van vacature...</span>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full">
            <div className="w-3.5 h-3.5 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        )}
      </SkeletonTimelineItem>

      {/* Intro skeleton */}
      <SkeletonTimelineItem isAnimating={isGenerating}>
        <div className={`bg-brand-dark-blue rounded-lg p-3 ${isGenerating ? 'animate-pulse' : ''}`}>
          <div className="h-3 w-12 bg-slate-600 rounded mb-2" />
          <div className="h-4 bg-slate-600 rounded w-3/4" />
        </div>
      </SkeletonTimelineItem>

      {/* Knockout section skeleton */}
      <SkeletonTimelineItem isAnimating={isGenerating} alignDot="top">
        <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
        <div className="space-y-2">
          <SkeletonCard isAnimating={isGenerating} />
          <SkeletonCard isAnimating={isGenerating} />
        </div>
      </SkeletonTimelineItem>

      {/* Qualifying section skeleton */}
      <SkeletonTimelineItem isAnimating={isGenerating} alignDot="top">
        <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
        <div className="space-y-2">
          <SkeletonCard isAnimating={isGenerating} />
          <SkeletonCard isAnimating={isGenerating} />
        </div>
      </SkeletonTimelineItem>

      {/* Outcome skeleton */}
      <SkeletonTimelineItem isAnimating={isGenerating}>
        <div className={`bg-brand-dark-blue rounded-lg p-3 ${isGenerating ? 'animate-pulse' : ''}`}>
          <div className="h-4 bg-slate-600 rounded w-1/2" />
        </div>
      </SkeletonTimelineItem>

      {/* Update records skeleton */}
      <SkeletonTimelineItem isAnimating={isGenerating}>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full ${isGenerating ? 'animate-pulse' : ''}`}>
          <div className="w-3.5 h-3.5 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </SkeletonTimelineItem>
    </div>
  );
}

function SkeletonTimelineItem({ 
  children, 
  isAnimating = false,
  alignDot = 'center',
  spinnerDot = false
}: { 
  children: React.ReactNode; 
  isAnimating?: boolean;
  alignDot?: 'top' | 'center';
  spinnerDot?: boolean;
}) {
  const dotPosition = alignDot === 'top' 
    ? 'top-3' 
    : 'top-1/2 -translate-y-1/2';
    
  return (
    <div className="relative py-3">
      {/* Timeline dot skeleton */}
      {spinnerDot ? (
        <div className={`absolute left-[-24px] ${dotPosition} w-4 h-4 bg-white border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin`} />
      ) : (
        <div className={`absolute left-[-24px] ${dotPosition} w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-200 ${isAnimating ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </div>
  );
}

function SkeletonCard({ isAnimating = false }: { isAnimating?: boolean }) {
  return (
    <div className={`bg-gray-100 rounded-lg p-2 ${isAnimating ? 'animate-pulse' : ''}`}>
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>
  );
}

// New question highlight styles: slide-in + blue bg + soft pulse
const NEW_QUESTION_HIGHLIGHT_CLASSES = 'bg-blue-100 animate-[slide-in-right_1.2s_cubic-bezier(0.16,1,0.3,1)_0s_backwards]';
// Updated question highlight styles: amber bg + soft pulse only (no slide-in)
const UPDATED_QUESTION_HIGHLIGHT_CLASSES = 'bg-amber-100 animate-[soft-pulse_3s_ease-in-out_infinite]';
const NORMAL_QUESTION_CLASSES = 'bg-gray-100 transition-all duration-500';

function AddQuestionInput({ 
  type, 
  onAdd,
  placeholder = 'Voeg een vraag toe...'
}: { 
  type: 'knockout' | 'qualifying';
  onAdd?: (text: string, type: 'knockout' | 'qualifying', idealAnswer?: string) => void;
  placeholder?: string;
}) {
  const [questionText, setQuestionText] = useState('');
  const [idealAnswer, setIdealAnswer] = useState('');
  const [step, setStep] = useState<'question' | 'ideal_answer'>('question');
  const [isFocused, setIsFocused] = useState(false);
  const idealAnswerInputRef = useRef<HTMLInputElement>(null);

  const handleQuestionSubmit = () => {
    if (!questionText.trim()) return;
    
    if (type === 'knockout') {
      // For knockout questions, submit immediately
      onAdd?.(questionText.trim(), type);
      setQuestionText('');
    } else {
      // For qualifying questions, move to step 2
      setStep('ideal_answer');
      // Focus the ideal answer input after a short delay
      setTimeout(() => idealAnswerInputRef.current?.focus(), 50);
    }
  };

  const handleIdealAnswerSubmit = () => {
    // Submit with whatever ideal answer is provided (can be empty)
    onAdd?.(questionText.trim(), type, idealAnswer.trim() || undefined);
    // Reset state
    setQuestionText('');
    setIdealAnswer('');
    setStep('question');
  };

  const handleCancel = () => {
    setQuestionText('');
    setIdealAnswer('');
    setStep('question');
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'question') {
        handleQuestionSubmit();
      } else {
        handleIdealAnswerSubmit();
      }
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const canSubmitQuestion = questionText.trim().length > 0;

  // Step 1: Question input
  if (step === 'question') {
    return (
      <div 
        className={`rounded-lg p-2 flex items-center gap-2 border-2 border-dashed transition-all duration-200 ${
          isFocused 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="shrink-0 p-0.5 -ml-1">
          <Plus className={`w-4 h-4 ${isFocused ? 'text-blue-400' : 'text-gray-300'}`} />
        </div>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay blur to allow button click
            setTimeout(() => setIsFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
        />
        {isFocused && (
          <button
            type="button"
            onClick={handleQuestionSubmit}
            disabled={!canSubmitQuestion}
            className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-200 ${
              canSubmitQuestion 
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>{type === 'qualifying' ? 'next' : 'add'}</span>
          </button>
        )}
      </div>
    );
  }

  // Step 2: Ideal answer input (only for qualifying questions)
  return (
    <div className="rounded-lg border-2 border-blue-300 bg-blue-50 overflow-hidden transition-all duration-200">
      {/* Show the question being added */}
      <div className="px-3 py-2 border-b border-blue-200 bg-blue-100/50">
        <p className="text-xs text-blue-600 font-medium mb-0.5">Nieuwe vraag:</p>
        <p className="text-sm text-gray-700">{questionText}</p>
      </div>
      {/* Ideal answer input */}
      <div className="p-2 flex items-center gap-2">
        <input
          ref={idealAnswerInputRef}
          type="text"
          value={idealAnswer}
          onChange={(e) => setIdealAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Beschrijf het ideale antwoord... (optioneel)"
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
          autoFocus
        />
        <button
          type="button"
          onClick={handleCancel}
          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
        >
          cancel
        </button>
        <button
          type="button"
          onClick={handleIdealAnswerSubmit}
          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-colors"
        >
          <Check className="w-3 h-3" />
          <span>add</span>
        </button>
      </div>
    </div>
  );
}

function SortableQuestionItem({ 
  question, 
  index, 
  variant,
  isHighlighted = false,
  animationDelay = 0,
  onClick,
  onDelete,
  readOnly = false,
}: { 
  question: GeneratedQuestion; 
  index: number;
  variant: 'knockout' | 'qualifying';
  isHighlighted?: boolean;
  animationDelay?: number;
  onClick?: (question: GeneratedQuestion, index: number) => void;
  onDelete?: (questionId: string) => void;
  readOnly?: boolean;
}) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showChangeLabel, setShowChangeLabel] = useState(isHighlighted);
  const [showHighlightBg, setShowHighlightBg] = useState(question.changeStatus === 'new' || question.changeStatus === 'updated');
  const [isIdealAnswerExpanded, setIsIdealAnswerExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._stableKey || question.id });

  // Mark animation as complete after it finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, animationDelay + 600); // animation delay + animation duration
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // When isHighlighted becomes true, show the label and start 5s timer
  useEffect(() => {
    if (isHighlighted) {
      setShowChangeLabel(true);
      const timer = setTimeout(() => {
        setShowChangeLabel(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  // Fade out highlight background after 5 seconds for new/updated questions
  useEffect(() => {
    if (question.changeStatus === 'new' || question.changeStatus === 'updated') {
      setShowHighlightBg(true);
      const timer = setTimeout(() => {
        setShowHighlightBg(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [question.changeStatus]);

  // Determine highlight class based on changeStatus
  const isNew = question.changeStatus === 'new';
  
  // Skip the initial fade-in-up animation only for 'new' questions
  // because the slide-in-right animation handles the entrance
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...((hasAnimated || isNew) ? {} : { animation: `fade-in-up 0.6s ease-out ${animationDelay}ms backwards` }),
  };

  // Use appropriate highlight styles based on changeStatus and showHighlightBg
  const baseClasses = isNew
    ? (showHighlightBg ? NEW_QUESTION_HIGHLIGHT_CLASSES : NORMAL_QUESTION_CLASSES)
    : (question.changeStatus === 'updated' && showHighlightBg)
    ? UPDATED_QUESTION_HIGHLIGHT_CLASSES
    : NORMAL_QUESTION_CLASSES;

  const hasIdealAnswer = variant === 'qualifying' && question.idealAnswer;

  const handleIdealAnswerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsIdealAnswerExpanded(!isIdealAnswerExpanded);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(question, index);
  };

  const handleCardClick = () => {
    // For qualifying questions with ideal answer, clicking the card toggles collapse
    if (hasIdealAnswer) {
      setIsIdealAnswerExpanded(!isIdealAnswerExpanded);
    }
  };

  // Determine label text and styling based on change_status
  const changeStatus = question.changeStatus;
  const labelConfig = changeStatus === 'new' 
    ? { text: 'new', className: 'text-blue-600 bg-blue-200' }
    : changeStatus === 'updated'
    ? { text: 'updated', className: 'text-amber-600 bg-amber-200' }
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg p-2 group ${baseClasses} ${isDragging ? 'opacity-60 shadow-lg z-50' : ''} ${hasIdealAnswer ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-2">
        {!readOnly && (
          <button
            className="shrink-0 p-0.5 -ml-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none self-center"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <p className="text-sm text-gray-700 flex-1">{question.text}</p>
          {/* Action icons - visible on hover, hidden in readOnly mode */}
          {!readOnly && (
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Chat icon - ask about this question */}
              {onClick && (
                <button
                  onClick={handleChatClick}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Vraag stellen over deze vraag"
                >
                  <MessagesSquare className="w-4 h-4" />
                </button>
              )}
              {/* Edit icon - edit this question (functionality to be added) */}
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Vraag bewerken"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {/* Delete icon - remove this question */}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(question.id);
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Vraag verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {/* Chevron for qualifying questions - always visible */}
          {hasIdealAnswer && (
            <button
              onClick={handleIdealAnswerToggle}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Ideaal antwoord"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isIdealAnswerExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          {/* Change label (new/updated) - rightmost item */}
          {showChangeLabel && labelConfig && (
            <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded animate-[pulse-opacity_2s_ease-in-out_infinite] transition-opacity duration-300 ${labelConfig.className}`}>
              {labelConfig.text}
            </span>
          )}
        </div>
      </div>
      
      {/* Collapsible ideal answer section */}
      {hasIdealAnswer && (
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            isIdealAnswerExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="ml-6 pl-2 border-l-2 border-amber-200">
            <p className="text-sm text-gray-500 leading-relaxed">{question.idealAnswer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

