'use client';

import { useState } from 'react';
import { 
  MessageCircle, 
  CheckCircle, 
  ListChecks, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Clock,
  Users,
  Zap,
  Globe,
  Plus,
  GripVertical,
  X,
  UserX,
  Pencil,
  Trash2,
  GitBranch,
  CornerDownRight,
  ArrowRight,
  CircleDot,
  Circle,
  Settings,
  Play,
  XCircle,
  Car,
  CalendarDays,
  AlertCircle
} from 'lucide-react';

// Dummy question data (linear questions for legacy variants)
const dummyQuestions = {
  knockout: [
    { id: 'k1', text: 'Ben je 18 jaar of ouder?', icon: CheckCircle },
    { id: 'k2', text: 'Heb je een geldig rijbewijs B?', icon: CheckCircle },
    { id: 'k3', text: 'Ben je beschikbaar voor weekendwerk?', icon: CheckCircle },
  ],
  qualifying: [
    { id: 'q1', text: 'Hoeveel jaar ervaring heb je in de retail?', idealAnswer: 'Minimaal 2 jaar ervaring in een klantgerichte functie' },
    { id: 'q2', text: 'Wat is je grootste sterkte in klantenservice?', idealAnswer: 'Geduld, empathie en probleemoplossend vermogen' },
    { id: 'q3', text: 'Hoe ga je om met drukte tijdens piekuren?', idealAnswer: 'Prioriteiten stellen, kalm blijven, team ondersteunen' },
  ],
};

// Complex branching question data (based on user's example)
interface BranchQuestion {
  id: string;
  text: string;
  type: 'knockout' | 'qualifying';
  onYes?: BranchAction;
  onNo?: BranchAction;
  responseText?: string; // Optional text to say before next action
}

interface BranchAction {
  type: 'next' | 'fail' | 'followup';
  questionId?: string; // For followup type
  responseText?: string; // Text to say
}

// The complex branching example from the user
const complexBranchingQuestion: BranchQuestion = {
  id: 'k2',
  text: 'Kan je werken in een 2-ploegensysteem (vroege en late shift)?',
  type: 'knockout',
  onNo: { type: 'fail' },
  onYes: { type: 'followup', questionId: 'k2-1' },
};

const followUpQuestions: BranchQuestion[] = [
  {
    id: 'k2-1',
    text: 'En ben je ook beschikbaar om in het weekend te werken indien nodig?',
    type: 'knockout',
    onYes: { type: 'followup', questionId: 'k2-2' },
    onNo: { type: 'followup', questionId: 'k2-1b' },
  },
  {
    id: 'k2-1b',
    text: 'Ik begrijp het. Zou het eventueel wel mogelijk zijn tijdens het hoogseizoen, bijvoorbeeld in de zomermaanden?',
    type: 'knockout',
    onYes: { 
      type: 'followup', 
      questionId: 'k2-2',
      responseText: 'Dat is al iets, we kunnen daar rekening mee houden.'
    },
    onNo: { type: 'fail' },
  },
  {
    id: 'k2-2',
    text: 'Heb je eigen vervoer om op wisselende uren op het werk te geraken?',
    type: 'knockout',
    onYes: { type: 'next' },
    onNo: { type: 'followup', questionId: 'k2-2b' },
  },
  {
    id: 'k2-2b',
    text: 'Kan je rekenen op openbaar vervoer of carpoolen met collega\'s?',
    type: 'knockout',
    onYes: { 
      type: 'next',
      responseText: 'Prima!'
    },
    onNo: { type: 'fail' },
  },
];

