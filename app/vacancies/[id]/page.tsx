'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heading, 
  Text, 
  Flex, 
  Button, 
  Card, 
  Badge, 
  Tabs,
  Dialog,
  TextField
} from '@radix-ui/themes';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Bot, 
  MessageSquare,
  ListChecks,
  GitBranch,
  Phone,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { KnockoutQuestions } from '@/components/questions/KnockoutQuestions';
import { QualifyingQuestions } from '@/components/questions/QualifyingQuestions';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { InterviewFlow } from '@/components/flow/InterviewFlow';
import { dummyQuestions, initialChatMessages } from '@/lib/dummy-data';
import { Question, ChatMessage, Vacancy } from '@/lib/types';
import { getVacancy } from '@/lib/interview-api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VacancyDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  // Vacancy state
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [isLoadingVacancy, setIsLoadingVacancy] = useState(true);
  const [vacancyError, setVacancyError] = useState<string | null>(null);
  
  // Other state
  const [questions, setQuestions] = useState<Question[]>(dummyQuestions);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agentCreated, setAgentCreated] = useState(false);

  // Fetch vacancy on mount
  useEffect(() => {
    async function fetchVacancy() {
      try {
        setIsLoadingVacancy(true);
        setVacancyError(null);
        const data = await getVacancy(id);
        setVacancy(data);
      } catch (err) {
        console.error('Failed to fetch vacancy:', err);
        setVacancyError('Vacancy not found');
      } finally {
        setIsLoadingVacancy(false);
      }
    }

    fetchVacancy();
  }, [id]);

  // Loading state
  if (isLoadingVacancy) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading vacancy...</span>
      </div>
    );
  }

  // Error/not found state
  if (vacancyError || !vacancy) {
    return (
      <div className="text-center py-12">
        <Text className="text-[var(--text-secondary)]">Vacancy not found</Text>
        <Link href="/vacancies" className="text-blue-500 mt-2 block">
          Back to vacancies
        </Link>
      </div>
    );
  }

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `Bedankt voor je feedback! Ik heb de vragen aangepast op basis van je suggestie: "${message}". Bekijk de wijzigingen in het Vragen tabblad.`,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleApprove = () => {
    setShowAgentDialog(true);
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: 'Ik heb de vragen opnieuw gegenereerd met een frisse blik. Bekijk de nieuwe versie in het Vragen tabblad.',
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleEditQuestion = (question: Question) => {
    console.log('Edit question:', question);
    // Would open edit modal
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleCreateAgent = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAgentCreated(true);
    setIsLoading(false);
  };

  const handleTestAgent = async () => {
    if (!phoneNumber) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`Test bericht verzonden naar ${phoneNumber}`);
    setIsLoading(false);
  };

  const statusConfig: Record<string, { label: string; color: 'blue' | 'orange' | 'green' | 'gray' }> = {
    new: { label: 'New', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'orange' },
    agent_created: { label: 'Agent Created', color: 'green' },
    archived: { label: 'Archived', color: 'gray' },
  };
  const status = statusConfig[vacancy.status] || { label: vacancy.status, color: 'gray' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/vacancies"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar vacatures
        </Link>

        <Flex justify="between" align="start">
          <div>
            <Flex align="center" gap="3" className="mb-2">
              <Heading size="6" className="text-[var(--text-primary)]">
                {vacancy.title}
              </Heading>
              <Badge color={status.color} variant="soft">
                {status.label}
              </Badge>
            </Flex>
            
            <Flex gap="4" className="text-[var(--text-secondary)]">
              <Flex align="center" gap="1">
                <Building2 className="w-4 h-4" />
                <Text size="2">{vacancy.company}</Text>
              </Flex>
              <Flex align="center" gap="1">
                <MapPin className="w-4 h-4" />
                <Text size="2">{vacancy.location}</Text>
              </Flex>
            </Flex>
          </div>

          <Button 
            size="2" 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => setShowAgentDialog(true)}
          >
            <Bot className="w-4 h-4" />
            Create Agent
          </Button>
        </Flex>
      </div>

      {/* Description */}
      <Card className="p-4">
        <Text size="2" className="text-[var(--text-secondary)]">
          {vacancy.description}
        </Text>
      </Card>

      {/* Tabs */}
      <Tabs.Root defaultValue="questions">
        <Tabs.List>
          <Tabs.Trigger value="questions">
            <ListChecks className="w-4 h-4 mr-2" />
            Vragen ({questions.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="flow">
            <GitBranch className="w-4 h-4 mr-2" />
            Pre-screening Flow
          </Tabs.Trigger>
          <Tabs.Trigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-4">
          <Tabs.Content value="questions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KnockoutQuestions 
                questions={questions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
              />
              <QualifyingQuestions 
                questions={questions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="flow">
            <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
              <InterviewFlow questions={questions} />
            </Card>
          </Tabs.Content>

          <Tabs.Content value="chat">
            <div style={{ height: '500px' }}>
              <ChatInterface 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onApprove={handleApprove}
                onRegenerate={handleRegenerate}
                isLoading={isLoading}
              />
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>

      {/* Create Agent Dialog */}
      <Dialog.Root open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>
            {agentCreated ? 'Agent Aangemaakt!' : 'WhatsApp Agent Aanmaken'}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {agentCreated 
              ? 'Je agent is klaar! Test de agent door een telefoonnummer in te voeren.'
              : 'Maak een WhatsApp agent aan voor deze vacature met de geconfigureerde vragen.'
            }
          </Dialog.Description>

          {!agentCreated ? (
            <Flex direction="column" gap="3">
              <Card className="p-3 bg-blue-50 border-blue-200">
                <Text size="2" className="text-blue-800">
                  <strong>{questions.filter(q => q.type === 'knockout').length}</strong> knock-out vragen en{' '}
                  <strong>{questions.filter(q => q.type === 'qualifying').length}</strong> kwalificerende vragen worden gebruikt.
                </Text>
              </Card>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Annuleren
                  </Button>
                </Dialog.Close>
                <Button 
                  onClick={handleCreateAgent}
                  disabled={isLoading}
                  className="bg-blue-500"
                >
                  {isLoading ? 'Bezig...' : 'Agent Aanmaken'}
                </Button>
              </Flex>
            </Flex>
          ) : (
            <Flex direction="column" gap="3">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                <Bot className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <Text size="2" className="text-green-800">
                  Agent succesvol aangemaakt!
                </Text>
              </div>

              <Text size="2" weight="medium" className="text-[var(--text-primary)] mt-2">
                Test de agent
              </Text>
              
              <TextField.Root
                placeholder="+32 xxx xx xx xx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              >
                <TextField.Slot>
                  <Phone className="w-4 h-4 text-[var(--text-secondary)]" />
                </TextField.Slot>
              </TextField.Root>

              <Flex gap="3" mt="2" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Sluiten
                  </Button>
                </Dialog.Close>
                <Button 
                  onClick={handleTestAgent}
                  disabled={isLoading || !phoneNumber}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isLoading ? 'Verzenden...' : 'Test Versturen'}
                </Button>
              </Flex>
            </Flex>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
