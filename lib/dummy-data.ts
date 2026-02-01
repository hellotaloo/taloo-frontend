import { Vacancy, Question, ChatMessage, Interview, InterviewMetrics, FinetuneInstruction } from './types';

export const dummyVacancies: Vacancy[] = [
  {
    id: '20',
    title: 'Productieoperator 2 ploegen',
    company: 'Ago Industries',
    location: 'Ham, België',
    description: `Samen met onze klant, gelegen regio Diest, zijn we op zoek naar een operator die graag in 2 ploegen wilt werken.

### Jouw verantwoordelijkheden

- Instellen van machines
- De bevoorrading van de werkplaatsen of productielijnen met materiaal opvolgen en controleren
- Productielijn opvolgen en controleren
- Storingen oplossen Kwaliteitscontroles
- Het opvolgen van de hygiënevoorschriften
- Collega's aansturen waar nodig

### Kwalificaties

- Je bezit een technische achtergrond
- Zin voor initiatief: uit eigen beweging gepaste acties ondernemen
- Je kan goed communiceren en kan jouw kennis en vaardigheden op een duidelijke manier overbrengen
- Mensgericht zijn om goed met mensen te kunnen omgaan

### Ontwikkeling en groei

Snelle opstart is mogelijk Aantrekkelijk salaris van €17,59/uur, maaltijdcheques + ploegenpremie Fulltime betrekking
Optie tot een vast contract Je zal werken in een twee ploegensysteem Variatie in je takenpakket Opleiding op de werkvloer
Mogelijkheid om door te groeien tot lijnverantwoordelijke`,
    status: 'new',
    createdAt: '2026-01-30T09:00:00Z',
    source: 'salesforce',
    hasScreening: false,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 0,
    completedCount: 0,
    qualifiedCount: 0,
  },
  {
    id: '1',
    title: 'Verkoopmedewerker Bakkerij',
    company: 'Bakkerij Peeters',
    location: 'Landen, België',
    description: 'Wij zoeken een enthousiaste verkoopmedewerker voor onze bakkerij. Je bent verantwoordelijk voor het bedienen van klanten, het afrekenen aan de kassa en het verzorgen van de winkelindeling.',
    status: 'new',
    createdAt: '2026-01-28T10:00:00Z',
    source: 'salesforce',
    hasScreening: false,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 0,
    completedCount: 0,
    qualifiedCount: 0,
  },
  {
    id: '2',
    title: 'Magazijnmedewerker',
    company: 'LogiTrans NV',
    location: 'Antwerpen, België',
    description: 'Voor ons distributiecentrum zoeken we een magazijnmedewerker. Je bent verantwoordelijk voor het ontvangen, opslaan en verzenden van goederen.',
    status: 'in_progress',
    createdAt: '2026-01-25T14:30:00Z',
    source: 'salesforce',
    hasScreening: true,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 5,
    completedCount: 3,
    qualifiedCount: 2,
  },
  {
    id: '3',
    title: 'Klantenservice Medewerker',
    company: 'TeleCom Solutions',
    location: 'Brussel, België',
    description: 'Als klantenservice medewerker ben je het eerste aanspreekpunt voor onze klanten. Je beantwoordt vragen via telefoon, email en chat.',
    status: 'agent_created',
    createdAt: '2026-01-20T09:15:00Z',
    source: 'salesforce',
    hasScreening: true,
    isOnline: true,
    channels: { voice: true, whatsapp: true, cv: true },
    candidatesCount: 24,
    completedCount: 18,
    qualifiedCount: 12,
  },
  {
    id: '4',
    title: 'Productiemedewerker',
    company: 'FoodFactory BV',
    location: 'Gent, België',
    description: 'Voor onze voedselproductielijn zoeken we productiemedewerkers. Je werkt in ploegen en bent verantwoordelijk voor het bedienen van machines.',
    status: 'new',
    createdAt: '2026-01-27T11:45:00Z',
    source: 'salesforce',
    hasScreening: false,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 0,
    completedCount: 0,
    qualifiedCount: 0,
  },
  {
    id: '5',
    title: 'Schoonmaker',
    company: 'CleanPro Services',
    location: 'Leuven, België',
    description: 'Wij zoeken schoonmakers voor diverse kantoorlocaties. Flexibele werktijden mogelijk, voornamelijk vroege ochtend of late avond.',
    status: 'in_progress',
    createdAt: '2026-01-22T08:00:00Z',
    source: 'salesforce',
    hasScreening: true,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 8,
    completedCount: 6,
    qualifiedCount: 4,
  },
  {
    id: '6',
    title: 'Horeca Medewerker',
    company: 'Brasserie De Kroon',
    location: 'Mechelen, België',
    description: 'Voor ons restaurant zoeken we allround horeca medewerkers. Je helpt in de bediening en ondersteunt in de keuken waar nodig.',
    status: 'new',
    createdAt: '2026-01-29T07:30:00Z',
    source: 'salesforce',
    hasScreening: false,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 0,
    completedCount: 0,
    qualifiedCount: 0,
  },
  // Archived vacancies
  {
    id: '7',
    title: 'Kassamedewerker',
    company: 'Supermarkt Plus',
    location: 'Hasselt, België',
    description: 'Wij zoeken kassamedewerkers voor onze winkel. Je staat klanten te woord en handelt betalingen af.',
    status: 'archived',
    createdAt: '2025-11-15T09:00:00Z',
    archivedAt: '2026-01-10T16:00:00Z',
    source: 'salesforce',
    hasScreening: true,
    isOnline: false,
    channels: { voice: true, whatsapp: false, cv: false },
    candidatesCount: 45,
    completedCount: 38,
    qualifiedCount: 22,
  },
  {
    id: '8',
    title: 'Vrachtwagenchauffeur',
    company: 'TransPort BV',
    location: 'Antwerpen, België',
    description: 'Ervaren vrachtwagenchauffeur gezocht voor nationaal transport. Rijbewijs CE vereist.',
    status: 'archived',
    createdAt: '2025-10-20T08:00:00Z',
    archivedAt: '2025-12-28T14:30:00Z',
    source: 'salesforce',
    hasScreening: true,
    isOnline: false,
    channels: { voice: false, whatsapp: true, cv: false },
    candidatesCount: 32,
    completedCount: 28,
    qualifiedCount: 15,
  },
  {
    id: '9',
    title: 'Receptionist(e)',
    company: 'Hotel Centraal',
    location: 'Brussel, België',
    description: 'Voor ons hotel zoeken we een vriendelijke receptionist(e) voor de ontvangst van gasten.',
    status: 'archived',
    createdAt: '2025-09-10T11:00:00Z',
    archivedAt: '2025-11-30T10:00:00Z',
    source: 'manual',
    hasScreening: false,
    isOnline: null,
    channels: { voice: false, whatsapp: false, cv: false },
    candidatesCount: 0,
    completedCount: 0,
    qualifiedCount: 0,
  },
];