// ============================================
// DESIGN VARIANT A: Classic Two-Column Cards
// ============================================
function DesignVariantA() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant A: Classic Two-Column</h2>
        <p className="text-sm text-gray-500 mt-1">Traditional separated sections</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Knockout Questions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Knockout vragen</h3>
              <p className="text-sm text-gray-500">Must-have criteria</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {dummyQuestions.knockout.map((q, idx) => (
              <div 
                key={q.id}
                className="group flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm text-gray-700 leading-relaxed">{q.text}</p>
                <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Qualifying Questions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Kwalificatie vragen</h3>
              <p className="text-sm text-gray-500">Deeper evaluation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {dummyQuestions.qualifying.map((q, idx) => (
              <div 
                key={q.id}
                className="group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">{q.text}</p>
                    <p className="text-xs text-gray-400 mt-2 italic">"{q.idealAnswer}"</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT B: Workflow Steps (Inspired by Operator)
// ============================================
function DesignVariantB() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant B: Workflow Steps</h2>
        <p className="text-sm text-gray-500 mt-1">Operator-inspired sequential flow</p>
      </div>
      
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-900">Kassamedewerker Interview</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors">
              Productivity
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Trigger badge */}
        <div className="flex justify-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Nieuwe sollicitatie</span>
          </div>
        </div>

        {/* Steps */}
        <div className="px-5 pb-5 space-y-3">
          {/* Intro step */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">Begin met een persoonlijke begroeting en leg het interview proces uit.</p>
            </div>
          </div>

          {/* Knockout questions */}
          {dummyQuestions.knockout.map((q, idx) => (
            <div 
              key={q.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{q.text}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600">
                  Knockout
                </span>
              </div>
            </div>
          ))}

          {/* Qualifying questions */}
          {dummyQuestions.qualifying.map((q, idx) => (
            <div 
              key={q.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{q.text}</p>
                <p className="text-xs text-gray-400 mt-1.5">Ideal: {q.idealAnswer}</p>
              </div>
            </div>
          ))}

          {/* Add step button */}
          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Create Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT C: Unified Flow with Timeline
// ============================================
function DesignVariantC() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant C: Timeline Flow</h2>
        <p className="text-sm text-gray-500 mt-1">Connected steps with visual timeline</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Interview Flow</h3>
            <p className="text-sm text-gray-500 mt-1">6 vragen in totaal - ~5 min</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Sparkles className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

          {/* Start node */}
          <div className="relative flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center z-10">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <div className="flex-1 py-3">
              <p className="font-medium text-gray-900">Interview gestart</p>
              <p className="text-sm text-gray-500">Kandidaat ontvangt begroeting</p>
            </div>
          </div>

          {/* Knockout section */}
          <div className="relative mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center z-10">
                <Zap className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600">Knockout vragen</p>
              </div>
            </div>
            
            <div className="ml-14 space-y-2">
              {dummyQuestions.knockout.map((q, idx) => (
                <div 
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-sm text-gray-700">{q.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Decision node */}
          <div className="relative flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg rotate-45 bg-yellow-100 flex items-center justify-center z-10">
              <CheckCircle className="w-4 h-4 text-yellow-600 -rotate-45" />
            </div>
            <div className="flex-1 py-3">
              <p className="font-medium text-gray-900">Knockout check</p>
              <p className="text-sm text-gray-500">Voldoet aan minimale eisen?</p>
            </div>
          </div>

          {/* Qualifying section */}
          <div className="relative mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center z-10">
                <ListChecks className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-600">Kwalificatie vragen</p>
              </div>
            </div>
            
            <div className="ml-14 space-y-2">
              {dummyQuestions.qualifying.map((q, idx) => (
                <div 
                  key={q.id}
                  className="group p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                      {idx + 4}
                    </span>
                    <p className="flex-1 text-sm text-gray-700">{q.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* End node */}
          <div className="relative flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center z-10">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
            </div>
            <div className="flex-1 py-3">
              <p className="font-medium text-gray-900">Interview voltooid</p>
              <p className="text-sm text-gray-500">Resultaten beschikbaar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT D: Compact Card Grid
// ============================================
function DesignVariantD() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant D: Compact Cards</h2>
        <p className="text-sm text-gray-500 mt-1">Dense but scannable grid layout</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Kassamedewerker</h3>
              <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~5 min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  6 vragen
                </span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
            Publiceren
          </button>
        </div>

        {/* Section labels */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-gray-600">Knockout ({dummyQuestions.knockout.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-gray-600">Kwalificatie ({dummyQuestions.qualifying.length})</span>
          </div>
        </div>

        {/* Questions grid */}
        <div className="grid grid-cols-2 gap-3">
          {dummyQuestions.knockout.map((q, idx) => (
            <div 
              key={q.id}
              className="group relative p-4 rounded-xl border-2 border-red-100 bg-red-50/30 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pr-4">{q.text}</p>
              </div>
              <button className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
          
          {dummyQuestions.qualifying.map((q, idx) => (
            <div 
              key={q.id}
              className="group relative p-4 rounded-xl border-2 border-blue-100 bg-blue-50/30 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  {idx + 4}
                </span>
                <div className="flex-1 pr-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{q.text}</p>
                </div>
              </div>
              <button className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blue-100 transition-all">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT E: Minimal List (Dashboard Focus)
// ============================================
function DesignVariantE() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant E: Minimal List</h2>
        <p className="text-sm text-gray-500 mt-1">Clean, scannable with clear hierarchy</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Interview vragen</h3>
              <p className="text-sm text-gray-500 mt-0.5">6 vragen - geschatte duur 5 minuten</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Sparkles className="w-4 h-4" />
              AI aanpassen
            </button>
          </div>
        </div>

        {/* Knockout Section */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h4 className="text-sm font-semibold text-gray-900">Knockout vragen</h4>
            <span className="text-xs text-gray-400">Ja/nee vereist</span>
          </div>
          <div className="space-y-2">
            {dummyQuestions.knockout.map((q, idx) => (
              <div 
                key={q.id}
                className="group flex items-center gap-4 p-3 -mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-400 w-4">{idx + 1}</span>
                <p className="flex-1 text-sm text-gray-700">{q.text}</p>
                <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Qualifying Section */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h4 className="text-sm font-semibold text-gray-900">Kwalificatie vragen</h4>
            <span className="text-xs text-gray-400">Open antwoord</span>
          </div>
          <div className="space-y-2">
            {dummyQuestions.qualifying.map((q, idx) => (
              <div 
                key={q.id}
                className="group flex items-center gap-4 p-3 -mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-400 w-4">{idx + 4}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{q.text}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Plus className="w-4 h-4" />
              Vraag toevoegen
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT F: Timeline + Minimal (Full Flow)
// ============================================
function DesignVariantF() {
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant F: Timeline + Minimal</h2>
        <p className="text-sm text-gray-500 mt-1">Complete flow with all functional elements</p>
      </div>

      {/* Main Flow Container */}
      <div className="relative pl-6">
        {/* Vertical Timeline Line */}
        <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-200" />

        {/* 1. TRIGGER - Nieuwe sollicitatie */}
        <div className="relative flex items-start gap-4 pb-6">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c4e456] text-gray-900">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Nieuwe sollicitatie</span>
            </div>
          </div>
        </div>

        {/* 2. INTRO CARD */}
        <div className="relative flex items-start gap-4 pb-6">
          <div className="relative z-10 w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="bg-[#1e3a5f] rounded-xl p-4 text-white">
              <p className="text-xs text-white/60 mb-1">Intro</p>
              <p className="text-sm leading-relaxed">
                Begroet kandidaat en vraag of hij/zij nu wil starten met het interview. Geef aan hoelang het duurt.
              </p>
            </div>
          </div>
        </div>

        {/* 3. KNOCKOUT VRAGEN Section */}
        <div className="relative flex items-start gap-4 pb-2">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Knock-out vragen</p>
          </div>
        </div>

        {/* Knockout Questions List */}
        <div className="relative pl-10 pb-6 space-y-2">
          {dummyQuestions.knockout.map((q) => (
            <div 
              key={q.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <p className="flex-1 text-sm text-gray-700">{q.text}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
          ))}
        </div>

        {/* 4. KNOCKOUT DECISION - Branch Point */}
        <div className="relative flex items-start gap-4 pb-6">
          {/* Dashed line branching off */}
          <div className="absolute left-[11px] top-3 w-8 border-t-2 border-dashed border-red-300" />
          <div className="relative z-10 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 -mt-0.5">
            {/* Fail branch card */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-red-200 bg-white">
              <UserX className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-600">Niet geslaagd: Interesse in andere matches?</span>
            </div>
          </div>
        </div>

        {/* 5. GESLAAGD - Success Continuation */}
        <div className="relative flex items-start gap-4 pb-2">
          <div className="relative z-10 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 -mt-0.5">
            <p className="text-sm font-medium text-green-600">Geslaagd</p>
          </div>
        </div>

        {/* 6. KWALIFICERENDE VRAGEN Section */}
        <div className="relative flex items-start gap-4 pb-2 pt-4">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kwalificerende vragen</p>
          </div>
        </div>

        {/* Qualifying Questions List - Expandable */}
        <div className="relative pl-10 pb-6 space-y-2">
          {dummyQuestions.qualifying.map((q) => (
            <div 
              key={q.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <button
                onClick={() => toggleQuestion(q.id)}
                className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
              >
                <p className="flex-1 text-sm text-gray-700">{q.text}</p>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-300 transition-transform ${
                    expandedQuestions.includes(q.id) ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {expandedQuestions.includes(q.id) && (
                <div className="px-3 pb-3 pt-0">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Ideaal antwoord:</p>
                    <p className="text-sm text-gray-600">{q.idealAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 7. FINAL ACTION - Plan interview with Outlook */}
        <div className="relative flex items-start gap-4 pb-6">
          <div className="relative z-10 w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="bg-[#1e3a5f] rounded-xl p-4 text-white flex items-center gap-3">
              {/* Outlook icon */}
              <div className="w-6 h-6 rounded flex items-center justify-center bg-[#0078d4]">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 3C4.239 3 2 5.239 2 8v8c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V8c0-2.761-2.239-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v.586l-8 5.714-8-5.714V8c0-1.654 1.346-3 3-3zm-3 5.414l8 5.714 8-5.714V16c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3v-5.586z"/>
                </svg>
              </div>
              <span className="text-sm font-medium">Plan interview met recruiter</span>
            </div>
          </div>
        </div>

        {/* 8. UPDATE ATS Action with Salesforce */}
        <div className="relative flex items-start gap-4">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
              {/* Salesforce icon */}
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00a1e0]">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.884-.06-1.305-.165a3.975 3.975 0 01-3.51 2.13 4.017 4.017 0 01-2.115-.6 4.246 4.246 0 01-3.616 2.025c-2.22 0-4.05-1.665-4.29-3.81A4.453 4.453 0 010 11.67c0-2.475 1.98-4.485 4.44-4.485.72 0 1.41.165 2.01.465a4.18 4.18 0 013.556-2.235z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Update ATS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex items-center justify-between">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <Plus className="w-4 h-4" />
          Stap toevoegen
        </button>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Preview
          </button>
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Publiceren
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT G: Minimal + Subtle Timeline
// ============================================
function DesignVariantG() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant G: Minimal Timeline</h2>
        <p className="text-sm text-gray-500 mt-1">Clean list with subtle flow indicator</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Interview flow</h3>
              <p className="text-sm text-gray-500 mt-0.5">6 vragen - geschatte duur 5 minuten</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Sparkles className="w-4 h-4" />
              AI aanpassen
            </button>
          </div>
        </div>

        {/* Flow Content */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-100" />

          {/* Trigger */}
          <div className="relative px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-gray-200 border-2 border-white" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Trigger</span>
              <span className="text-sm text-gray-600">Nieuwe sollicitatie ontvangen</span>
            </div>
          </div>

          {/* Intro */}
          <div className="relative px-6 py-4 border-b border-gray-50">
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-gray-300 border-2 border-white mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Intro</span>
                <p className="text-sm text-gray-700 mt-1">Begroet kandidaat en vraag of hij/zij nu wil starten. Geef aan hoelang het duurt.</p>
              </div>
            </div>
          </div>

          {/* Knockout Section */}
          <div className="relative px-6 py-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-red-400 border-2 border-white mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Knockout vragen</span>
                  <span className="text-xs text-gray-400">3 vragen</span>
                </div>
                <div className="space-y-1">
                  {dummyQuestions.knockout.map((q, idx) => (
                    <div 
                      key={q.id}
                      className="group flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-gray-300 w-4">{idx + 1}</span>
                      <p className="flex-1 text-sm text-gray-700">{q.text}</p>
                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors" title="Chat">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Knockout Failed Branch */}
          <div className="relative px-6 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-4 pl-8">
              <div className="w-px h-4 border-l border-dashed border-gray-300" />
              <span className="text-xs text-red-500">Niet geslaagd</span>
              <span className="text-xs text-gray-400">-</span>
              <span className="text-sm text-gray-500">Interesse in andere matches?</span>
            </div>
          </div>

          {/* Success indicator */}
          <div className="relative px-6 py-3 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
              <span className="text-xs font-medium text-green-600">Geslaagd - doorgaan</span>
            </div>
          </div>

          {/* Qualifying Section */}
          <div className="relative px-6 py-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-blue-400 border-2 border-white mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Kwalificatie vragen</span>
                  <span className="text-xs text-gray-400">3 vragen</span>
                </div>
                <div className="space-y-1">
                  {dummyQuestions.qualifying.map((q, idx) => (
                    <div 
                      key={q.id}
                      className="group flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-gray-300 w-4">{idx + 4}</span>
                      <p className="flex-1 text-sm text-gray-700">{q.text}</p>
                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors" title="Chat">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Final Actions - Outlook Calendar */}
          <div className="relative px-6 py-4 border-b border-gray-50">
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-gray-300 border-2 border-white mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Afsluiting</span>
                <div className="flex items-center gap-2 mt-1">
                  {/* Outlook icon */}
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-[#0078d4]">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 3C4.239 3 2 5.239 2 8v8c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V8c0-2.761-2.239-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v.586l-8 5.714-8-5.714V8c0-1.654 1.346-3 3-3zm-3 5.414l8 5.714 8-5.714V16c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3v-5.586z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Plan interview met recruiter</span>
                </div>
              </div>
            </div>
          </div>

          {/* ATS Update - Salesforce */}
          <div className="relative px-6 py-4">
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-4 h-4 rounded-full bg-gray-200 border-2 border-white mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Integratie</span>
                <div className="flex items-center gap-2 mt-1">
                  {/* Salesforce icon */}
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00a1e0]">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.884-.06-1.305-.165a3.975 3.975 0 01-3.51 2.13 4.017 4.017 0 01-2.115-.6 4.246 4.246 0 01-3.616 2.025c-2.22 0-4.05-1.665-4.29-3.81A4.453 4.453 0 010 11.67c0-2.475 1.98-4.485 4.44-4.485.72 0 1.41.165 2.01.465a4.18 4.18 0 013.556-2.235z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Update ATS met resultaten</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Plus className="w-4 h-4" />
              Stap toevoegen
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT H: Nested Accordion (Sub-questions inline)
// ============================================
function DesignVariantH() {
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>(['k2']);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant H: Nested Accordion</h2>
        <p className="text-sm text-gray-500 mt-1">Sub-questions expand inline under parent question</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Knockout vragen</h3>
              <p className="text-sm text-gray-500 mt-0.5">3 vragen met conditionele logica</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="divide-y divide-gray-100">
          {/* Simple knockout question */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">1</span>
              <p className="flex-1 text-sm text-gray-700">Ben je in het bezit van een geldige Belgische werkvergunning?</p>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>

          {/* Complex knockout question with branches */}
          <div className="px-6 py-4">
            <button
              onClick={() => toggleQuestion('k2')}
              className="w-full flex items-center gap-3 text-left"
            >
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">2</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-700">{complexBranchingQuestion.text}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                    <GitBranch className="w-3 h-3" />
                    4 opvolgvragen
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedQuestions.includes('k2') ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded sub-questions */}
            {expandedQuestions.includes('k2') && (
              <div className="mt-4 ml-9 space-y-3">
                {/* Branch indicator for main question */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="w-px h-4 bg-gray-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-600 mb-1">Als JA</p>
                    <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                      <p className="text-sm text-gray-700">Ben je beschikbaar om in het weekend te werken indien nodig?</p>
                      
                      {/* Nested branches */}
                      <div className="mt-3 ml-2 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-green-600 font-medium">JA</p>
                            <p className="text-xs text-gray-500 mt-0.5">Vraag over eigen vervoer</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                            <XCircle className="w-2.5 h-2.5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-orange-600 font-medium">NEE</p>
                            <p className="text-xs text-gray-500 mt-0.5">Vraag over hoogseizoen (zomermaanden)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-3 h-3 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-600 mb-1">Als NEE</p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                      <UserX className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">Niet geslaagd</span>
                    </div>
                  </div>
                </div>

                {/* Add branch button */}
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Opvolgvraag toevoegen
                </button>
              </div>
            )}
          </div>

          {/* Third simple question */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
              <p className="flex-1 text-sm text-gray-700">Woon je in de regio Diest of kan je daar vlot geraken?</p>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Plus className="w-4 h-4" />
              Vraag toevoegen
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT I: Visual Branch Tree
// ============================================
function DesignVariantI() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant I: Visual Branch Tree</h2>
        <p className="text-sm text-gray-500 mt-1">Tree structure showing all paths visually</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Root question */}
        <div className="relative">
          {/* Main question card */}
          <div className="relative z-10 max-w-md mx-auto">
            <div className="bg-[#1e3a5f] rounded-xl p-4 text-white">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
                <div className="flex-1">
                  <p className="text-xs text-white/60 mb-1">Knockout vraag</p>
                  <p className="text-sm leading-relaxed">{complexBranchingQuestion.text}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Branch lines */}
          <div className="flex justify-center mt-4">
            <div className="flex items-start gap-16">
              {/* NO branch */}
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-gray-300" />
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <XCircle className="w-3 h-3" />
                  NEE
                </div>
                <div className="w-px h-8 bg-gray-300" />
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border-2 border-dashed border-red-200">
                  <UserX className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-600 font-medium">Niet geslaagd</span>
                </div>
              </div>

              {/* YES branch */}
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-gray-300" />
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  JA
                </div>
                <div className="w-px h-8 bg-gray-300" />
                
                {/* Follow-up question 1 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm max-w-xs">
                  <p className="text-xs text-gray-500 mb-1">Opvolgvraag 1</p>
                  <p className="text-sm text-gray-700">Ben je beschikbaar om in het weekend te werken?</p>
                </div>

                {/* Further branching */}
                <div className="flex items-start gap-12 mt-4">
                  {/* NO to weekend */}
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                      NEE
                    </div>
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 max-w-[180px]">
                      <p className="text-xs text-orange-700">Hoogseizoen vraag</p>
                    </div>
                  </div>

                  {/* YES to weekend */}
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      JA
                    </div>
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="bg-white rounded-lg p-3 border border-gray-200 max-w-[180px]">
                      <p className="text-xs text-gray-500 mb-0.5">Opvolgvraag 2</p>
                      <p className="text-xs text-gray-700">Eigen vervoer?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span className="text-xs text-gray-500">Doorgaan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
              <span className="text-xs text-gray-500">Alternatief pad</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span className="text-xs text-gray-500">Niet geslaagd</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT J: Timeline with Inline Branches
// ============================================
function DesignVariantJ() {
  const [expandedBranch, setExpandedBranch] = useState<string | null>('k2');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant J: Timeline + Inline Branches</h2>
        <p className="text-sm text-gray-500 mt-1">Current timeline style with branch indicators</p>
      </div>

      {/* Main Flow Container */}
      <div className="relative pl-6">
        {/* Vertical Timeline Line */}
        <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-200" />

        {/* 1. TRIGGER */}
        <div className="relative flex items-start gap-4 pb-6">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c4e456] text-gray-900">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Nieuwe sollicitatie</span>
            </div>
          </div>
        </div>

        {/* KNOCKOUT VRAGEN Section Header */}
        <div className="relative flex items-start gap-4 pb-2">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Knock-out vragen</p>
          </div>
        </div>

        {/* Knockout Questions List */}
        <div className="relative pl-10 pb-4 space-y-2">
          {/* Simple question 1 */}
          <div className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
            <p className="flex-1 text-sm text-gray-700">Ben je in het bezit van een geldige Belgische werkvergunning?</p>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
          </div>

          {/* Complex question with branches */}
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedBranch(expandedBranch === 'k2' ? null : 'k2')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-700">{complexBranchingQuestion.text}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  <GitBranch className="w-3 h-3" />
                  Logica
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedBranch === 'k2' ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded branch view */}
            {expandedBranch === 'k2' && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="space-y-3">
                  {/* YES Path */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shrink-0">
                      <CheckCircle className="w-3 h-3" />
                      JA
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Opvolgvraag: "Ben je beschikbaar voor weekendwerk?"</span>
                      </div>
                      {/* Nested branches indicator */}
                      <div className="mt-2 ml-6 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" /> Vraag over vervoer
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-orange-500" /> Vraag over hoogseizoen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* NO Path */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold shrink-0">
                      <XCircle className="w-3 h-3" />
                      NEE
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-600">Niet geslaagd</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit button */}
                <button className="mt-4 flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Logica bewerken
                </button>
              </div>
            )}
          </div>

          {/* Simple question 3 */}
          <div className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
            <p className="flex-1 text-sm text-gray-700">Woon je in de regio Diest of kan je daar vlot geraken?</p>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>

        {/* Knockout Decision */}
        <div className="relative flex items-start gap-4 pb-6">
          <div className="absolute left-[11px] top-3 w-8 border-t-2 border-dashed border-red-300" />
          <div className="relative z-10 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-red-200 bg-white">
              <UserX className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-600">Niet geslaagd: Interesse in andere matches?</span>
            </div>
          </div>
        </div>

        {/* Geslaagd */}
        <div className="relative flex items-start gap-4 pb-4">
          <div className="relative z-10 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 -mt-0.5">
            <p className="text-sm font-medium text-green-600">Geslaagd</p>
          </div>
        </div>

        {/* KWALIFICERENDE VRAGEN */}
        <div className="relative flex items-start gap-4 pb-2">
          <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 -mt-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kwalificerende vragen</p>
          </div>
        </div>

        <div className="relative pl-10 pb-6 space-y-2">
          {dummyQuestions.qualifying.map((q) => (
            <div 
              key={q.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <p className="flex-1 text-sm text-gray-700">{q.text}</p>
              <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex items-center justify-between">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <Plus className="w-4 h-4" />
          Stap toevoegen
        </button>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Preview
          </button>
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Publiceren
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT K: Detail Pane (Side Panel Editor)
// ============================================
function DesignVariantK() {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>('k2');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant K: Side Panel Editor</h2>
        <p className="text-sm text-gray-500 mt-1">Select question to edit logic in detail pane</p>
      </div>

      <div className="flex gap-6">
        {/* Questions List */}
        <div className="w-1/2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Knockout vragen</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {/* Question 1 */}
            <button
              onClick={() => setSelectedQuestion('k1')}
              className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${selectedQuestion === 'k1' ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">1</span>
                <p className="flex-1 text-sm text-gray-700">Ben je in het bezit van een geldige Belgische werkvergunning?</p>
              </div>
            </button>

            {/* Question 2 - Complex */}
            <button
              onClick={() => setSelectedQuestion('k2')}
              className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${selectedQuestion === 'k2' ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">2</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{complexBranchingQuestion.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                      <GitBranch className="w-3 h-3" />
                      4 opvolgvragen
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Question 3 */}
            <button
              onClick={() => setSelectedQuestion('k3')}
              className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${selectedQuestion === 'k3' ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
                <p className="flex-1 text-sm text-gray-700">Woon je in de regio Diest of kan je daar vlot geraken?</p>
              </div>
            </button>
          </div>
        </div>

        {/* Detail Pane */}
        <div className="w-1/2 bg-white rounded-2xl shadow-sm border border-gray-100">
          {selectedQuestion === 'k2' ? (
            <>
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Vraag logica bewerken</h3>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Main question */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Vraag</label>
                  <textarea 
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    defaultValue={complexBranchingQuestion.text}
                  />
                </div>

                {/* Branches */}
                <div className="space-y-4">
                  {/* YES branch */}
                  <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-green-700">Als JA</span>
                    </div>
                    <div className="ml-7">
                      <select className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white">
                        <option>Stel opvolgvraag</option>
                        <option>Ga naar volgende vraag</option>
                        <option>Markeer als geslaagd</option>
                      </select>
                      <div className="mt-3 p-3 rounded-lg bg-white border border-gray-200">
                        <label className="block text-xs text-gray-500 mb-1">Opvolgvraag</label>
                        <input 
                          type="text"
                          className="w-full p-2 rounded border border-gray-200 text-sm"
                          defaultValue="Ben je beschikbaar om in het weekend te werken?"
                        />
                        {/* Nested branch indicator */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <GitBranch className="w-3 h-3" />
                          <span>Deze vraag heeft ook conditionele logica</span>
                          <button className="text-blue-500 hover:underline">Bewerken</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NO branch */}
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <XCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-red-700">Als NEE</span>
                    </div>
                    <div className="ml-7">
                      <select className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white">
                        <option>Markeer als niet geslaagd</option>
                        <option>Stel opvolgvraag</option>
                        <option>Ga naar volgende vraag</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Optional response */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Optioneel: tekst voor opvolgvraag
                  </label>
                  <input 
                    type="text"
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm"
                    placeholder="bijv. 'Dat is al iets, we kunnen daar rekening mee houden.'"
                  />
                </div>

                <button className="w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                  Opslaan
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Settings className="w-8 h-8 mb-2" />
              <p className="text-sm">Selecteer een vraag om de logica te bewerken</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT L: Flowchart Nodes
// ============================================
function DesignVariantL() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant L: Flowchart Nodes</h2>
        <p className="text-sm text-gray-500 mt-1">Node-based editor like a flowchart tool</p>
      </div>

      <div className="bg-gray-100 rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
        {/* Background grid pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Flow container */}
        <div className="relative flex flex-col items-center">
          {/* Start node */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#c4e456] text-gray-900 shadow-sm">
            <Play className="w-4 h-4" />
            <span className="text-sm font-semibold">Start</span>
          </div>
          
          <div className="w-px h-8 bg-gray-400" />

          {/* Question 1 node */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 w-80">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-xs text-red-600 font-medium">Knockout</span>
            </div>
            <p className="text-sm text-gray-700">Ben je in het bezit van een geldige werkvergunning?</p>
            <div className="flex justify-between mt-3">
              <span className="text-xs text-green-600">JA →</span>
              <span className="text-xs text-red-600">NEE →</span>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-400" />

          {/* Question 2 node - Complex with visual branches */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-md border-2 border-purple-200 p-4 w-96">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-xs text-red-600 font-medium">Knockout</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  <GitBranch className="w-3 h-3" />
                  Complex
                </span>
              </div>
              <p className="text-sm text-gray-700">{complexBranchingQuestion.text}</p>
            </div>

            {/* Branch connections */}
            <div className="flex justify-between px-8 mt-4">
              {/* NO branch */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                  <XCircle className="w-3 h-3" />
                  NEE
                </div>
                <div className="w-px h-6 bg-red-400" />
                <div className="px-4 py-2 rounded-lg bg-red-50 border-2 border-dashed border-red-300 text-center">
                  <UserX className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <span className="text-xs text-red-600">Einde</span>
                </div>
              </div>

              {/* YES branch */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  JA
                </div>
                <div className="w-px h-6 bg-green-400" />
                
                {/* Follow-up sub-node */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-3 w-64">
                  <div className="flex items-center gap-1 mb-1">
                    <CornerDownRight className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-600 font-medium">Opvolgvraag</span>
                  </div>
                  <p className="text-xs text-gray-600">Weekend beschikbaarheid?</p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-green-500">JA: Vervoer vraag</span>
                    <span className="text-orange-500">NEE: Hoogseizoen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-400 mt-8" />

          {/* End nodes row */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 shadow-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Geslaagd</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <button className="p-2 rounded hover:bg-gray-100 transition-colors" title="Zoom in">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100 transition-colors" title="Zoom out">
            <span className="w-4 h-4 text-gray-600 block text-center leading-4">-</span>
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button className="p-2 rounded hover:bg-gray-100 transition-colors" title="Add node">
            <CircleDot className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DESIGN VARIANT M: Rule Builder (Most Compact)
// ============================================
function DesignVariantM() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Variant M: Rule Builder</h2>
        <p className="text-sm text-gray-500 mt-1">Compact rule-based logic like email filters</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Knockout vraag 2: 2-ploegensysteem</h3>
          <p className="text-sm text-gray-500 mt-1">{complexBranchingQuestion.text}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Rule 1 */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500">1</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Als antwoord is</span>
                <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-sm font-medium">NEE</span>
                <span className="text-sm text-gray-600">dan</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                  <UserX className="w-3.5 h-3.5" />
                  Niet geslaagd
                </span>
              </div>
            </div>
            <button className="p-1 rounded hover:bg-gray-200 transition-colors">
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500">2</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Als antwoord is</span>
                <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-sm font-medium">JA</span>
                <span className="text-sm text-gray-600">dan</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 border border-purple-200 text-purple-600 text-sm">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  Opvolgvraag
                </span>
              </div>
              
              {/* Nested sub-rule */}
              <div className="mt-3 ml-4 p-3 rounded-lg bg-white border border-gray-200">
                <p className="text-sm text-gray-700 mb-3">"Ben je beschikbaar voor weekendwerk?"</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-12 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">JA</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">Vraag over eigen vervoer</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-12 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-medium">NEE</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">Vraag over hoogseizoen mogelijkheid</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="p-1 rounded hover:bg-gray-200 transition-colors">
              <Pencil className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Add rule button */}
          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Regel toevoegen</span>
          </button>
        </div>

        {/* Footer with path summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <p className="text-xs text-gray-500 mb-2">Mogelijke paden:</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
              <CheckCircle className="w-3 h-3" />
              JA → JA → JA → Geslaagd
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
              <CheckCircle className="w-3 h-3" />
              JA → NEE → JA → ... → Geslaagd
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-200 text-xs text-red-600">
              <XCircle className="w-3 h-3" />
              NEE → Niet geslaagd
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function DesignSandboxPage() {
  const [activeVariant, setActiveVariant] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'>('J');

  const variants = [
    { id: 'J' as const, label: 'Timeline+', desc: 'Inline branches' },
    { id: 'H' as const, label: 'Accordion', desc: 'Nested expand' },
    { id: 'K' as const, label: 'Side Panel', desc: 'Detail editor' },
    { id: 'I' as const, label: 'Tree View', desc: 'Visual branches' },
    { id: 'L' as const, label: 'Flowchart', desc: 'Node-based' },
    { id: 'M' as const, label: 'Rules', desc: 'If-then logic' },
    { id: 'G' as const, label: 'Linear', desc: 'Current style' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Question Generator</h1>
              <p className="text-sm text-gray-500 mt-0.5">Nested branching logic</p>
            </div>
            
            {/* Variant Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVariant(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeVariant === v.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="block">{v.label}</span>
                  <span className="block text-xs text-gray-400 font-normal">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeVariant === 'A' && <DesignVariantA />}
        {activeVariant === 'B' && <DesignVariantB />}
        {activeVariant === 'C' && <DesignVariantC />}
        {activeVariant === 'D' && <DesignVariantD />}
        {activeVariant === 'E' && <DesignVariantE />}
        {activeVariant === 'F' && <DesignVariantF />}
        {activeVariant === 'G' && <DesignVariantG />}
        {activeVariant === 'H' && <DesignVariantH />}
        {activeVariant === 'I' && <DesignVariantI />}
        {activeVariant === 'J' && <DesignVariantJ />}
        {activeVariant === 'K' && <DesignVariantK />}
        {activeVariant === 'L' && <DesignVariantL />}
        {activeVariant === 'M' && <DesignVariantM />}
      </div>

      {/* Design Brief Reference */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Branching Logic Concepts</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>Sub-questions based on YES/NO</li>
            <li>Multiple levels of nesting</li>
            <li>Clear path visualization</li>
            <li>Easy editing of conditions</li>
            <li>Preview all possible paths</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
