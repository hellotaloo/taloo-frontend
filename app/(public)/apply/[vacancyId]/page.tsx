'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SolliciteerDialog } from '@/components/blocks/channel-management';
import { Toaster } from 'sonner';

export default function ApplyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vacancyId = params.vacancyId as string;
  const source = searchParams.get('source') || 'widget';

  // TODO: Replace with real API call once public backend endpoint exists
  const hasVoice = true;
  const hasWhatsApp = true;
  const hasCv = true;

  const [isEmbedded, setIsEmbedded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);

  // Report content height to parent iframe
  useEffect(() => {
    if (!isEmbedded || !contentRef.current) return;

    const sendHeight = () => {
      if (!contentRef.current) return;
      const height = contentRef.current.scrollHeight;
      window.parent.postMessage({ type: 'taloo-resize', height }, '*');
    };

    sendHeight();

    const observer = new ResizeObserver(sendHeight);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [isEmbedded]);

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

  return (
    <div ref={contentRef} className="bg-white">
      <SolliciteerDialog
        open={true}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        vacancyId={vacancyId}
        vacancyTitle="Vacature"
        hasWhatsApp={hasWhatsApp}
        hasVoice={hasVoice}
        hasCv={hasCv}
        source={source}
        onSuccess={handleSuccess}
        embedded
      />
      <Toaster position="bottom-center" richColors />
    </div>
  );
}
