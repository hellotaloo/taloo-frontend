import { useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
  imageUrl?: string;
}

export interface CollectionProgressItem {
  slug: string;
  name: string;
  type: 'document' | 'attribute' | 'task' | 'document_group';
  collected: boolean;
  value?: string | Record<string, string>;
  resolved_slug?: string | null;
  alternatives?: { slug: string; name: string }[];
}

export interface CollectionReviewFlag {
  slug: string;
  flag: string;
  reason: string;
}

export interface CollectionStepProgress {
  step: number;
  type: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface CollectionProgress {
  items: CollectionProgressItem[];
  steps?: CollectionStepProgress[];
  current_step?: string;
  current_step_index?: number;
  collected_documents: string[];
  collected_attributes: Record<string, string | Record<string, string>>;
  eu_citizen?: boolean;
  review_flags?: CollectionReviewFlag[];
}

interface SSEEvent {
  type: 'status' | 'complete' | 'error';
  status?: string;
  message?: string;
  session_id?: string;
  candidate_name?: string;
  is_complete?: boolean;
  collection_progress?: CollectionProgress;
}

export type PlaygroundAgentType = 'pre_screening' | 'document_collection';

interface UsePlaygroundChatOptions {
  agentType: PlaygroundAgentType;
}

export function usePlaygroundChat(contextId: string, options: UsePlaygroundChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [collectionProgress, setCollectionProgress] = useState<CollectionProgress | null>(null);
  const messageIdCounter = useRef(0);

  const isStartedRef = useRef(false);
  const isStartingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      );
    }, 400);

    return newMessage;
  }, []);

  const addImageMessage = useCallback((imageUrl: string, caption?: string): Message => {
    const newMessage: Message = {
      id: `msg-${messageIdCounter.current++}`,
      content: caption || '',
      timestamp: getCurrentTime(),
      isOutgoing: true,
      status: 'read',
      isNew: true,
      imageUrl,
    };

    setMessages(prev => [...prev, newMessage]);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      );
    }, 400);

    return newMessage;
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'complete') {
      setIsLoading(false);
      addMessage(event.message || '', false);

      if (event.session_id) {
        setSessionId(event.session_id);
      }

      if (event.collection_progress) {
        setCollectionProgress(event.collection_progress);
      }

      if (event.is_complete) {
        setIsComplete(true);
      }
    } else if (event.type === 'error') {
      setIsLoading(false);
      setError(event.message || 'Unknown error');
    }
  }, [addMessage]);

  const sendMessage = useCallback(async (
    message: string,
    candidateName?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    if (message !== 'START') {
      addMessage(message, true);
    }

    try {
      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const body: Record<string, string | boolean> = {
        agent_type: options.agentType,
        message,
      };

      // Set the right context ID based on agent type
      if (options.agentType === 'pre_screening') {
        body.vacancy_id = contextId;
      } else if (options.agentType === 'document_collection') {
        body.collection_id = contextId;
      }

      if (sessionId) body.session_id = sessionId;
      if (candidateName) body.candidate_name = candidateName;

      const response = await fetch(`${getBackendUrl()}/playground/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
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

        const lines = buffer.split('\n');
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
            handleSSEEvent(event);
          } catch {
            // Ignore parse errors for incomplete JSON chunks
          }
        }
      }
    } catch (e) {
      // Ignore aborted requests (happens on reset)
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      addMessage(`Er is een fout opgetreden: ${errorMessage}`, false);
    } finally {
      setIsLoading(false);
    }
  }, [contextId, sessionId, addMessage, handleSSEEvent, options.agentType]);

  const sendImage = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Show image preview immediately
    const localUrl = URL.createObjectURL(file);
    addImageMessage(localUrl, '');

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract the base64 part after the data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const body: Record<string, string | boolean> = {
        agent_type: options.agentType,
        message: '[image]',
        image_base64: base64,
        image_mime_type: file.type,
      };

      if (options.agentType === 'pre_screening') {
        body.vacancy_id = contextId;
      } else if (options.agentType === 'document_collection') {
        body.collection_id = contextId;
      }

      if (sessionId) body.session_id = sessionId;

      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch(`${getBackendUrl()}/playground/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
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

        const lines = buffer.split('\n');
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
            handleSSEEvent(event);
          } catch {
            // Ignore parse errors for incomplete JSON chunks
          }
        }
      }
    } catch (e) {
      // Ignore aborted requests (happens on reset)
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      addMessage(`Er is een fout opgetreden: ${errorMessage}`, false);
    } finally {
      setIsLoading(false);
    }
  }, [contextId, sessionId, addMessage, addImageMessage, handleSSEEvent, options.agentType]);

  const startConversation = useCallback(async (candidateName?: string): Promise<void> => {
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
    // Abort any in-flight request so old responses don't leak into the new session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setSessionId(null);
    setError(null);
    setIsStarted(false);
    setIsStarting(false);
    setIsComplete(false);
    setCollectionProgress(null);
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
    sendImage,
    startConversation,
    resetChat,
    collectionProgress,
  };
}
