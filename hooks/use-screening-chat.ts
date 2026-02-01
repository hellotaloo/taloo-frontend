import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
}

interface SSEEvent {
  type: 'status' | 'complete' | 'error';
  status?: string;
  message?: string;
  session_id?: string;
  is_complete?: boolean;
}

export function useScreeningChat(vacancyId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messageIdCounter = useRef(0);
  
  // Use refs for guards to avoid stale closure issues
  const isStartedRef = useRef(false);
  const isStartingRef = useRef(false);

  const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const addMessage = useCallback((content: string, isOutgoing: boolean, isNew = true): Message => {
    const newMessage: Message = {
      id: `msg-${messageIdCounter.current++}`,
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

  const sendMessage = useCallback(async (
    message: string, 
    candidateName?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    // Add user message to chat (except for START which is hidden)
    if (message !== 'START') {
      addMessage(message, true);
    }

    try {
      const body: Record<string, string | boolean> = {
        vacancy_id: vacancyId,
        message: message,
        is_test: true,
      };
      
      if (sessionId) body.session_id = sessionId;
      if (candidateName) body.candidate_name = candidateName;

      const response = await fetch(`${getBackendUrl()}/screening/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from the buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;
          
          const data = trimmedLine.slice(6);
          if (data === '[DONE]') {
            setIsLoading(false);
            return;
          }

          try {
            const event: SSEEvent = JSON.parse(data);
            
            if (event.type === 'complete') {
              // Hide typing indicator immediately when message is ready
              setIsLoading(false);
              
              // Add agent message
              addMessage(event.message || '', false);
              
              // Save session ID for subsequent messages
              if (event.session_id) {
                setSessionId(event.session_id);
              }
              
              // Show toast when interview is complete
              if (event.is_complete) {
                setIsComplete(true);
                toast.success('Interview voltooid', {
                  description: 'De test screening is afgerond.',
                });
              }
            } else if (event.type === 'error') {
              setIsLoading(false);
              setError(event.message || 'Unknown error');
            }
            // status events are used to show typing indicator (handled via isLoading)
          } catch {
            // Ignore parse errors for incomplete JSON chunks
          }
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      
      // Add error message to chat
      addMessage(`Er is een fout opgetreden: ${errorMessage}`, false);
    } finally {
      setIsLoading(false);
    }
  }, [vacancyId, sessionId, addMessage]);

  const startConversation = useCallback(async (candidateName: string = 'Laurijn'): Promise<void> => {
    // Prevent duplicate starts - use refs to avoid stale closure issues
    if (isStartingRef.current || isStartedRef.current) {
      return;
    }
    isStartingRef.current = true;
    isStartedRef.current = true;
    setIsStarting(true);
    setIsStarted(true);
    try {
      await sendMessage('START', candidateName);
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  }, [sendMessage]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    setIsStarted(false);
    setIsStarting(false);
    setIsComplete(false);
    // Reset refs immediately (no closure issues)
    isStartedRef.current = false;
    isStartingRef.current = false;
    messageIdCounter.current = 0;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    isStarted,
    isStarting,
    isComplete,
    sendMessage,
    startConversation,
    resetChat,
  };
}
