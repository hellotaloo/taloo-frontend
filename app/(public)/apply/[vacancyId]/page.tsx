'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ApplicationForm } from '@/components/blocks/application-form';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface VacancyPublicInfo {
  id: string;
  title: string;
  company: string;
  isOnline: boolean;
  channels: { voice: boolean; whatsapp: boolean; cv: boolean };
}

export default function ApplyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vacancyId = params.vacancyId as string;
  const source = searchParams.get('source') || 'widget';

  const [vacancy, setVacancy] = useState<VacancyPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect if running inside an iframe
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true); // Cross-origin iframe blocks access
    }

    fetch(`${BACKEND_URL}/vacancies/${vacancyId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'not_found' : 'error');
        return res.json();
      })
      .then((data) => {
        setVacancy({
          id: data.id,
          title: data.title,
          company: data.company || '',
          isOnline: data.is_online,
          channels: data.channels || { voice: false, whatsapp: false, cv: false },
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [vacancyId]);

  // Report content height to parent iframe so the modal fits snugly
  useEffect(() => {
    if (!isEmbedded || !contentRef.current) return;

    const sendHeight = () => {
      if (!contentRef.current) return;
      const height = contentRef.current.scrollHeight;
      window.parent.postMessage({ type: 'taloo-resize', height }, '*');
    };

    // Send initial height
    sendHeight();

    // Observe size changes (e.g. form → processing → confirmation)
    const observer = new ResizeObserver(sendHeight);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [isEmbedded, vacancy, loading, error]);

  const handleClose = () => {
    if (isEmbedded) {
      window.parent.postMessage({ type: 'taloo-close' }, '*');
    }
  };

  const handleSuccess = (result: { method: 'email' | 'whatsapp' | 'phone'; applicationId?: string }) => {
    if (isEmbedded) {
      window.parent.postMessage({ type: 'taloo-success', ...result }, '*');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Error states
  if (error === 'not_found' || !vacancy) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Vacature niet gevonden</h1>
          <p className="text-gray-500">Deze vacature bestaat niet of is niet meer beschikbaar.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Er ging iets mis</h1>
          <p className="text-gray-500">Probeer het later opnieuw.</p>
        </div>
      </div>
    );
  }

  // Vacancy is offline
  if (!vacancy.isOnline) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Niet beschikbaar</h1>
          <p className="text-gray-500">Deze vacature accepteert momenteel geen sollicitaties.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={contentRef} className={`bg-white ${isEmbedded ? 'p-0' : 'min-h-screen flex items-center justify-center p-4'}`}>
      <div className="w-full max-w-5xl mx-auto">
        {/* Branding header when accessed directly (not in iframe) */}
        {!isEmbedded && (
          <div className="text-center mb-8">
            <img src="/taloo-logo.svg" alt="Taloo" className="h-8 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">{vacancy.title}</h1>
            {vacancy.company && (
              <p className="text-gray-500 mt-1">{vacancy.company}</p>
            )}
          </div>
        )}

        <ApplicationForm
          vacancyId={vacancy.id}
          vacancyTitle={vacancy.title}
          hasWhatsApp={vacancy.channels.whatsapp}
          hasVoice={vacancy.channels.voice}
          hasCv={vacancy.channels.cv}
          source={source}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
      <Toaster position="bottom-center" richColors />
    </div>
  );
}
