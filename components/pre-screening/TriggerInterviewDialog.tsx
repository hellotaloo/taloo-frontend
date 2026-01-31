'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail, MessageCircle, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  initiateOutboundScreening,
  isValidPhoneNumber,
  formatPhoneNumber,
  getScreeningErrorMessage,
  ScreeningChannel,
} from '@/lib/screening-api';

interface TriggerInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
}

type ApplicationMethod = 'email' | 'whatsapp' | 'phone';
type PhoneContactMethod = 'whatsapp' | 'phone';

export function TriggerInterviewDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyTitle,
  hasWhatsApp,
  hasVoice,
}: TriggerInterviewDialogProps) {
  // Email section fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailValue, setEmailValue] = useState('');
  // Phone section fields
  const [phoneFirstName, setPhoneFirstName] = useState('');
  const [phoneLastName, setPhoneLastName] = useState('');
  const [phoneValue, setPhoneValue] = useState('+32 ');
  // Default to whichever channel is available
  const defaultPhoneMethod: PhoneContactMethod = hasWhatsApp ? 'whatsapp' : 'phone';
  const [phoneContactMethod, setPhoneContactMethod] = useState<PhoneContactMethod>(defaultPhoneMethod);
  const [isSubmitting, setIsSubmitting] = useState<ApplicationMethod | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  const hasPhoneOption = hasWhatsApp || hasVoice;

  // Sync phoneContactMethod when available channels change
  useEffect(() => {
    // If current method is not available, switch to the available one
    if (phoneContactMethod === 'phone' && !hasVoice && hasWhatsApp) {
      setPhoneContactMethod('whatsapp');
    } else if (phoneContactMethod === 'whatsapp' && !hasWhatsApp && hasVoice) {
      setPhoneContactMethod('phone');
    }
  }, [hasWhatsApp, hasVoice, phoneContactMethod]);
  const hasBothPhoneOptions = hasWhatsApp && hasVoice;

  const handleSubmit = async (method: ApplicationMethod) => {
    setIsSubmitting(method);
    setPhoneError(null);
    
    // Handle email separately (not part of outbound screening API)
    if (method === 'email') {
      // TODO: Connect to email endpoint later
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Trigger interview via email:', { vacancyId, firstName, lastName, email: emailValue });
      setIsSubmitting(null);
      onOpenChange(false);
      setFirstName('');
      setLastName('');
      setEmailValue('');
      return;
    }
    
    // Handle phone/WhatsApp via outbound screening API
    const formattedPhone = formatPhoneNumber(phoneValue);
    
    // Validate phone number
    if (!isValidPhoneNumber(formattedPhone)) {
      setPhoneError('Ongeldig telefoonnummer formaat. Gebruik internationaal formaat (bijv. +32471234567).');
      setIsSubmitting(null);
      return;
    }
    
    // Map method to API channel
    const channel: ScreeningChannel = method === 'whatsapp' ? 'whatsapp' : 'voice';
    
    try {
      const result = await initiateOutboundScreening({
        vacancy_id: vacancyId,
        channel,
        phone_number: formattedPhone,
        candidate_name: phoneFirstName || undefined,
      });
      
      if (result.success) {
        // Show success toast
        if (channel === 'voice') {
          toast.success('De kandidaat wordt nu gebeld');
        } else {
          toast.success('WhatsApp bericht verzonden!');
        }
        
        // Close dialog and reset
        onOpenChange(false);
        setPhoneFirstName('');
        setPhoneLastName('');
        setPhoneValue('+32 ');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis';
      setPhoneError(getScreeningErrorMessage(errorMessage));
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-5xl! p-0 gap-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <AlertDialogHeader className="px-8 pt-8 pb-6">
          <AlertDialogTitle className="text-3xl font-semibold text-center text-gray-900">
            Hoe wil je solliciteren?
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Option cards - 2 columns if phone available, 1 column if only email */}
        <div className={`grid gap-5 px-8 pb-8 ${hasPhoneOption ? 'grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
          {/* Option 1: Apply by email */}
          <div className="flex flex-col rounded-xl border border-gray-200 p-6 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-gray-900">Solliciteer via e-mail</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 grow">
              Alleen een e-mailadres is nodig. We controleren of je al geregistreerd bent en nemen je mee naar de volgende stap.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Voornaam"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CDFE00]/50 focus:border-[#CDFE00]"
                />
                <input
                  type="text"
                  placeholder="Achternaam"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CDFE00]/50 focus:border-[#CDFE00]"
                />
              </div>
              <input
                type="email"
                placeholder="jouw@email.com"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CDFE00]/50 focus:border-[#CDFE00]"
              />
              <button
                onClick={() => handleSubmit('email')}
                disabled={!emailValue || !firstName || !lastName || isSubmitting !== null}
                className="w-full py-3 px-4 rounded-lg bg-[#CDFE00] text-gray-900 font-medium hover:bg-[#bce900] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting === 'email' ? 'Bezig...' : 'Doorgaan met e-mail'}
              </button>
            </div>
          </div>

          {/* Option 2: Apply by phone (WhatsApp or Voice) - only show if at least one is available */}
          {hasPhoneOption && (
            <div className="flex flex-col rounded-xl border border-gray-200 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                {hasWhatsApp && !hasVoice ? (
                  <MessageCircle className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                ) : (
                  <Phone className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {hasWhatsApp && !hasVoice 
                    ? 'Solliciteer via WhatsApp' 
                    : hasVoice && !hasWhatsApp 
                      ? 'Solliciteer via telefoon'
                      : 'Solliciteer via telefoon'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 grow">
                Geen CV, geen formulieren. Onze virtuele assistent begeleidt je en regelt de rest.
              </p>
              
              {/* Toggle between WhatsApp and Call - only show if both are available */}
              {hasBothPhoneOptions && (
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setPhoneContactMethod('whatsapp')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      phoneContactMethod === 'whatsapp'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp mij
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneContactMethod('phone')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      phoneContactMethod === 'phone'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Bel mij
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Voornaam"
                    value={phoneFirstName}
                    onChange={(e) => setPhoneFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CDFE00]/50 focus:border-[#CDFE00]"
                  />
                  <input
                    type="text"
                    placeholder="Achternaam"
                    value={phoneLastName}
                    onChange={(e) => setPhoneLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CDFE00]/50 focus:border-[#CDFE00]"
                  />
                </div>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border bg-white ${
                  phoneError ? 'border-red-300' : 'border-gray-200'
                }`}>
                  {/* Belgian flag */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-6 h-4 rounded-sm overflow-hidden flex">
                      <div className="w-1/3 bg-black" />
                      <div className="w-1/3 bg-yellow-400" />
                      <div className="w-1/3 bg-red-500" />
                    </div>
                  </div>
                  <input
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => {
                      setPhoneValue(e.target.value);
                      setPhoneError(null); // Clear error on input change
                    }}
                    className="flex-1 text-gray-700 focus:outline-none bg-transparent"
                    placeholder="+32 XXX XX XX XX"
                  />
                </div>
                
                {/* Error message */}
                {phoneError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {phoneError}
                  </div>
                )}
                
                <button
                  onClick={() => handleSubmit(phoneContactMethod)}
                  disabled={phoneValue.replace(/\s/g, '').length < 12 || !phoneFirstName || !phoneLastName || isSubmitting !== null}
                  className="w-full py-3 px-4 rounded-lg bg-[#CDFE00] text-gray-900 font-medium hover:bg-[#bce900] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting === phoneContactMethod
                    ? phoneContactMethod === 'whatsapp' ? 'Bezig...' : 'Bellen...'
                    : phoneContactMethod === 'whatsapp' ? 'Doorgaan met WhatsApp' : 'Bel mij op'
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
