'use client';

import { useState, useMemo } from 'react';
import { Heading, Text, Flex } from '@radix-ui/themes';
import { 
  Plus, 
  Trash2, 
  Phone,
  MessageSquare,
  Layers,
  ChevronDown,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { dummyFinetuneInstructions } from '@/lib/dummy-data';
import { FinetuneInstruction, FinetuneAgent, FinetuneCategory } from '@/lib/types';

// Agent configuration with brand colors
const agentConfig: Record<FinetuneAgent, { label: string; icon: React.ElementType; bgClass: string; iconClass: string; description: string }> = {
  'general': {
    label: 'Algemeen',
    icon: Layers,
    bgClass: 'bg-gray-900',
    iconClass: 'text-white',
    description: 'Overkoepelende stijl & tone of voice',
  },
  'pre-screening': {
    label: 'Pre-screening agent',
    icon: Phone,
    bgClass: 'bg-brand-blue',
    iconClass: 'text-white',
    description: 'Hoe de agent kandidaten screent',
  },
  'interview-generator': {
    label: 'Interview generator',
    icon: MessageSquare,
    bgClass: 'bg-brand-pink',
    iconClass: 'text-white',
    description: 'Hoe interviews worden opgebouwd',
  },
};

// Order for display
const agentOrder: FinetuneAgent[] = ['general', 'pre-screening', 'interview-generator'];

// Category configuration
const categoryConfig: Record<FinetuneCategory, { label: string; description: string }> = {
  'checks': { label: 'Wat altijd checken', description: 'Vaste checks per roltype' },
  'strictness': { label: 'Hoe streng', description: 'Instelbare lat voor kandidaten' },
  'red-flags': { label: 'Rode vlaggen', description: 'Dealbreakers' },
  'depth': { label: 'Hoe diep', description: 'Detailniveau van screening' },
  'tone': { label: 'Taal & toon', description: 'Micro-instructies voor communicatie' },
  'style': { label: 'Interviewstijl', description: 'Hoe het gesprek verloopt' },
  'focus': { label: 'Focus van vragen', description: 'Waar de nadruk op ligt' },
  'difficulty': { label: 'Moeilijkheidsgraad', description: 'Niveau van de vragen' },
  'avoid': { label: 'Wat niet', description: 'Wat te vermijden' },
  'output': { label: 'Output-vorm', description: 'Hoe resultaten worden opgeleverd' },
  'brand': { label: 'Brand & team feeling', description: 'Overkoepelende identiteit' },
};

// Categories per agent
const categoriesByAgent: Record<FinetuneAgent, FinetuneCategory[]> = {
  'pre-screening': ['checks', 'strictness', 'red-flags', 'depth', 'tone'],
  'interview-generator': ['style', 'focus', 'difficulty', 'avoid', 'output'],
  'general': ['brand'],
};

export default function FinetunePage() {
  const [instructions, setInstructions] = useState<FinetuneInstruction[]>(dummyFinetuneInstructions);
  const [newInstruction, setNewInstruction] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<FinetuneAgent>('general');
  const [selectedCategory, setSelectedCategory] = useState<FinetuneCategory>('brand');
  const [expandedAgents, setExpandedAgents] = useState<Record<FinetuneAgent, boolean>>({
    'pre-screening': true,
    'interview-generator': true,
    'general': true,
  });

  // Group instructions by agent
  const instructionsByAgent = useMemo(() => {
    const grouped: Record<FinetuneAgent, FinetuneInstruction[]> = {
      'pre-screening': [],
      'interview-generator': [],
      'general': [],
    };
    
    instructions.forEach(instruction => {
      grouped[instruction.agent].push(instruction);
    });
    
    return grouped;
  }, [instructions]);

  // Add new instruction
  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return;

    // Default category based on agent
    const defaultCategory = categoriesByAgent[selectedAgent][0];

    const newItem: FinetuneInstruction = {
      id: `ft-${Date.now()}`,
      agent: selectedAgent,
      category: defaultCategory,
      instruction: newInstruction.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setInstructions([newItem, ...instructions]);
    setNewInstruction('');
  };

  // Toggle instruction active state
  const handleToggle = (id: string) => {
    setInstructions(instructions.map(i => 
      i.id === id ? { ...i, isActive: !i.isActive, updatedAt: new Date().toISOString() } : i
    ));
  };

  // Delete instruction
  const handleDelete = (id: string) => {
    setInstructions(instructions.filter(i => i.id !== id));
  };

  // Toggle agent expansion
  const toggleAgent = (agent: FinetuneAgent) => {
    setExpandedAgents(prev => ({ ...prev, [agent]: !prev[agent] }));
  };

  // Update selected category when agent changes
  const handleAgentChange = (agent: FinetuneAgent) => {
    setSelectedAgent(agent);
    setSelectedCategory(categoriesByAgent[agent][0]);
  };

  const availableCategories = categoriesByAgent[selectedAgent];

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <Heading size="6" className="text-foreground">
          Finetune Taloo
        </Heading>
        <Text size="2" className="text-gray-500">
          Voeg gedragsregels toe die bepalen hoe Taloo werkt voor jouw team en bedrijf.
        </Text>
      </div>

      {/* Add new instruction - Dark theme */}
      <div className="bg-brand-dark-blue rounded-2xl p-6 space-y-6">
        <Text size="2" weight="medium" className="text-white pb-2 block">
          Nieuwe instructie
        </Text>
        
        {/* Agent selector */}
        <div>
          <div className="pb-2">
            <Text size="1" className="text-brand-light-blue uppercase tracking-wide">
              Agent
            </Text>
          </div>
          <Flex gap="2" wrap="wrap">
            {agentOrder.map((agent) => {
              const config = agentConfig[agent];
              const Icon = config.icon;
              const isSelected = selectedAgent === agent;
              
              return (
                <button
                  key={agent}
                  onClick={() => handleAgentChange(agent)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm',
                    isSelected 
                      ? 'bg-white text-brand-dark-blue' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </Flex>
        </div>

        {/* Instruction input */}
        <div className="flex gap-3">
          <Input
            placeholder="Bijvoorbeeld: Gebruik altijd u-vorm"
            value={newInstruction}
            onChange={(e) => setNewInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddInstruction()}
            className="flex-1 bg-white/10 border-0 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-brand-light-blue"
          />
          <Button 
            onClick={handleAddInstruction}
            disabled={!newInstruction.trim()}
            className="bg-brand-lime-green hover:bg-brand-lime-green/90 text-brand-dark-blue font-medium"
          >
            <Plus className="w-4 h-4" />
            Toevoegen
          </Button>
        </div>
      </div>

      {/* Instructions list by agent */}
      <div className="space-y-6">
        <Flex justify="between" align="center">
          <Text size="2" weight="medium" className="text-foreground">
            Instructies
          </Text>
          <Text size="1" className="text-gray-400">
            {instructions.filter(i => i.isActive).length} actief
          </Text>
        </Flex>

        <div className="space-y-3">
          {agentOrder.map((agent) => {
            const config = agentConfig[agent];
            const Icon = config.icon;
            const agentInstructions = instructionsByAgent[agent];
            const activeCount = agentInstructions.filter(i => i.isActive).length;
            const isExpanded = expandedAgents[agent];

            return (
              <Collapsible key={agent} open={isExpanded} onOpenChange={() => toggleAgent(agent)}>
                <div className="rounded-xl bg-gray-50/50 border border-gray-100">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-xl">
                      <Flex align="center" gap="3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          config.bgClass
                        )}>
                          <Icon className={cn('w-4 h-4', config.iconClass)} />
                        </div>
                        <div className="text-left">
                          <Text size="2" weight="medium" className="text-foreground">
                            {config.label}
                          </Text>
                        </div>
                      </Flex>
                      <Flex align="center" gap="3">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          activeCount > 0 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        )}>
                          {activeCount}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        )}
                      </Flex>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      {agentInstructions.length === 0 ? (
                        <div className="py-6 text-center">
                          <Text size="2" className="text-gray-400">
                            Nog geen instructies
                          </Text>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {agentInstructions.map((instruction) => (
                            <div
                              key={instruction.id}
                              className={cn(
                                'flex items-center gap-4 py-3 px-3 rounded-lg transition-colors group',
                                instruction.isActive ? 'hover:bg-white' : 'opacity-50'
                              )}
                            >
                              <Switch
                                checked={instruction.isActive}
                                onCheckedChange={() => handleToggle(instruction.id)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <div className="flex-1 min-w-0">
                                <Text
                                  size="2"
                                  className={cn(
                                    'block',
                                    instruction.isActive 
                                      ? 'text-foreground' 
                                      : 'text-gray-400 line-through'
                                  )}
                                >
                                  {instruction.instruction}
                                </Text>
                                <Flex align="center" gap="2" className="mt-1">
                                  <Text size="1" className="text-gray-400">
                                    {categoryConfig[instruction.category].label}
                                  </Text>
                                  <span className="text-gray-200">·</span>
                                  <Flex align="center" gap="1">
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src="/dummy-profile-ld.png" alt="Laurijn" />
                                      <AvatarFallback className="text-[8px] bg-gray-200">L</AvatarFallback>
                                    </Avatar>
                                    <Text size="1" className="text-gray-400">
                                      Laurijn
                                    </Text>
                                  </Flex>
                                </Flex>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(instruction.id)}
                                className="text-gray-300 hover:text-brand-pink hover:bg-brand-pink/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}
