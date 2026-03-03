'use client';

import { IPhoneMockup, WhatsAppChat } from '@/components/blocks/phone-simulator';

export default function TestingPage() {
  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 -m-6 p-6">
      <IPhoneMockup>
        <WhatsAppChat />
      </IPhoneMockup>
    </div>
  );
}