export const dummyQuestions: Question[] = [
  // Knockout questions
  {
    id: 'q1',
    type: 'knockout',
    text: 'Ben je beschikbaar om 25 uur per week te werken?',
    answerType: 'yes_no',
    required: true,
    order: 1,
  },
  {
    id: 'q2',
    type: 'knockout',
    text: 'Kan je afwisselend in het weekend werken (zaterdag/zondag)?',
    answerType: 'yes_no',
    required: true,
    order: 2,
  },
  {
    id: 'q3',
    type: 'knockout',
    text: 'Woon je in of rond Landen, of kan je vlot tot daar geraken?',
    answerType: 'yes_no',
    required: true,
    order: 3,
  },
  {
    id: 'q4',
    type: 'knockout',
    text: 'Heb je een geldige werkvergunning om in België te werken?',
    answerType: 'yes_no',
    required: true,
    order: 4,
  },
  {
    id: 'q5',
    type: 'knockout',
    text: 'Ben je bereid om vroeg te starten (typisch voor een bakkerij)?',
    answerType: 'yes_no',
    required: true,
    order: 5,
  },
  // Qualifying questions
  {
    id: 'q6',
    type: 'qualifying',
    text: 'Heb je ervaring in één van deze omgevingen?',
    answerType: 'multiple_choice',
    options: [
      { id: 'o1', label: 'Verkoop' },
      { id: 'o2', label: 'Horeca' },
      { id: 'o3', label: 'Bakkerij' },
      { id: 'o4', label: 'Geen ervaring, maar wel gemotiveerd' },
    ],
    required: true,
    order: 6,
  },
  {
    id: 'q7',
    type: 'qualifying',
    text: 'Wat vind je het leukst aan werken in een winkel/bakkerij?',
    answerType: 'open',
    required: true,
    order: 7,
  },
  {
    id: 'q8',
    type: 'qualifying',
    text: 'Hoe comfortabel voel je je bij klanten bedienen en afrekenen aan de kassa?',
    answerType: 'multiple_choice',
    options: [
      { id: 'o5', label: 'Heel comfortabel' },
      { id: 'o6', label: 'Gaat wel' },
      { id: 'o7', label: 'Nog weinig ervaring' },
    ],
    required: true,
    order: 8,
  },
  {
    id: 'q9',
    type: 'qualifying',
    text: 'Hoe werk je het liefst?',
    answerType: 'multiple_choice',
    options: [
      { id: 'o8', label: 'In team' },
      { id: 'o9', label: 'Zelfstandig' },
      { id: 'o10', label: 'Afwisseling van beide' },
    ],
    required: true,
    order: 9,
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg1',
    role: 'assistant',
    content: 'Ik heb de vacature geanalyseerd en knock-out en kwalificerende vragen gegenereerd. Je kunt de vragen bekijken in het "Vragen" tabblad. Heb je feedback of wil je iets aanpassen?',
    timestamp: new Date().toISOString(),
  },
];

