import { useState, useCallback, useRef } from 'react';
import { runSimulation } from '@/lib/interview-api';
import type { 
  SimulationPersona, 
  SimulationSSEEvent, 
  SimulationQAPair 
} from '@/lib/types';

interface SimulationMessage {
  id: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
}

interface SimulationResult {
  simulationId: string;
  outcome: 'completed' | 'max_turns_reached';
  qaPairs: SimulationQAPair[];
  totalTurns: number;
}

export function useSimulationChat(vacancyId: string) {
  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [candidateName, setCandidateName] = useState<string>('');
  
  const messageIdCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const addMessage = useCallback((content: string, isOutgoing: boolean, isNew = true): SimulationMessage => {
    const newMessage: SimulationMessage = {
      id: `sim-msg-${messageIdCounter.current++}`,
      content,
      timestamp: getCurrentTime(),
      isOutgoing,
      status: isOutgoing ? 'read' : undefined,
      isNew,
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Remove isNew flag after animation
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      );
    }, 400);
    
    return newMessage;
  }, []);

  const startSimulation = useCallback(async (
    persona: SimulationPersona = 'qualified',
    customPersona?: string,
    name?: string
  ): Promise<void> => {
    if (!vacancyId) {
      setError('No vacancy ID provided');
      return;
    }

    // Reset state
    setMessages([]);
    setIsRunning(true);
    setIsComplete(false);
    setError(null);
    setResult(null);
    messageIdCounter.current = 0;

    try {
      await runSimulation(
        vacancyId,
        (event: SimulationSSEEvent) => {
          switch (event.type) {
            case 'start':
              setCandidateName(event.candidate_name);
              break;
              
            case 'agent':
              // Agent messages appear on the left (not outgoing)
              addMessage(event.message, false);
              break;
              
            case 'candidate':
              // Candidate messages appear on the right (outgoing)
              addMessage(event.message, true);
              break;
              
            case 'complete':
              setIsRunning(false);
              setIsComplete(true);
              setResult({
                simulationId: event.simulation_id,
                outcome: event.outcome,
                qaPairs: event.qa_pairs,
                totalTurns: event.total_turns,
              });
              break;
              
            case 'error':
              setIsRunning(false);
              setError(event.message);
              break;
          }
        },
        {
          persona,
          custom_persona: customPersona ?? null,
          candidate_name: name,
        }
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Simulation failed';
      setError(errorMessage);
      setIsRunning(false);
    }
  }, [vacancyId, addMessage]);

  const reset = useCallback(() => {
    // Abort any ongoing simulation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setMessages([]);
    setIsRunning(false);
    setIsComplete(false);
    setError(null);
    setResult(null);
    setCandidateName('');
    messageIdCounter.current = 0;
  }, []);

  return {
    messages,
    isRunning,
    isComplete,
    error,
    result,
    candidateName,
    startSimulation,
    reset,
  };
}
