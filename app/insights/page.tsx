'use client';

import { useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Lightbulb, 
  Zap,
  Clock,
  Users,
  MessageSquare,
  Phone,
  Calendar,
  Target,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Flex } from '@radix-ui/themes';
import { Button } from '@/components/ui/button';
import { ChatAssistant, type PromptSuggestion } from '@/components/kit/chat';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';

// Insight data structure
interface Insight {
  id: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  category: 'conversion' | 'retention' | 'efficiency' | 'quality';
  impact: 'high' | 'medium' | 'low';
  icon: React.ElementType;
  recommendation?: string;
  dataPoints?: { label: string; value: string }[];
}

// Define clever insights based on data patterns
const insights: Insight[] = [
  {
    id: 'insight-1',
    title: 'Korte pre-screenings converteren beter',
    description: 'Pre-screenings met minder dan 5 vragen resulteren in significant hogere conversie, zonder negatieve impact op retentie na 90 dagen.',
    metric: '+80%',
    metricLabel: 'hogere conversie',
    trend: 'up',
    trendValue: '12% vs vorige maand',
    category: 'conversion',
    impact: 'high',
    icon: Zap,
    recommendation: 'Beperk knockout-vragen tot max 4 per screening',
    dataPoints: [
      { label: '< 5 vragen', value: '84% conversie' },
      { label: '5-8 vragen', value: '52% conversie' },
      { label: '> 8 vragen', value: '31% conversie' },
    ],
  },
  {
    id: 'insight-2',
    title: 'Voice calls winnen voor senior rollen',
    description: 'Voor senior en management posities presteert voice screening 2.3x beter dan WhatsApp qua kwaliteit van responses.',
    metric: '2.3x',
    metricLabel: 'betere responses',
    trend: 'up',
    category: 'quality',
    impact: 'high',
    icon: Phone,
    recommendation: 'Schakel automatisch naar voice voor 5+ jaar ervaring',
    dataPoints: [
      { label: 'Voice senior', value: '91% kwaliteit' },
      { label: 'WhatsApp senior', value: '39% kwaliteit' },
      { label: 'WhatsApp junior', value: '78% kwaliteit' },
    ],
  },
  {
    id: 'insight-3',
    title: 'Snelle responders blijven langer',
    description: 'Kandidaten die binnen 4 uur reageren op de eerste uitnodiging, hebben een significant hogere retentie na 90 dagen.',
    metric: '+65%',
    metricLabel: 'hogere retentie',
    trend: 'up',
    category: 'retention',
    impact: 'high',
    icon: Clock,
    recommendation: 'Prioriteer kandidaten met responstijd < 4 uur',
    dataPoints: [
      { label: '< 4 uur', value: '87% retentie' },
      { label: '4-24 uur', value: '68% retentie' },
      { label: '> 24 uur', value: '52% retentie' },
    ],
  },
  {
    id: 'insight-4',
    title: 'Work-life balance voorspelt succes',
    description: 'Vragen over work-life balance zijn de sterkste voorspeller van 90-dagen retentie. Kandidaten die hier positief over spreken blijven langer.',
    metric: '94%',
    metricLabel: 'voorspellende waarde',
    category: 'retention',
    impact: 'medium',
    icon: Target,
    recommendation: 'Voeg work-life balance vraag toe aan elke screening',
    dataPoints: [
      { label: 'Positief antwoord', value: '89% retentie' },
      { label: 'Neutraal', value: '71% retentie' },
      { label: 'Negatief/skip', value: '34% retentie' },
    ],
  },
  {
    id: 'insight-5',
    title: 'Dinsdag is de beste dag',
    description: 'Pre-screenings gestart op dinsdag hebben een 15% hogere completion rate dan gemiddeld. Vrijdag scoort het slechtst.',
    metric: '+15%',
    metricLabel: 'completion rate',
    trend: 'up',
    category: 'efficiency',
    impact: 'medium',
    icon: Calendar,
    recommendation: 'Plan bulk-uitnodigingen op dinsdag',
    dataPoints: [
      { label: 'Dinsdag', value: '82% completion' },
      { label: 'Woensdag', value: '78% completion' },
      { label: 'Vrijdag', value: '61% completion' },
    ],
  },
  {
    id: 'insight-6',
    title: 'Job hoppers presteren beter',
    description: 'Kandidaten met 2+ baanwisselingen in de afgelopen 5 jaar scoren 30% hoger op performance metrics na 6 maanden.',
    metric: '+30%',
    metricLabel: 'betere performance',
    trend: 'up',
    category: 'quality',
    impact: 'high',
    icon: TrendingUp,
    recommendation: 'Verwijder "job hopper" als rode vlag',
    dataPoints: [
      { label: '2+ wisselingen', value: '8.2 perf. score' },
      { label: '1 wisseling', value: '7.1 perf. score' },
      { label: '0 wisselingen', value: '6.3 perf. score' },
    ],
  },
  {
    id: 'insight-7',
    title: 'Emoji-gebruik correleert met fit',
    description: 'Kandidaten die emoji\'s gebruiken in WhatsApp screening hebben 40% betere culture fit scores volgens hiring managers.',
    metric: '+40%',
    metricLabel: 'culture fit',
    category: 'quality',
    impact: 'low',
    icon: MessageSquare,
    dataPoints: [
      { label: 'Met emoji\'s', value: '8.4 fit score' },
      { label: 'Zonder emoji\'s', value: '6.0 fit score' },
    ],
  },
  {
    id: 'insight-8',
    title: 'Avond-responders converteren minder',
    description: 'Kandidaten die na 21:00 reageren hebben 25% lagere conversie naar hire. Mogelijk indicator voor mismatch.',
    metric: '-25%',
    metricLabel: 'lagere conversie',
    trend: 'down',
    category: 'conversion',
    impact: 'medium',
    icon: AlertTriangle,
    recommendation: 'Flag late responders voor extra screening',
    dataPoints: [
      { label: '09:00-18:00', value: '72% conversie' },
      { label: '18:00-21:00', value: '65% conversie' },
      { label: '21:00-09:00', value: '47% conversie' },
    ],
  },
];