// Generate mock interviews for the last 30 days
function generateMockInterviews(): Interview[] {
  const interviews: Interview[] = [];
  const vacancyIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const channels: ('voice' | 'whatsapp')[] = ['voice', 'whatsapp'];
  const statuses: ('started' | 'completed' | 'abandoned')[] = ['completed', 'completed', 'completed', 'abandoned', 'started'];
  
  // Generate ~150 interviews over the last 30 days
  for (let i = 0; i < 156; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(startDate.getHours() - hoursAgo);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const totalQuestions = 9;
    const questionsAnswered = status === 'completed' ? totalQuestions : Math.floor(Math.random() * (totalQuestions - 1)) + 1;
    const knockoutPassed = status === 'completed' ? Math.random() > 0.15 : Math.random() > 0.5;
    const qualified = status === 'completed' && knockoutPassed && Math.random() > 0.3;
    
    const completedAt = status === 'completed' ? new Date(startDate.getTime() + Math.floor(Math.random() * 15 + 5) * 60000).toISOString() : undefined;
    
    interviews.push({
      id: `int-${i + 1}`,
      vacancyId: vacancyIds[Math.floor(Math.random() * vacancyIds.length)],
      agentId: `agent-${Math.floor(Math.random() * 3) + 1}`,
      channel,
      status,
      startedAt: startDate.toISOString(),
      completedAt,
      questionsAnswered,
      totalQuestions,
      qualified,
      knockoutPassed,
    });
  }
  
  return interviews.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export const dummyInterviews: Interview[] = generateMockInterviews();

// Calculate metrics from interviews
export function calculateInterviewMetrics(interviews: Interview[], vacancies: Vacancy[]): InterviewMetrics {
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.status === 'completed').length;
  const qualifiedCandidates = interviews.filter(i => i.qualified).length;
  
  const voiceCount = interviews.filter(i => i.channel === 'voice').length;
  const whatsappCount = interviews.filter(i => i.channel === 'whatsapp').length;
  
  // Weekly trend (last 4 weeks)
  const weeklyTrend: { date: string; count: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = interviews.filter(int => int.startedAt.split('T')[0] === dateStr).length;
    weeklyTrend.push({ date: dateStr, count });
  }
  
  // Popular vacancies
  const vacancyCounts: Record<string, number> = {};
  interviews.forEach(int => {
    vacancyCounts[int.vacancyId] = (vacancyCounts[int.vacancyId] || 0) + 1;
  });
  
  const popularVacancies = Object.entries(vacancyCounts)
    .map(([vacancyId, count]) => {
      const vacancy = vacancies.find(v => v.id === vacancyId);
      return {
        vacancyId,
        title: vacancy?.title || 'Unknown',
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalInterviews,
    completedInterviews,
    completionRate: totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0,
    qualifiedCandidates,
    qualificationRate: completedInterviews > 0 ? Math.round((qualifiedCandidates / completedInterviews) * 100) : 0,
    channelBreakdown: {
      voice: voiceCount,
      whatsapp: whatsappCount,
    },
    weeklyTrend,
    popularVacancies,
  };
}

export const dummyMetrics = calculateInterviewMetrics(dummyInterviews, dummyVacancies);

// Fine-tune instructions
export const dummyFinetuneInstructions: FinetuneInstruction[] = [
  // Pre-screening agent instructions
  {
    id: 'ft-0',
    agent: 'pre-screening',
    category: 'checks',
    instruction: 'Mag je wettelijk werken in België (met of zonder werkvergunning)? (ALTIJD als eerste knockout vraag!)',
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'ft-4',
    agent: 'pre-screening',
    category: 'strictness',
    instruction: 'Twijfel = doorvragen, niet afwijzen',
    isActive: true,
    createdAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'ft-6',
    agent: 'pre-screening',
    category: 'depth',
    instruction: 'Vraag altijd naar concrete voorbeelden',
    isActive: true,
    createdAt: '2026-01-10T10:30:00Z',
  },
  {
    id: 'ft-8',
    agent: 'pre-screening',
    category: 'tone',
    instruction: 'Wees warm maar professioneel',
    isActive: true,
    createdAt: '2026-01-08T13:45:00Z',
  },
  // Interview generator instructions
  {
    id: 'ft-9',
    agent: 'interview-generator',
    category: 'style',
    instruction: 'Gesprek, geen kruisverhoor',
    isActive: true,
    createdAt: '2026-01-07T10:00:00Z',
  },
  {
    id: 'ft-11',
    agent: 'interview-generator',
    category: 'difficulty',
    instruction: 'Basisinterview voor juniors, uitdagend voor seniors',
    isActive: true,
    createdAt: '2026-01-05T11:30:00Z',
  },
  {
    id: 'ft-12',
    agent: 'interview-generator',
    category: 'avoid',
    instruction: 'Geen stressvragen of trick questions',
    isActive: true,
    createdAt: '2026-01-04T09:00:00Z',
  },
  // General instructions
  {
    id: 'ft-14',
    agent: 'general',
    category: 'brand',
    instruction: 'Spreek alsof je een collega bent, geen tool',
    isActive: true,
    createdAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'ft-15',
    agent: 'general',
    category: 'brand',
    instruction: 'Geen buzzwords',
    isActive: true,
    createdAt: '2026-01-01T09:00:00Z',
  },
  {
    id: 'ft-16',
    agent: 'general',
    category: 'brand',
    instruction: 'Maak het simpel, ook als het complex is',
    isActive: true,
    createdAt: '2025-12-31T14:00:00Z',
  },
];