// Category styling - more muted, cohesive colors
const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  conversion: { label: 'Conversie', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  retention: { label: 'Retentie', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  efficiency: { label: 'Efficiëntie', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  quality: { label: 'Kwaliteit', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

// Impact styling
const impactConfig: Record<string, { label: string; dotColor: string }> = {
  high: { label: 'Hoge impact', dotColor: 'bg-brand-dark-blue' },
  medium: { label: 'Medium impact', dotColor: 'bg-yellow-400' },
  low: { label: 'Lage impact', dotColor: 'bg-gray-300' },
};

// Stats summary
const summaryStats = [
  { label: 'Actieve inzichten', value: '8', icon: Lightbulb },
  { label: 'Hoge impact items', value: '4', icon: Zap },
  { label: 'Potentiële ROI', value: '+32%', icon: TrendingUp },
  { label: 'Data gebaseerd op', value: '2.4k', icon: Users },
];

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = insight.icon;
  const category = categoryConfig[insight.category];
  const impact = impactConfig[insight.impact];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            insight.trend === 'down' ? 'bg-red-100' : 'bg-brand-dark-blue'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              insight.trend === 'down' ? 'text-red-600' : 'text-white'
            )} />
          </div>
          <div className="flex flex-col gap-1">
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full w-fit',
              category.bgColor,
              category.color
            )}>
              {category.label}
            </span>
            <Flex align="center" gap="1">
              <div className={cn('w-1.5 h-1.5 rounded-full', impact.dotColor)} />
              <span className="text-xs text-gray-400">{impact.label}</span>
            </Flex>
          </div>
        </div>
        {insight.trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            insight.trend === 'up' ? 'text-green-600' : 'text-red-500'
          )}>
            {insight.trend === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {insight.trendValue}
          </div>
        )}
      </div>

      {/* Title and Description */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {insight.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
        {insight.description}
      </p>

      {/* Metric */}
      <div className="flex items-end gap-2 mb-4">
        <span className={cn(
          'text-4xl font-serif',
          insight.trend === 'down' ? 'text-red-500' : 'text-brand-dark-blue'
        )}>
          {insight.metric}
        </span>
        <span className="text-sm text-gray-500 mb-1">{insight.metricLabel}</span>
      </div>

      {/* Data Points */}
      {insight.dataPoints && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="space-y-2">
            {insight.dataPoints.map((point, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{point.label}</span>
                <span className="text-xs font-medium text-gray-900">{point.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {insight.recommendation && (
        <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
          <Lightbulb className="w-4 h-4 text-white shrink-0" />
          <span className="text-xs font-medium text-white">
            {insight.recommendation}
          </span>
        </div>
      )}
    </div>
  );
}

function HeroInsight({ insight }: { insight: Insight }) {
  const Icon = insight.icon;
  
  return (
    <div className="bg-brand-dark-blue rounded-2xl p-8 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pink/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Top label */}
        <Flex align="center" gap="2" className="mb-4">
          <Sparkles className="w-4 h-4 text-brand-lime-green" />
          <span className="text-xs font-medium text-brand-lime-green uppercase tracking-wide">
            Top Insight van deze maand
          </span>
        </Flex>
        
        {/* Full-width title */}
        <h2 className="text-4xl mb-10 font-serif">{insight.title}</h2>
        
        {/* Two columns: description/metric and breakdown */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-brand-light-blue mb-6 leading-relaxed">
              {insight.description}
            </p>
            
            <div className="flex items-end gap-3 mb-6">
              <span className="text-6xl text-brand-lime-green font-serif">{insight.metric}</span>
              <span className="text-brand-light-blue mb-2">{insight.metricLabel}</span>
            </div>
            
            {insight.recommendation && (
              <Button className="bg-brand-lime-green hover:bg-brand-lime-green/90 text-brand-dark-blue font-medium">
                <Lightbulb className="w-4 h-4 mr-2" />
                Pas toe in Finetune
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <Text size="1" className="text-brand-light-blue uppercase tracking-wide block mb-3">
              Breakdown
            </Text>
            {insight.dataPoints?.map((point, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
              >
                <span className="text-sm text-white/80">{point.label}</span>
                <span className="text-sm font-semibold text-white">{point.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulated AI responses for insights questions
const insightResponses: Record<string, string> = {
  'conversion': `Op basis van de data zie ik dat **korte pre-screenings** (< 5 vragen) de grootste impact hebben op conversie. 

Specifiek:
- 84% conversie bij minder dan 5 vragen
- 52% bij 5-8 vragen  
- 31% bij meer dan 8 vragen

Mijn aanbeveling: focus op de 3-4 meest kritieke knockout-vragen en verwijder "nice to have" vragen.`,
  'retention': `De sterkste voorspeller van retentie is **responstijd**. Kandidaten die binnen 4 uur reageren hebben 65% hogere retentie.

Daarnaast is het antwoord op work-life balance vragen zeer voorspellend (94% nauwkeurigheid).

Tip: overweeg een snelle-responder badge toe te voegen in je kandidaat-overzicht.`,
  'voice': `Voice pre-screening presteert **2.3x beter** voor senior rollen. Dit komt door:
- Meer nuance in antwoorden
- Betere assessment van communicatievaardigheden
- Hogere engagement rate

Voor junior rollen is WhatsApp effectiever vanwege de lagere drempel.`,
  'default': `Interessante vraag! Op basis van de huidige data kan ik je het volgende vertellen:

De belangrijkste patronen die we zien zijn:
1. **Korte screenings** converteren 80% beter
2. **Snelle responders** (< 4 uur) hebben betere retentie
3. **Voice** werkt beter voor senior rollen

Heb je een specifieke vraag over één van deze inzichten?`,
};

function getInsightResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('conversie') || q.includes('conversion') || q.includes('vragen')) {
    return insightResponses.conversion;
  }
  if (q.includes('retentie') || q.includes('retention') || q.includes('blijven')) {
    return insightResponses.retention;
  }
  if (q.includes('voice') || q.includes('senior') || q.includes('whatsapp')) {
    return insightResponses.voice;
  }
  return insightResponses.default;
}

export default function InsightsPage() {
  const heroInsight = insights[0]; // The short pre-screening insight
  const otherInsights = insights.slice(1);
  
  // Group insights by category
  const highImpactInsights = otherInsights.filter(i => i.impact === 'high');
  const otherImpactInsights = otherInsights.filter(i => i.impact !== 'high');

  // Handle chat submission
  const handleChatSubmit = useCallback(async (message: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    return getInsightResponse(message);
  }, []);

  return (
    <PageLayout>
      <PageLayoutHeader
        title="Insights"
        description="Ontdek verborgen patronen en optimaliseer je hiring proces"
        action={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>Gebaseerd op <span className="font-medium text-gray-700">2.4k</span> screenings</span>
          </div>
        }
      />
      <PageLayoutContent
        sidebar={
          <ChatAssistant
            initialMessage={`Ik ben je digitale collega voor insights.

Ik maak van data duidelijke inzichten, zonder ruis of dashboards-gedoe.`}
            placeholder="Stel een vraag over de inzichten..."
            loadingMessage="Analyseren..."
            onSubmit={handleChatSubmit}
            showActions={false}
            suggestions={[
              {
                label: 'Hoe verbeter ik conversie?',
                prompt: 'Hoe kan ik de conversie van mijn pre-screenings verbeteren?',
                icon: TrendingUp,
              },
              {
                label: 'Voice vs WhatsApp',
                prompt: 'Wanneer moet ik voice gebruiken in plaats van WhatsApp?',
                icon: Phone,
              },
            ]}
          />
        }
        sidebarWidth={420}
      >
        <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summaryStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <Flex align="center" gap="2" className="mb-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </Flex>
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    {stat.label === 'Data gebaseerd op' && (
                      <span className="text-xs text-gray-400 ml-1">screenings</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hero Insight */}
            <HeroInsight insight={heroInsight} />

            {/* High Impact Insights */}
            <div className="space-y-4">
              <Text size="3" weight="medium" className="text-foreground block pb-2">
                Hoge impact inzichten
              </Text>
              
              <div className="grid md:grid-cols-2 gap-4">
                {highImpactInsights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>

            {/* Other Insights */}
            <div className="space-y-4">
              <Text size="3" weight="medium" className="text-foreground block pb-2">
                Overige inzichten
              </Text>
              
              <div className="grid md:grid-cols-2 gap-4">
                {otherImpactInsights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-linear-to-r from-brand-blue to-brand-pink rounded-2xl p-8 text-center">
              <div className="max-w-xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-2">
                  Wil je deze inzichten automatisch toepassen?
                </h3>
                <p className="text-white/80 text-sm mb-6">
                  Ga naar Finetune om je agents automatisch te optimaliseren op basis van deze data-gedreven aanbevelingen.
                </p>
                <Button className="bg-white hover:bg-gray-100 text-brand-dark-blue font-medium">
                  Naar Finetune
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
